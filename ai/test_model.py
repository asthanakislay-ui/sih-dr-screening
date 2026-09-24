from model import DRModel


# Load trained model
model = DRModel(
    weights_path="weights/dr_model.pth"
)

print("Model loaded successfully!")
print("Device:", model.device)


# Preprocess the fundus image
tensor = model.preprocess(
    "fundus_img.png"
)

print("Image preprocessed successfully!")
print("Tensor shape:", tensor.shape)


# Run inference
result = model.predict(tensor)

print("\nPrediction:")
print(result)