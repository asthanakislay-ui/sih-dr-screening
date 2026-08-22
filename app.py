import time
import base64
import tempfile
import os
from io import BytesIO

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import numpy as np
from PIL import Image
import cv2

from model import DRModel
from gradcam import GradCAM


app = FastAPI(title="DR Screening API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WEIGHTS_PATH = "weights/dr_model.pth"

dr_model = DRModel(weights_path=WEIGHTS_PATH)
gradcam = GradCAM(dr_model.model, target_layer_name="conv_head")


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    start_time = time.time()

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail={"error": "Invalid or corrupted image file"},
        )

    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(
                status_code=400,
                detail={"error": "Invalid or corrupted image file"},
            )

        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        try:
            input_tensor = dr_model.preprocess(tmp_path)
        except Exception:
            raise HTTPException(
                status_code=400,
                detail={"error": "Invalid or corrupted image file"},
            )
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=400,
            detail={"error": "Invalid or corrupted image file"},
        )

    try:
        prediction = dr_model.predict(input_tensor)
        class_idx = prediction["class_idx"]

        heatmap = gradcam.generate(input_tensor, class_idx=class_idx)

        original_img = Image.open(BytesIO(contents)).convert("RGB")
        original_array = np.array(original_img)

        overlay = gradcam.overlay_on_image(original_array, heatmap, alpha=0.5)

        _, buffer = cv2.imencode(".png", cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR))
        heatmap_base64 = base64.b64encode(buffer).decode("utf-8")

        processing_time_ms = int((time.time() - start_time) * 1000)

        return {
            "class_idx": prediction["class_idx"],
            "class_name": prediction["class_name"],
            "confidence": prediction["confidence"],
            "all_probs": prediction["all_probs"],
            "heatmap_base64": heatmap_base64,
            "processing_time_ms": processing_time_ms,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model inference error: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)


def run_test_predictions():
    """Test /predict endpoint with 5 images from test_images/"""
    from fastapi.testclient import TestClient
    from PIL import Image
    import tempfile

    client = TestClient(app)

    test_dir = "test_images"
    os.makedirs(test_dir, exist_ok=True)

    test_files = [
        os.path.join(test_dir, f)
        for f in os.listdir(test_dir)
        if f.lower().endswith((".png", ".jpg", ".jpeg"))
    ]

    # Create synthetic images to reach 5 total
    while len(test_files) < 5:
        i = len(test_files)
        img = Image.fromarray(
            np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        )
        path = os.path.join(test_dir, f"synthetic_test_{i}.png")
        img.save(path)
        test_files.append(path)

    test_files = test_files[:5]
    print(f"Testing with {len(test_files)} images:\n")

    for i, img_path in enumerate(test_files):
        with open(img_path, "rb") as f:
            r = client.post("/predict", files={"file": (f"test_{i}.png", f, "image/png")})

        if r.status_code == 200:
            data = r.json()
            print(f"Image {i + 1}: {os.path.basename(img_path)}")
            print(f"  processing_time_ms: {data.get('processing_time_ms')}")
            print(f"  JSON keys: {sorted(data.keys())}")
            print(f"  class_idx: {data.get('class_idx')}")
            print(f"  class_name: {data.get('class_name')}")
            print(f"  confidence: {data.get('confidence'):.4f}")
        else:
            print(f"Image {i + 1}: {os.path.basename(img_path)}")
            print(f"  ERROR: {r.status_code} - {r.json()}")
        print()