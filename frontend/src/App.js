import React, {useState, useRef} from "react";
import "./App.css";

function App() {
    const [file, setFile] = useState(null);
    const [questions, setQuestions] = useState([]); // [{question, options, answerIndex, ...}]
    const [loading, setLoading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [numQuestions, setNumQuestions] = useState(5);
    const [quizType, setQuizType] = useState("multiple_choice");

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

    // ---------- 문제 생성 요청 ----------
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return alert("파일을 선택하세요!");
        setLoading(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("num_questions", numQuestions);
        formData.append("quiz_type", quizType);

        const response = await fetch("http://127.0.0.1:8000/api/generate-quiz", {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        const parsed = data.questions.map((q, i) => {
            return {
                id: i,
                raw: q,
                question: q.question,
                options: q.options || [],   // 객관식만 사용
                answer: q.answer ?? null,  // 주관식/참거짓 사용
                acceptable_answers: q.acceptable_answers || [],
                answerIndex: q.correct_answer ?? null, // 객관식만
                selectedIndex: null,
                isCorrect: null,
            };
        });


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
                    <div className="quiz-type-toggle">
                        <button
                            type="button"
                            className={`quiz-type-button ${quizType === "multiple_choice" ? "active" : ""}`}
                            onClick={() => setQuizType("multiple_choice")}
                        >
                            객관식
                        </button>

                        <button
                            type="button"
                            className={`quiz-type-button ${quizType === "short_answer" ? "active" : ""}`}
                            onClick={() => setQuizType("short_answer")}
                        >
                            주관식
                        </button>

                        <button
                            type="button"
                            className={`quiz-type-button ${quizType === "true_false" ? "active" : ""}`}
                            onClick={() => setQuizType("true_false")}
                        >
                            참거짓
                        </button>
                    </div>


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
                                <br/>
                                PDF나 HWP 등의 학습 자료를
                                <br/>
                                <strong>여기로 드래그해서 업로드</strong>하거나,
                                <br/>
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

                                    {/* 문제 유형에 따라 분기 */}
                                    {/* -------------------------------------------------- */}
                                    {/* 1) 객관식 */}
                                    {/* -------------------------------------------------- */}
                                    {quizType === "multiple_choice" && (
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
                                    )}

                                    {/* -------------------------------------------------- */}
                                    {/* 2) 주관식 */}
                                    {/* -------------------------------------------------- */}
                                    {quizType === "short_answer" && (
                                        <div className="short-answer-box">
                                            {q.selectedIndex === null ? (
                                                <input
                                                    type="text"
                                                    className="short-answer-input"
                                                    placeholder="정답을 작성하세요"
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            const userAnswer = e.target.value.trim().toLowerCase();

                                                            const correct = q.answer.trim().toLowerCase();
                                                            const acceptable = q.acceptable_answers.map(a =>
                                                                a.trim().toLowerCase()
                                                            );

                                                            const isCorrect =
                                                                userAnswer === correct ||
                                                                acceptable.includes(userAnswer);

                                                            setQuestions((prev) =>
                                                                prev.map((item, idx) =>
                                                                    idx === i
                                                                        ? {
                                                                            ...item,
                                                                            selectedIndex: 1, // 입력됨 표시용
                                                                            isCorrect,
                                                                            userAnswer: e.target.value.trim(),
                                                                        }
                                                                        : item
                                                                )
                                                            );
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <p
                                                    className={
                                                        q.isCorrect
                                                            ? "answer-feedback correct"
                                                            : "answer-feedback incorrect"
                                                    }
                                                >
                                                    {q.isCorrect
                                                        ? "정답입니다!"
                                                        : `오답입니다. 정답은 "${q.answer}" 입니다.`}
                                                </p>
                                            )}
                                        </div>
                                    )}


                                    {/* -------------------------------------------------- */}
                                    {/* 3) 참거짓 */}
                                    {/* -------------------------------------------------- */}
                                    {quizType === "true_false" && (
                                        <div className="options-container">
                                            {["참", "거짓"].map((opt, idx) => {
                                                const optionValue = idx === 0; // 참=true, 거짓=false
                                                const isSelected = q.selectedIndex === idx;
                                                const isCorrect = q.answer === optionValue;
                                                const showResult = q.selectedIndex !== null;

                                                let optionClass = "option-button";
                                                if (showResult && isSelected && q.isCorrect) {
                                                    optionClass += " option-correct";
                                                } else if (showResult && isSelected && !q.isCorrect) {
                                                    optionClass += " option-incorrect";
                                                } else if (showResult && isCorrect) {
                                                    optionClass += " option-correct-outline";
                                                }

                                                return (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        className={optionClass}
                                                        onClick={() => {
                                                            const selectedCorrect = q.answer === optionValue;
                                                            setQuestions((prev) =>
                                                                prev.map((item, ii) =>
                                                                    ii === i
                                                                        ? {
                                                                            ...item,
                                                                            selectedIndex: idx,
                                                                            isCorrect: selectedCorrect,
                                                                        }
                                                                        : item
                                                                )
                                                            );
                                                        }}
                                                        disabled={q.selectedIndex !== null}
                                                    >
                                                        {opt}
                                                    </button>
                                                );
                                            })}
                                        </div>
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