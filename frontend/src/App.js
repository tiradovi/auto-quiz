// App.jsx
import React, { useState } from "react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("파일을 선택하세요!");
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("http://127.0.0.1:8000/api/generate-quiz", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setQuestions(data.questions || []);
    setLoading(false);
  };

  return (
    <div className="app-root">
      <div className="app-card">
        <header className="app-header">
          <h1>🧠 Auto Quiz Generator</h1>
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
              {file ? file.name : "여기를 클릭하거나 드래그해서 파일을 선택하세요"}
            </span>
            <input type="file" onChange={handleFileChange} />
          </label>

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading ? "문제 생성 중..." : "문제 생성하기"}
          </button>
        </form>

        <section className="questions-section">
          <div className="section-header">
            <h2>📋 생성된 문제</h2>
            <span className="badge">{questions.length}문항</span>
          </div>

          {questions.length === 0 ? (
            <p className="empty-text">
              아직 생성된 문제가 없습니다. PDF나 HWP 등의 학습 자료를 업로드해보세요.
            </p>
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