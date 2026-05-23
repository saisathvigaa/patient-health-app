FROM python:3.12-slim

WORKDIR /app

# System deps for PyMuPDF and Pillow
RUN apt-get update && apt-get install -y \
    libmupdf-dev \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
