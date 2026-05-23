"""Image pre-processing for OCR accuracy improvement."""
from PIL import Image, ImageEnhance, ImageFilter
import io


def preprocess_image(image_bytes: bytes) -> bytes:
    """
    Enhance an image for better OCR results.
    - Convert to grayscale
    - Increase contrast
    - Sharpen
    - Resize if too small
    """
    img = Image.open(io.BytesIO(image_bytes))

    # Convert to RGB if needed (handles RGBA, P mode, etc.)
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    # Resize if image is small (below 1500px width)
    width, height = img.size
    if width < 1500:
        scale = 1500 / width
        img = img.resize((int(width * scale), int(height * scale)), Image.LANCZOS)

    # Convert to grayscale
    img = img.convert("L")

    # Increase contrast
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.5)

    # Sharpen
    img = img.filter(ImageFilter.SHARPEN)

    # Convert back to bytes
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()
