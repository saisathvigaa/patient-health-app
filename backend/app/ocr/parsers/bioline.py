"""Parser for Bioline Laboratory report format."""
import re
from app.ocr.parsers.base import BaseParser, ParsedValue


class BiolineParser(BaseParser):
    """
    Parser for Bioline Laboratory / Bioline Diagnostics, Coimbatore.
    Format: structured sections with Test | Result | Unit | Reference Range
    """

    def can_parse(self, text: str) -> bool:
        indicators = ["bioline", "bio line", "bioline diagnostics"]
        text_lower = text.lower()
        return any(ind in text_lower for ind in indicators)

    def parse(self, text: str) -> dict:
        result = {
            "lab_name": "Bioline Laboratory",
            "bill_id": self._extract_bill_id(text),
            "report_type": "Blood Test",
            "lab_values": [],
        }

        lines = text.split("\n")
        current_category = ""

        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue

            # Detect category headers
            upper = line.upper()
            if any(h in upper for h in [
                "KIDNEY", "RENAL", "HAEMATOLOGY", "CBC",
                "LIPID", "LIVER", "THYROID", "SUGAR", "ELECTROLYTE",
                "URINE", "DIFFERENTIAL",
            ]):
                current_category = line.strip()
                continue

            # Try to parse as a data row
            parsed = self._try_parse_row(line, current_category)
            if parsed:
                result["lab_values"].append(parsed.to_dict())

        return result

    def _try_parse_row(self, line: str, category: str):
        """Try to parse a line as a test result row."""
        # Bioline format: "Test Name    Value    Unit    Ref Range"
        # Split by 2+ whitespace
        parts = re.split(r'\s{2,}', line)
        if len(parts) < 2:
            return None

        test_name = parts[0].strip()
        if not test_name or test_name.upper() in ["TEST", "NAME", "PARAMETER", "RESULT"]:
            return None

        # Find the numeric value
        value_text = parts[1].strip() if len(parts) > 1 else ""
        if not value_text:
            return None

        unit = parts[2].strip() if len(parts) > 2 else self._extract_unit(line)
        ref_text = parts[3].strip() if len(parts) > 3 else ""
        ref_low, ref_high = self._parse_ref_range(ref_text) if ref_text else (None, None)

        # Skip header-like rows
        if any(skip in test_name.lower() for skip in ["method", "sample", "date", "patient"]):
            return None

        return ParsedValue(
            test_name=test_name,
            test_category=category,
            value_text=value_text,
            unit=unit,
            ref_low=ref_low,
            ref_high=ref_high,
            confidence=0.75,
        )

    def _extract_bill_id(self, text: str) -> str:
        match = re.search(r'SID\s*:?\s*(\d+)', text, re.IGNORECASE)
        if match:
            return match.group(1)
        match = re.search(r'Bill\s*No\s*:?\s*(\d+)', text, re.IGNORECASE)
        if match:
            return match.group(1)
        return ""
