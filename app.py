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
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty file")

        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        try:
            input_tensor = dr_model.preprocess(tmp_path)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read image: {str(e)}")

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