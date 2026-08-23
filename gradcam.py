import torch
import torch.nn.functional as F
import numpy as np
import cv2
from typing import Optional, Tuple


class GradCAM:
    def __init__(self, model: torch.nn.Module, target_layer_name: str = "conv_head"):
        self.model = model
        self.target_layer_name = target_layer_name
        self._activations = None
        self._gradients = None
        self._hooks = []
        self._register_hooks()

    def _get_target_layer(self) -> torch.nn.Module:
        return dict(self.model.named_modules())[self.target_layer_name]

    def _register_hooks(self) -> None:
        target_layer = self._get_target_layer()

        def forward_hook(module, input, output):
            self._activations = output.detach()

        def backward_hook(module, grad_input, grad_output):
            self._gradients = grad_output[0].detach()

        self._hooks.append(target_layer.register_forward_hook(forward_hook))
        self._hooks.append(target_layer.register_full_backward_hook(backward_hook))

    def generate(
        self, input_tensor: torch.Tensor, class_idx: Optional[int] = None
    ) -> np.ndarray:
        # Grad-CAM needs autograd tracking; if the caller invoked us from
        # inside a `torch.no_grad()` block (e.g. via @torch.no_grad on the
        # predict() method), nested calls would otherwise see gradients
        # disabled. Enable locally so the backward pass can populate the
        # registered hooks regardless of caller context.
        with torch.enable_grad():
            # Ensure the input participates in the autograd graph. The
            # preprocessing pipeline does not set requires_grad, so we
            # turn it on here without mutating the caller's tensor.
            x = input_tensor.detach().clone().requires_grad_(True)

            self.model.eval()
            output = self.model(x)

            if class_idx is None:
                class_idx = output.argmax(dim=1).item()

            self.model.zero_grad()
            loss = output[0, class_idx]
            loss.backward()

        weights = self._gradients.mean(dim=(2, 3), keepdim=True)
        cam = (weights * self._activations).sum(dim=1, keepdim=True)
        cam = F.relu(cam)

        cam = F.interpolate(cam, size=(224, 224), mode="bilinear", align_corners=False)
        cam = cam.squeeze().cpu().numpy()

        cam_min, cam_max = cam.min(), cam.max()
        if cam_max > cam_min:
            cam = (cam - cam_min) / (cam_max - cam_min)

        return cam

    def overlay_on_image(
        self, original_image: np.ndarray, heatmap: np.ndarray, alpha: float = 0.5
    ) -> np.ndarray:
        if original_image.dtype != np.uint8:
            original_image = (original_image * 255).astype(np.uint8)

        if heatmap.max() <= 1.0:
            heatmap = (heatmap * 255).astype(np.uint8)

        heatmap_colored = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
        heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

        if original_image.shape[:2] != heatmap_colored.shape[:2]:
            heatmap_colored = cv2.resize(
                heatmap_colored, (original_image.shape[1], original_image.shape[0])
            )

        overlay = cv2.addWeighted(original_image, 1 - alpha, heatmap_colored, alpha, 0)
        return overlay

    def remove_hooks(self) -> None:
        for hook in self._hooks:
            hook.remove()
        self._hooks.clear()
        self._activations = None
        self._gradients = None