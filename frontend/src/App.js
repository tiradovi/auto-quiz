import React, { useState, useRef } from "react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5); // ✅ 생성할 문제 개수

  const MIN_QUESTIONS = 0;
  const MAX_QUESTIONS = 10;

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => setFile(e.target.files[0]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("파일을 선택하세요!");
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("num_questions", numQuestions); 

    const response = await fetch("http://127.0.0.1:8000/api/generate-quiz", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setQuestions(data.questions || []);
    setLoading(false);
  };

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
            {/* ✅ 문제 개수 선택 컨트롤 */}
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
                <li key={i} className="question-item">
                  {q}
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