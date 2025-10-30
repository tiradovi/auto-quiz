from transformers import pipeline

try:
    quiz_model = pipeline("text2text-generation", model="circulus/kot5-base-v1")
except Exception:
    quiz_model = None

def generate_quiz_from_text(text):
    if not quiz_model:
        return [f"예시 문제: '{text[:30]}...'에 대한 주요 내용은 무엇인가요?"]
    prompt = f"다음 내용을 기반으로 3개의 객관식 문제를 만들어줘:\n{text[:800]}"
    result = quiz_model(prompt, max_length=256, do_sample=True)[0]['generated_text']
    return result.split("\n")
