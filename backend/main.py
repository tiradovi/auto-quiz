from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging

from backend.quiz_generator.pdf_parser import extract_text_from_pdf
from backend.quiz_generator.docx_parser import extract_text_from_docx
from backend.quiz_generator.text_to_quiz_llm import generate_quiz_from_text

app = FastAPI()
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 반드시 이부분에 허깅페이스 api키를 넣을 것 차후 수정 예정
API_KEY = ""


@app.post("/api/generate-quiz")
async def generate_quiz(
        file: UploadFile = File(...),
        num_questions: int = Form(5),
        quiz_type: str = Form("multiple_choice")
):
    try:
        filename = file.filename.lower()
        contents = await file.read()

        logger.info(f"받은 파일: {filename} ({len(contents)} bytes)")
        logger.info(f"문제 유형: {quiz_type}, 문제 수: {num_questions}")

        if filename.endswith(".pdf"):
            text = extract_text_from_pdf(contents)
        elif filename.endswith(".docx"):
            text = extract_text_from_docx(contents)
        elif filename.endswith(".txt"):
            text = contents.decode("utf-8", errors="ignore")
        else:
            raise HTTPException(
                status_code=400,
                detail="지원하지 않는 파일 형식입니다. (PDF, DOCX, TXT만 지원)"
            )

        logger.info(f"추출된 텍스트: {len(text)}자")

        if not text or len(text.strip()) < 100:
            raise HTTPException(
                status_code=400,
                detail=f"텍스트가 너무 짧습니다. (현재 {len(text)}자, 최소 100자 필요)"
            )

        questions = generate_quiz_from_text(
            text=text,
            num_questions=num_questions,
            quiz_type=quiz_type,
            api_key=API_KEY
        )

        return {
            "questions": questions,
            "text_length": len(text),
            "quiz_type": quiz_type,
            "num_questions": len(questions)
        }

    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"값 오류: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"퀴즈 생성 오류: {e}")
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")
