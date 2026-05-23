"""Generic fallback parser for unknown lab report formats."""
import re
from app.ocr.parsers.base import BaseParser, ParsedValue


class GenericParser(BaseParser):
    """
    Fallback parser using heuristics to find test names, values, and units
    from unrecognized lab report formats.
    """

    # Common test names to look for
    KNOWN_TESTS = {
        "haemoglobin": ("Haemoglobin", "g/dL", "CBC"),
        "hemoglobin": ("Haemoglobin", "g/dL", "CBC"),
        "wbc": ("WBC", "cells/cumm", "CBC"),
        "rbc": ("RBC", "million/cumm", "CBC"),
        "platelet": ("Platelets", "cells/cumm", "CBC"),
        "creatinine": ("Creatinine", "mg/dL", "Renal Function"),
        "urea": ("Urea", "mg/dL", "Renal Function"),
        "uric acid": ("Uric Acid", "mg/dL", "Renal Function"),
        "sodium": ("Sodium", "mEq/L", "Electrolytes"),
        "potassium": ("Potassium", "mEq/L", "Electrolytes"),
        "chloride": ("Chloride", "mEq/L", "Electrolytes"),
        "calcium": ("Calcium", "mg/dL", "Renal Function"),
        "cholesterol": ("Total Cholesterol", "mg/dL", "Lipid Profile"),
        "triglyceride": ("Triglycerides", "mg/dL", "Lipid Profile"),
        "hdl": ("HDL", "mg/dL", "Lipid Profile"),
        "ldl": ("LDL", "mg/dL", "Lipid Profile"),
        "bilirubin": ("Bilirubin Total", "mg/dL", "Liver Function"),
        "sgot": ("AST/SGOT", "U/L", "Liver Function"),
        "sgpt": ("ALT/SGPT", "U/L", "Liver Function"),
        "glucose": ("Blood Glucose", "mg/dL", "Diabetes"),
        "hba1c": ("HbA1c", "%", "Diabetes"),
        "tsh": ("TSH", "µIU/mL", "Thyroid"),
        "t3": ("T3", "ng/dL", "Thyroid"),
        "t4": ("T4", "µg/dL", "Thyroid"),
        "vitamin d": ("Vitamin D", "ng/mL", "Biochemistry"),
        "phosphorous": ("Phosphorous", "mg/dL", "Renal Function"),
        "phosphorus": ("Phosphorous", "mg/dL", "Renal Function"),
        "albumin": ("Albumin", "g/dL", "Liver Function"),
        "protein": ("Total Protein", "g/dL", "Liver Function"),
        "esr": ("ESR", "mm/hr", "CBC"),
        "pcv": ("PCV", "%", "CBC"),
        "mcv": ("MCV", "fl", "CBC"),
        "mch": ("MCH", "pg", "CBC"),
        "mchc": ("MCHC", "g/dL", "CBC"),
        "bicarbonate": ("Bicarbonate", "mEq/L", "Electrolytes"),
    }

    def can_parse(self, text: str) -> bool:
        # Generic parser is always available as fallback
        return True

    def parse(self, text: str) -> dict:
        result = {
            "lab_name": self._detect_lab_name(text),
            "bill_id": "",
            "report_type": "Blood Test",
            "lab_values": [],
        }

        lines = text.split("\n")
        found_tests = set()

        for line in lines:
            line_lower = line.lower().strip()
            if not line_lower:
                continue

            for key, (test_name, default_unit, category) in self.KNOWN_TESTS.items():
                if key in line_lower and test_name not in found_tests:
                    # Extract numeric value from this line
                    numbers = re.findall(r'(?<![/\d.])(\d+\.?\d*)(?![/\d.])', line)
                    if numbers:
                        value_text = numbers[0]
                        unit = self._extract_unit(line) or default_unit
                        ref_text = self._find_ref_range(line)
                        ref_low, ref_high = self._parse_ref_range(ref_text) if ref_text else (None, None)

                        parsed = ParsedValue(
                            test_name=test_name,
                            test_category=category,
                            value_text=value_text,
                            unit=unit,
                            ref_low=ref_low,
                            ref_high=ref_high,
                            confidence=0.50,  # Lower confidence for generic parser
                        )
                        result["lab_values"].append(parsed.to_dict())
                        found_tests.add(test_name)
                    break

        return result

    def _detect_lab_name(self, text: str) -> str:
        """Try to detect lab name from the first few lines."""
        lines = text.split("\n")[:10]
        for line in lines:
            line = line.strip()
            if any(kw in line.lower() for kw in ["laboratory", "diagnostics", "lab", "pathology"]):
                return line
        return "Unknown Laboratory"

    def _find_ref_range(self, line: str) -> str:
        """Try to find reference range pattern in a line."""
        match = re.search(r'(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)', line)
        if match:
            return match.group(0)
        return ""
