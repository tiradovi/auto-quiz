import React, { useState } from "react";

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
    setQuestions(data.questions);
    setLoading(false);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>🧠 Auto Quiz Generator</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} />
        <button type="submit" disabled={loading}>
          {loading ? "생성 중..." : "문제 생성하기"}
        </button>
      </form>

      <div style={{ marginTop: 40 }}>
        <h2>📋 생성된 문제</h2>
        <ul>
          {questions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
