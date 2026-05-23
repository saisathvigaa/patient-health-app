"""Main OCR pipeline: file → images → text → structured data."""
import os
import fitz  # PyMuPDF
from app.ocr.preprocessor import preprocess_image
from app.ocr.vision_client import vision_client
from app.ocr.parsers.mani_lab import ManiLabParser
from app.ocr.parsers.bioline import BiolineParser
from app.ocr.parsers.generic import GenericParser


# Register parsers in priority order
PARSERS = [
    ManiLabParser(),
    BiolineParser(),
    GenericParser(),  # Always last — fallback
]


def pdf_to_images(pdf_path: str) -> list[bytes]:
    """Convert each page of a PDF to a PNG image (bytes)."""
    doc = fitz.open(pdf_path)
    images = []
    for page in doc:
        # Render at 2x resolution for OCR accuracy
        mat = fitz.Matrix(2, 2)
        pix = page.get_pixmap(matrix=mat)
        images.append(pix.tobytes("png"))
    doc.close()
    return images


def image_file_to_bytes(image_path: str) -> list[bytes]:
    """Read an image file and return as list of bytes (single-element for images)."""
    with open(image_path, "rb") as f:
        return [f.read()]


async def process_report(file_path: str) -> dict:
    """
    Full OCR pipeline:
    1. Convert file to images (if PDF)
    2. Pre-process each image
    3. Run Google Vision OCR on each
    4. Concatenate all text
    5. Detect lab format and parse
    6. Return structured data
    """
    # Step 1: Get images from file
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        raw_images = pdf_to_images(file_path)
    else:
        raw_images = image_file_to_bytes(file_path)

    # Step 2 & 3: Pre-process and OCR each page
    all_text = []
    for img_bytes in raw_images:
        preprocessed = preprocess_image(img_bytes)
        page_text = vision_client.extract_text(preprocessed)
        all_text.append(page_text)

    full_text = "\n\n".join(all_text)

    if not full_text.strip():
        return {
            "lab_name": "Unknown",
            "bill_id": "",
            "report_type": "Blood Test",
            "lab_values": [],
            "raw_text": "",
            "parser_used": "none",
            "error": "No text extracted from document",
        }

    # Step 4: Detect format and parse
    for parser in PARSERS:
        if parser.can_parse(full_text):
            result = parser.parse(full_text)
            result["raw_text"] = full_text
            result["parser_used"] = parser.__class__.__name__
            return result

    # Should never reach here since GenericParser always returns True
    return {
        "lab_name": "Unknown",
        "bill_id": "",
        "report_type": "Blood Test",
        "lab_values": [],
        "raw_text": full_text,
        "parser_used": "none",
    }
