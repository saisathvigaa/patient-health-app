"""Google Cloud Vision API client wrapper."""
from google.cloud import vision
from typing import Optional
import os


class VisionClient:
    """Wrapper around Google Cloud Vision for OCR text extraction."""

    def __init__(self):
        self._client: Optional[vision.ImageAnnotatorClient] = None

    @property
    def client(self) -> vision.ImageAnnotatorClient:
        if self._client is None:
            self._client = vision.ImageAnnotatorClient()
        return self._client

    def extract_text(self, image_bytes: bytes) -> str:
        """
        Extract text from image bytes using Google Cloud Vision.
        Returns the full text as a string.
        """
        image = vision.Image(content=image_bytes)
        response = self.client.document_text_detection(image=image)

        if response.error.message:
            raise RuntimeError(f"Vision API error: {response.error.message}")

        if not response.full_text_annotation:
            return ""

        return response.full_text_annotation.text

    def extract_text_with_layout(self, image_bytes: bytes) -> dict:
        """
        Extract text with bounding box layout information.
        Returns structured data including word positions for table parsing.
        """
        image = vision.Image(content=image_bytes)
        response = self.client.document_text_detection(image=image)

        if response.error.message:
            raise RuntimeError(f"Vision API error: {response.error.message}")

        result = {
            "full_text": "",
            "pages": [],
        }

        if not response.full_text_annotation:
            return result

        result["full_text"] = response.full_text_annotation.text

        for page in response.full_text_annotation.pages:
            page_data = {"blocks": []}
            for block in page.blocks:
                block_data = {"paragraphs": [], "confidence": block.confidence}
                for paragraph in block.paragraphs:
                    words = []
                    for word in paragraph.words:
                        word_text = "".join(s.text for s in word.symbols)
                        bbox = word.bounding_box
                        words.append({
                            "text": word_text,
                            "confidence": word.confidence,
                            "bounds": {
                                "x1": min(v.x for v in bbox.vertices),
                                "y1": min(v.y for v in bbox.vertices),
                                "x2": max(v.x for v in bbox.vertices),
                                "y2": max(v.y for v in bbox.vertices),
                            },
                        })
                    block_data["paragraphs"].append({
                        "text": " ".join(w["text"] for w in words),
                        "words": words,
                    })
                page_data["blocks"].append(block_data)
            result["pages"].append(page_data)

        return result


# Singleton instance
vision_client = VisionClient()
