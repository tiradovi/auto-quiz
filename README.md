# Auto Quiz 프로젝트

## 1. Python 가상환경 생성
# 루트에서 실행
python -m venv venv

# 활성화
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

## 2. Backend 설치 및 실행
pip install -r backend/requirements.txt
python.exe -m pip install --upgrade pip
uvicorn backend.main:app --reload

## 3. 새로운 로컬 터미널 Frontend 설치 및 실행
cd frontend
npm install
npm start

## 4. API 테스트
http://127.0.0.1:8000/docs
