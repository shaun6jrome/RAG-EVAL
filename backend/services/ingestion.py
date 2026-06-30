import io
from PyPDF2 import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts text from a PDF file."""
    reader = PdfReader(io.BytesIO(file_bytes))
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + "\n"
    return text

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """Extracts text based on file extension."""
    if filename.lower().endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    else:
        # Fallback to simple utf-8 decode for txt, md, etc.
        return file_bytes.decode("utf-8", errors="ignore")

def chunk_text(text: str, chunk_size: int = 500, chunk_overlap: int = 50) -> list[str]:
    """Splits text into chunks using LangChain's RecursiveCharacterTextSplitter."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        is_separator_regex=False,
    )
    chunks = text_splitter.split_text(text)
    return chunks

def process_document(file_bytes: bytes, filename: str) -> list[str]:
    """Extracts text and returns chunks."""
    text = extract_text_from_file(file_bytes, filename)
    chunks = chunk_text(text)
    return chunks
