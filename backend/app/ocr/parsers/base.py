"""Abstract base class for lab report parsers."""
from abc import ABC, abstractmethod
from typing import Optional
import re


class ParsedValue:
    """A single extracted lab value."""
    def __init__(
        self,
        test_name: str,
        value_text: str,
        test_category: str = "",
        unit: str = "",
        ref_low: Optional[float] = None,
        ref_high: Optional[float] = None,
        flag: str = "",
        note: str = "",
        confidence: float = 0.5,
    ):
        self.test_name = test_name
        self.test_category = test_category
        self.value_text = value_text
        self.value_numeric = self._parse_numeric(value_text)
        self.unit = unit
        self.ref_low = ref_low
        self.ref_high = ref_high
        self.flag = flag or self._detect_flag()
        self.note = note
        self.confidence = confidence

    def _parse_numeric(self, text: str) -> Optional[float]:
        """Try to extract a numeric value from text."""
        # Remove arrows, spaces, and common non-numeric chars
        cleaned = re.sub(r'[↑↓▲▼\s*]', '', text.strip())
        try:
            return float(cleaned)
        except (ValueError, TypeError):
            return None

    def _detect_flag(self) -> str:
        """Auto-detect high/low flag from value vs reference range."""
        if self.value_numeric is None:
            return ""
        if self.ref_high is not None and self.value_numeric > self.ref_high:
            return "high"
        if self.ref_low is not None and self.value_numeric < self.ref_low:
            return "low"
        return ""

    def to_dict(self) -> dict:
        return {
            "test_name": self.test_name,
            "test_category": self.test_category,
            "value_numeric": self.value_numeric,
            "value_text": self.value_text,
            "unit": self.unit,
            "ref_low": self.ref_low,
            "ref_high": self.ref_high,
            "flag": self.flag,
            "note": self.note,
            "confidence": self.confidence,
        }


class BaseParser(ABC):
    """Abstract base for lab-specific report parsers."""

    @abstractmethod
    def can_parse(self, text: str) -> bool:
        """Check if this parser can handle the given OCR text."""
        pass

    @abstractmethod
    def parse(self, text: str) -> dict:
        """
        Parse OCR text into structured data.
        Returns dict with keys: lab_name, bill_id, report_type, lab_values (list of dicts).
        """
        pass

    def _parse_ref_range(self, ref_text: str) -> tuple[Optional[float], Optional[float]]:
        """Parse a reference range string like '3.5 – 7.2' into (low, high)."""
        ref_text = ref_text.strip()

        # Pattern: "3.5 - 7.2" or "3.5 – 7.2" or "3.5-7.2" or "3.5 to 7.2"
        match = re.search(r'([\d.]+)\s*[-–—to]+\s*([\d.]+)', ref_text)
        if match:
            try:
                return float(match.group(1)), float(match.group(2))
            except ValueError:
                return None, None

        # Pattern: "< 200" or "<200"
        match = re.search(r'<\s*([\d.]+)', ref_text)
        if match:
            try:
                return None, float(match.group(1))
            except ValueError:
                return None, None

        # Pattern: "> 40" or ">40"
        match = re.search(r'>\s*([\d.]+)', ref_text)
        if match:
            try:
                return float(match.group(1)), None
            except ValueError:
                return None, None

        return None, None

    def _extract_unit(self, text: str) -> str:
        """Extract common lab units from text."""
        units = [
            'mg/dL', 'mg/dl', 'g/dL', 'g/dl', 'mEq/L', 'meq/L',
            'mmol/L', 'µmol/L', 'U/L', 'IU/L', 'mL/min', 'ml/min',
            'cells/cumm', 'million/cumm', '/cumm', '/hpf', '/lpf',
            'fl', 'pg', 'g%', '%', 'mm/hr', 'mS/cm', 'uL',
            'lakh/cumm', 'thou/cumm',
        ]
        for unit in units:
            if unit.lower() in text.lower():
                return unit
        return ""
