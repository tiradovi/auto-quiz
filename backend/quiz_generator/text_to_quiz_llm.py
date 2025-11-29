from huggingface_hub import InferenceClient
from typing import List, Dict
import json
import re
import logging

logger = logging.getLogger(__name__)


class HuggingFaceAPI:
    """허깅페이스 API 클라이언트"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = InferenceClient(token=api_key)

    def chat_completion(
            self,
            model_name: str,
            messages: List[Dict[str, str]],
            max_tokens: int = 500,
            temperature: float = 0.7,
            stream: bool = False
    ) -> str:
        """채팅 완성 API 호출"""
        try:
            response = self.client.chat_completion(
                messages=messages,
                model=model_name,
                max_tokens=max_tokens,
                temperature=temperature,
                stream=stream
            )

            if stream:
                full_response = ""
                for chunk in response:
                    if hasattr(chunk.choices[0].delta, 'content'):
                        content = chunk.choices[0].delta.content
                        if content:
                            full_response += content
                return full_response
            else:
                return response.choices[0].message.content

        except Exception as e:
            logger.error(f"LLM API 호출 오류: {str(e)}")
            raise Exception(f"LLM 호출 실패: {str(e)}")


def create_quiz_prompt(text: str, num_questions: int, quiz_type: str) -> str:
    """퀴즈 생성을 위한 프롬프트 생성"""

    if quiz_type == "multiple_choice":
        prompt = f"""당신은 교육 전문가입니다. 아래 텍스트를 분석하여 객관식 퀴즈를 만들어주세요.

**텍스트:**
{text}

**요구사항:**
1. 총 {num_questions}개의 객관식 문제를 만들어주세요
2. 각 문제는 4개의 선택지를 가져야 합니다
3. 정답은 텍스트 내용에 기반해야 합니다
4. 오답도 그럴듯해야 합니다

**출력 형식 (JSON만 출력, 다른 설명 없이):**
[
  {{
    "question": "질문 내용",
    "options": ["선택지 A", "선택지 B", "선택지 C", "선택지 D"],
    "correct_answer": 0,
    "explanation": "정답 설명"
  }}
]

반드시 JSON 형식만 출력해주세요:"""

    elif quiz_type == "short_answer":
        prompt = f"""당신은 교육 전문가입니다. 아래 텍스트를 분석하여 주관식 퀴즈를 만들어주세요.

**텍스트:**
{text}

**요구사항:**
1. 총 {num_questions}개의 주관식 문제를 만들어주세요
2. 답은 간결해야 합니다 (1-5단어)
3. 가능한 다양한 정답 표현을 포함해주세요

**출력 형식 (JSON만 출력):**
[
  {{
    "question": "질문 내용",
    "answer": "정답",
    "acceptable_answers": ["정답1", "정답2", "유사답"],
    "explanation": "설명"
  }}
]

반드시 JSON 형식만 출력해주세요:"""

    elif quiz_type == "true_false":
        prompt = f"""당신은 교육 전문가입니다. 아래 텍스트를 분석하여 참/거짓 퀴즈를 만들어주세요.

**텍스트:**
{text}

**요구사항:**
1. 총 {num_questions}개의 참/거짓 문제를 만들어주세요
2. 참인 문제와 거짓인 문제를 적절히 섞어주세요
3. 진술은 명확해야 합니다

**출력 형식 (JSON만 출력):**
[
  {{
    "question": "진술 내용",
    "answer": true,
    "explanation": "설명"
  }}
]

반드시 JSON 형식만 출력해주세요:"""

    else:
        raise ValueError(f"지원하지 않는 퀴즈 유형: {quiz_type}")

    return prompt


def extract_json_from_response(text: str) -> list:
    """LLM 응답에서 JSON 추출"""
    text = text.strip()

    # 코드 블록 제거
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0]
    elif "```" in text:
        parts = text.split("```")
        if len(parts) >= 2:
            text = parts[1]

    # JSON 파싱 시도
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        # 정규식으로 JSON 배열 찾기
        json_match = re.search(r'\[.*\]', text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except:
                pass

        logger.error(f"JSON 파싱 실패. 응답 일부: {text[:200]}")
        raise ValueError("유효한 JSON을 찾을 수 없습니다")


def generate_quiz_from_text(
        text: str,
        num_questions: int,
        quiz_type: str = "multiple_choice",
        api_key: str = None
) -> list:
    """
    텍스트로부터 퀴즈 생성

    Args:
        text: 퀴즈를 생성할 텍스트
        num_questions: 생성할 문제 수
        quiz_type: 문제 유형 (multiple_choice, short_answer, true_false)
        api_key: 허깅페이스 API 키

    Returns:
        퀴즈 문제 리스트 (JSON 형식)
    """

    if not api_key:
        raise ValueError("API 키가 필요합니다")

    try:
        # HuggingFace API 초기화
        hf_api = HuggingFaceAPI(api_key=api_key)

        # 프롬프트 생성
        prompt = create_quiz_prompt(text, num_questions, quiz_type)

        logger.info(f"퀴즈 생성 시작: 문제수={num_questions}, 유형={quiz_type}")

        # LLM 호출
        response = hf_api.chat_completion(
            model_name="meta-llama/Llama-3.3-70B-Instruct",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000,
            temperature=0.7
        )

        logger.info(f"LLM 응답 받음: {len(response)}자")

        # JSON 추출
        quiz = extract_json_from_response(response)

        logger.info(f"퀴즈 생성 완료: {len(quiz)}문제")

        return quiz

    except Exception as e:
        logger.error(f"퀴즈 생성 실패: {str(e)}")
        raise

