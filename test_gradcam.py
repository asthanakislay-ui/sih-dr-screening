import cv2
import numpy as np

from model import DRModel
from gradcam import GradCAM


# -----------------------------
# 1. Load model
# -----------------------------

model = DRModel(
    weights_path="weights/dr_model.pth"
)

# -----------------------------
# 2. Preprocess image
# -----------------------------

image_path = "fundus_img.png"

tensor = model.preprocess(image_path)

# -----------------------------
# 3. Get prediction
# -----------------------------

result = model.predict(tensor)

print("Prediction:")
print(result)

# -----------------------------
# 4. Generate Grad-CAM
# -----------------------------

cam = GradCAM(model.model)

heatmap = cam.generate(
    tensor,
    class_idx=result["class_idx"]
)

# -----------------------------
# 5. Load original image
# -----------------------------

original = cv2.imread(image_path)

original = cv2.resize(
    original,
    (224, 224)
)

original_rgb = cv2.cvtColor(
    original,
    cv2.COLOR_BGR2RGB
)

# -----------------------------
# 6. Overlay Grad-CAM
# -----------------------------

overlay = cam.overlay_on_image(
    original_rgb,
    heatmap
)

# -----------------------------
# 7. Save result
# -----------------------------

cv2.imwrite(
    "gradcam_overlay.png",
    cv2.cvtColor(
        overlay,
        cv2.COLOR_RGB2BGR
    )
)

# -----------------------------
# 8. Cleanup
# -----------------------------

cam.remove_hooks()

print("Saved gradcam_overlay.png")