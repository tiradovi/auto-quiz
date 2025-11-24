import React, { useState, useRef } from "react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [questions, setQuestions] = useState([]); // [{question, options, answerIndex, ...}]
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);

  const MIN_QUESTIONS = 0;
  const MAX_QUESTIONS = 10;

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  // ---------- 드래그 앤 드롭 ----------
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;

    const droppedFile = droppedFiles[0];
    setFile(droppedFile);
  };

  // ---------- 문자열 파싱 함수 ----------
  const parseQuestionString = (raw, index) => {
    const text = (raw || "").trim();

    // 정답 번호 추출: "정답: 4번"
    const answerMatch = text.match(/정답\s*:\s*(\d+)\s*번?/);
    const answerIndex = answerMatch ? parseInt(answerMatch[1], 10) - 1 : null;

    // 보기 부분 전체 (1)부터 끝까지)
    const firstOptionIdx = text.indexOf("1)");
    const optionsText = firstOptionIdx !== -1 ? text.slice(firstOptionIdx) : "";

    // 보기 각각 추출: "1) ~~~ 2) ~~~ 3) ~~~ 4) ~~~"
    const options = [];
    const optionRegex =
      /(\d\))\s*([^0-9]+?)(?=\s+\d\)|\s*정답|$)/g;
    let m;
    while ((m = optionRegex.exec(optionsText)) !== null) {
      options.push(m[2].trim());
    }

    // 문제 텍스트: [문제 n] / 보기 이전 부분만
    let questionPart =
      firstOptionIdx !== -1 ? text.slice(0, firstOptionIdx) : text;
    // "[문제 1]" 같은 머리부분 제거
    questionPart = questionPart.replace(/\[문제\s*\d+\]\s*/g, "").trim();

    return {
      id: index,
      raw: text,
      question: questionPart,
      options,
      answerIndex,
      selectedIndex: null,
      isCorrect: null,
    };
  };

  // ---------- 문제 생성 요청 ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("파일을 선택하세요!");
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("num_questions", numQuestions); // 필요시 백엔드에서 사용

    const response = await fetch("http://127.0.0.1:8000/api/generate-quiz", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    // data.questions : ["[문제 1] Q: ... 정답: 4번", ...]
    const parsed = (data.questions || []).map((q, i) =>
      parseQuestionString(q, i)
    );

    setQuestions(parsed);
    setLoading(false);
  };

  // ---------- 보기 버튼 클릭 ----------
  const handleOptionClick = (qIndex, optionIndex) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const isCorrect = q.answerIndex === optionIndex;
        return {
          ...q,
          selectedIndex: optionIndex,
          isCorrect,
        };
      })
    );
  };

  // ---------- 초기화 ----------
  const handleReset = () => {
    setFile(null);
    setQuestions([]);
    setLoading(false);
    setIsDragOver(false);
    setNumQuestions(5);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ---------- 문제 개수 조절 ----------
  const decreaseNum = () =>
    setNumQuestions((prev) => Math.max(MIN_QUESTIONS, prev - 1));
  const increaseNum = () =>
    setNumQuestions((prev) => Math.min(MAX_QUESTIONS, prev + 1));

  return (
    <div className="app-root">
      <div className="app-card">
        <header className="app-header">
          <h1>Auto Quiz Generator</h1>
          <p className="app-subtitle">
            학습 자료를 업로드하면, AI가 자동으로 퀴즈를 만들어 드려요.
          </p>
        </header>

        <form className="upload-form" onSubmit={handleSubmit}>
          <label className="file-input-label">
            <span className="file-input-title">
              {file ? "선택된 파일" : "파일 업로드"}
            </span>
            <span className="file-input-filename">
              {file ? file.name : "여기를 클릭해서 파일을 선택하세요"}
            </span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </label>

          <div className="button-row">
            {/* 문제 개수 선택 */}
            <div className="question-count-control">
              <button
                type="button"
                className="counter-button"
                onClick={decreaseNum}
                disabled={numQuestions <= MIN_QUESTIONS}
              >
                -
              </button>
              <span className="counter-value">{numQuestions}</span>
              <button
                type="button"
                className="counter-button"
                onClick={increaseNum}
                disabled={numQuestions >= MAX_QUESTIONS}
              >
                +
              </button>
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading ? "문제 생성 중..." : "문제 생성하기"}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={handleReset}
            >
              초기화
            </button>
          </div>
        </form>

        <section className="questions-section">
          <div className="section-header">
            <h2>생성된 문제</h2>
            <span className="badge">{questions.length}문항</span>
          </div>

          {questions.length === 0 ? (
            <div
              className={`empty-dropzone ${isDragOver ? "dragover" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <p className="empty-text">
                아직 생성된 문제가 없습니다.
                <br />
                PDF나 HWP 등의 학습 자료를
                <br />
                <strong>여기로 드래그해서 업로드</strong>하거나,
                <br />
                위의 버튼으로 파일을 선택해보세요.
              </p>
            </div>
          ) : (
            <ol className="question-list">
              {questions.map((q, i) => (
                <li key={q.id} className="question-item">
                  <div className="question-text">
                    <span className="question-number">문제 {i + 1}.</span>
                    <span>{q.question}</span>
                  </div>

                  <div className="options-container">
                    {q.options.map((opt, idx) => {
                      const isSelected = q.selectedIndex === idx;
                      const isCorrect = q.answerIndex === idx;
                      const showResult = q.selectedIndex !== null;

                      let optionClass = "option-button";
                      if (showResult && isSelected && q.isCorrect) {
                        optionClass += " option-correct";
                      } else if (showResult && isSelected && !q.isCorrect) {
                        optionClass += " option-incorrect";
                      } else if (showResult && isCorrect) {
                        // 정답 강조 (선택하지 않았지만 정답인 보기)
                        optionClass += " option-correct-outline";
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          className={optionClass}
                          onClick={() => handleOptionClick(i, idx)}
                          disabled={q.selectedIndex !== null}
                        >
                          {idx + 1}. {opt}
                        </button>
                      );
                    })}
                  </div>

                  {q.selectedIndex !== null && (
                    <p
                      className={
                        q.isCorrect
                          ? "answer-feedback correct"
                          : "answer-feedback incorrect"
                      }
                    >
                      {q.isCorrect
                        ? "정답입니다!"
                        : `오답입니다. 정답은 ${q.answerIndex + 1}번입니다.`}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;