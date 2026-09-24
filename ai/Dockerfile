# AI Service (FastAPI + PyTorch) Dockerfile
FROM python:3.11-slim

# Install system dependencies for OpenCV and PyTorch
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create test_images directory (created at runtime by test scripts)
RUN mkdir -p test_images

# Expose port
EXPOSE 8000

# Run the FastAPI app
CMD ["python", "app.py"]