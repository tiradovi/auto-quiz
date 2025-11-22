import re
import random
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def extract_sentences(text):

    sentences = re.split(r'[.!?]\s+', text)
    valid_sentences = [s.strip() for s in sentences if 20 < len(s.strip()) < 200]
    return valid_sentences


def extract_key_terms(sentence):

    words = sentence.split()

    key_words = [w for w in words if len(w) >= 3 and w.isalnum()]
    return key_words[:5]


def create_fill_in_blank_question(sentence):

    words = sentence.split()

    candidates = []
    for i, word in enumerate(words):
        if len(word) >= 4 and word.isalnum() and i > 1 and i < len(words) - 1:
            candidates.append((i, word))

    if not candidates:
        return None

    blank_idx, answer = random.choice(candidates)

    question_words = words.copy()
    question_words[blank_idx] = "________"
    question = " ".join(question_words)

    all_words = sentence.split()
    distractors = [w for w in all_words if len(w) >= 3 and w != answer and w.isalnum()]

    if len(distractors) < 3:
        distractors.extend(["것이다", "이다", "되었다", "했다", "수", "때", "등"])

    random.shuffle(distractors)
    options = [answer] + distractors[:3]
    random.shuffle(options)

    correct_idx = options.index(answer) + 1

    result = f"""Q: 다음 빈칸에 들어갈 알맞은 말은?

{question}

1) {options[0]}
2) {options[1]}
3) {options[2]}
4) {options[3]}

정답: {correct_idx}번"""

    return result


def create_content_question(sentences):
    if len(sentences) < 2:
        return None

    context = ". ".join(sentences[:2])

    terms = extract_key_terms(context)
    if not terms:
        return None

    main_term = random.choice(terms)

    result = f"""Q: 다음 내용에서 다루고 있는 주요 개념은 무엇인가?

{context[:150]}...

1) {main_term}
2) 기타 개념
3) 일반 이론
4) 부가 설명

정답: 1번 (내용에서 '{main_term}'이(가) 주요하게 다루어짐)"""

    return result


def generate_quiz_from_text(text, num_questions):

    if not text or len(text.strip()) < 100:
        return [f"❌ 텍스트가 너무 짧습니다. (최소 100자 필요)"]

    logger.info(f"{num_questions}개 문제 생성 시작 (규칙 기반 방식)")

    sentences = extract_sentences(text)

    if len(sentences) < 3:
        return ["❌ 유효한 문장이 충분하지 않습니다. 더 긴 텍스트를 업로드하세요."]

    logger.info(f"추출된 문장: {len(sentences)}개")

    questions = []

    for i in range(num_questions):

        idx = (i * (len(sentences) // num_questions)) % len(sentences)
        sentence = sentences[idx]


        if i % 2 == 0 and len(sentence.split()) > 6:

            q = create_fill_in_blank_question(sentence)
        else:
            q = create_content_question(sentences[idx:idx+2])

        if q:
            questions.append(f"[문제 {i+1}]\n\n{q}")
            logger.info(f"[{i+1}/{num_questions}] 생성 완료")
        else:
            questions.append(f"[문제 {i+1}]\n\n생성 실패 (적절한 문장을 찾을 수 없음)")
            logger.warning(f"[{i+1}/{num_questions}] 생성 실패")

    logger.info(f"✅ 총 {len(questions)}개 문제 생성 완료")
    return questions