"""Parser for Mani Microbiological Laboratory report format."""
import re
from app.ocr.parsers.base import BaseParser, ParsedValue


class ManiLabParser(BaseParser):
    """
    Parser for Mani Microbiological Laboratory, Coimbatore.
    Format: tabular with columns — Spec.type | Test Name | Results | Previous | units | Reference
    """

    def can_parse(self, text: str) -> bool:
        indicators = [
            "mani microbiological",
            "microbiological laboratory",
            "microlabindia",
            "Dr.Dominic MD",
        ]
        text_lower = text.lower()
        return any(ind.lower() in text_lower for ind in indicators)

    def parse(self, text: str) -> dict:
        result = {
            "lab_name": "Mani Microbiological Laboratory",
            "bill_id": self._extract_bill_id(text),
            "report_type": "Blood Test",
            "lab_values": [],
        }

        lines = text.split("\n")
        current_category = ""

        # Known test patterns with their categories
        test_patterns = {
            # RFT / Biochemistry
            "UREA": "Renal Function",
            "CREATININE": "Renal Function",
            "Uric Acid": "Renal Function",
            "CALCIUM": "Renal Function",
            "PHOSPHOROUS": "Renal Function",
            "PHOSPHORUS": "Renal Function",
            # Electrolytes
            "SODIUM": "Electrolytes",
            "POTASSIUM": "Electrolytes",
            "CHLORIDE": "Electrolytes",
            "BICARBONATE": "Electrolytes",
            # CBC
            "HAEMOGLOBIN": "CBC",
            "Hemoglobin": "CBC",
            "TOTAL WBC": "CBC",
            "WBC COUNT": "CBC",
            "RBC COUNT": "CBC",
            "PLATELET": "CBC",
            "PCV": "CBC",
            "MCV": "CBC",
            "MCH": "CBC",
            "MCHC": "CBC",
            # Differential
            "NEUTROPHIL": "Differential Count",
            "LYMPHOCYTE": "Differential Count",
            "MONOCYTE": "Differential Count",
            "EOSINOPHIL": "Differential Count",
            "BASOPHIL": "Differential Count",
            # Lipid
            "CHOLESTEROL": "Lipid Profile",
            "TRIGLYCERIDE": "Lipid Profile",
            "HDL": "Lipid Profile",
            "LDL": "Lipid Profile",
            "VLDL": "Lipid Profile",
            # Liver
            "BILIRUBIN": "Liver Function",
            "SGOT": "Liver Function",
            "SGPT": "Liver Function",
            "AST": "Liver Function",
            "ALT": "Liver Function",
            "ALKALINE": "Liver Function",
            "GGT": "Liver Function",
            # Urine
            "APPEARANCE": "Urine",
            "COLOR": "Urine",
            "CONDUCTIVITY": "Urine",
            "SPECIFIC GRAVITY": "Urine",
            "PROTEIN": "Urine",
            "GLUCOSE": "Urine",
            "KETONE": "Urine",
            "BILIRUBIN": "Urine",
            "UROBILINOGEN": "Urine",
            "NITRITE": "Urine",
            "LEUCOCYTE": "Urine",
            "BACTERIA": "Urine",
            # Special
            "GFR": "Kidney Function",
            "CYSTATIN": "Kidney Function",
            "Vitamin D": "Biochemistry",
            "HbA1c": "Diabetes",
        }

        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue

            # Detect section headers
            if any(header in line.upper() for header in [
                "BIOCHEMISTRY", "RENAL FUNCTION", "HAEMATOLOGY",
                "CBC", "DIFFERENTIAL", "ELECTROLYTE", "LIPID",
                "LIVER FUNCTION", "CLINICAL PATHOLOGY", "URINE",
                "CYSTATIN", "THYROID",
            ]):
                current_category = line.strip()
                continue

            # Try to extract test data from each line
            parsed = self._parse_line(line, lines, i, test_patterns, current_category)
            if parsed:
                result["lab_values"].append(parsed.to_dict())

        return result

    def _parse_line(self, line: str, all_lines: list, idx: int,
                    test_patterns: dict, current_category: str):
        """Try to parse a single line as a lab value."""
        # Pattern: SERUM/BLOOD/URINE  TEST_NAME  VALUE  previous(date)  unit  reference
        # Try matching known test names
        for test_key, category in test_patterns.items():
            if test_key.upper() in line.upper():
                # Extract the numeric value — look for a standalone number
                numbers = re.findall(r'(?<![/\d])(\d+\.?\d*)(?![/\d])', line)
                if not numbers:
                    continue

                # The first number-like token after the test name is usually the value
                value_text = numbers[0]

                # Try to get unit and reference from the same or next lines
                unit = self._extract_unit(line)
                ref_text = self._extract_ref_from_line(line)
                ref_low, ref_high = self._parse_ref_range(ref_text) if ref_text else (None, None)

                # Extract note (previous value)
                note = ""
                prev_match = re.search(r'([\d.]+)\s*\(\s*(\d{2}/\d{2}/\d{4})\s*\)', line)
                if prev_match:
                    note = f"Previous: {prev_match.group(1)} ({prev_match.group(2)})"

                # Determine confidence based on how clean the extraction was
                confidence = 0.85 if unit else 0.65

                return ParsedValue(
                    test_name=test_key,
                    test_category=category or current_category,
                    value_text=value_text,
                    unit=unit,
                    ref_low=ref_low,
                    ref_high=ref_high,
                    note=note,
                    confidence=confidence,
                )

        return None

    def _extract_bill_id(self, text: str) -> str:
        match = re.search(r'Billid\s*:?\s*(\d+)', text, re.IGNORECASE)
        if match:
            return match.group(1)
        match = re.search(r'Reg\s*No\s*:?\s*(\d+)', text, re.IGNORECASE)
        if match:
            return match.group(1)
        return ""

    def _extract_ref_from_line(self, line: str) -> str:
        """Extract reference range text from a line."""
        # Look for patterns like "3.5 - 7.2" or "136-145"
        match = re.search(r'(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)', line)
        if match:
            return match.group(0)
        return ""
