from __future__ import annotations

import io
from pathlib import Path

import docx2txt
from pypdf import PdfReader


def extract_text_from_upload(filename: str, file_bytes: bytes) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix == '.pdf':
        reader = PdfReader(io.BytesIO(file_bytes))
        return '\n'.join(page.extract_text() or '' for page in reader.pages).strip()
    if suffix in {'.docx', '.doc'}:
        temp_path = Path.cwd() / f'__tmp_{Path(filename).name}'
        temp_path.write_bytes(file_bytes)
        try:
            return docx2txt.process(str(temp_path)).strip()
        finally:
            temp_path.unlink(missing_ok=True)
    if suffix in {'.txt', '.md'}:
        return file_bytes.decode('utf-8', errors='ignore').strip()
    return file_bytes.decode('utf-8', errors='ignore').strip()
