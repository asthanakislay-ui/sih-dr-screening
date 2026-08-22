import torch
import timm
from PIL import Image
from torchvision import transforms
from typing import Dict, Optional


class DRModel:
    CLASS_NAMES = ["No DR", "Mild", "Moderate", "Severe", "Proliferative"]

    def __init__(
        self,
        weights_path: Optional[str] = None,
        device: str = "cuda" if torch.cuda.is_available() else "cpu",
    ):
        self.device = torch.device(device)
        self.model = timm.create_model(
            "efficientnet_b0", pretrained=False, num_classes=5
        ).to(self.device)
        self.model.eval()

        self.preprocess_tf = transforms.Compose(
            [
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ]
        )

        if weights_path:
            self.load_weights(weights_path)

    def preprocess(self, image_path: str) -> torch.Tensor:
        img = Image.open(image_path).convert("RGB")
        return self.preprocess_tf(img).unsqueeze(0).to(self.device)

    @torch.no_grad()
    def predict(self, tensor: torch.Tensor) -> Dict:
        logits = self.model(tensor)
        probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
        class_idx = int(probs.argmax())
        return {
            "class_idx": class_idx,
            "class_name": self.CLASS_NAMES[class_idx],
            "confidence": float(probs[class_idx]),
            "all_probs": probs.tolist(),
        }

    def load_weights(self, path: str) -> None:
        state_dict = torch.load(path, map_location=self.device)
        self.model.load_state_dict(state_dict, strict=False)
        self.model.eval()