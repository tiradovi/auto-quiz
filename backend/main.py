from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from quiz_generator.pdf_parser import extract_text_from_pdf
from quiz_generator.docx_parser import extract_text_from_docx
from quiz_generator.text_to_quiz import generate_quiz_from_text

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/generate-quiz")
async def generate_quiz(file: UploadFile = File(...)):
    filename = file.filename.lower()
    contents = await file.read()

    if filename.endswith(".pdf"):
        text = extract_text_from_pdf(contents)
    elif filename.endswith(".docx"):
        text = extract_text_from_docx(contents)
    else:
        text = contents.decode("utf-8", errors="ignore")

    questions = generate_quiz_from_text(text)
    return {"questions": questions}
