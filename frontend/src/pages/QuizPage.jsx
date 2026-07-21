import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Sidebar from "../components/Sidebar";

export default function QuizPage() {
  const { token } = useAuth();
  const { addToast } = useToast();

  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    loadQuizzes();
  }, [token]);

  async function loadQuizzes() {
    try {
      const list = await api.getQuizzes(token);
      setQuizzes(list);
    } catch (_) {}
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!subject || !topic) return;

    setGenerating(true);
    try {
      const q = await api.generateQuiz({ subject, topic }, token);
      setQuizzes((prev) => [q, ...prev]);
      startQuiz(q);
      addToast("🧠 Quiz generated successfully!", "success");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setGenerating(false);
    }
  }

  function startQuiz(quiz) {
    setActiveQuiz(quiz);
    setSelectedAnswers({});
    setSubmitted(false);
    setResults(null);
  }

  function selectOption(questionIndex, optionIndex) {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  }

  async function handleSubmit() {
    if (!activeQuiz) return;
    const unanswered = activeQuiz.questions.some((_, i) => selectedAnswers[i] === undefined);
    if (unanswered) {
      addToast("Please answer all questions before submitting.", "info");
      return;
    }

    const answers = activeQuiz.questions.map((_, i) => selectedAnswers[i]);
    try {
      const res = await api.submitQuiz(activeQuiz._id, answers, token);
      setResults(res);
      setSubmitted(true);
      addToast(`🎉 Quiz submitted! Score: ${res.score}%`, "success");
      loadQuizzes();
    } catch (err) {
      addToast(err.message, "error");
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="page-main">
        <div className="page-header">
          <span className="section-eyebrow">Practice makes perfect</span>
          <h1>AI Quiz Generator</h1>
        </div>

        <div className="quiz-layout-grid">
          <div className="quiz-main-column">
            {activeQuiz ? (
              <div className="card active-quiz-card">
                <div className="active-quiz-header">
                  <div>
                    <h2>{activeQuiz.topic}</h2>
                    <span className="quiz-subtitle">{activeQuiz.subject}</span>
                  </div>
                  <button className="btn-secondary" style={{ width: "auto" }} onClick={() => setActiveQuiz(null)}>
                    Exit Quiz
                  </button>
                </div>

                <div className="questions-list">
                  {activeQuiz.questions.map((q, qi) => (
                    <div key={qi} className="question-item">
                      <h3 className="question-text">{qi + 1}. {q.question}</h3>
                      <div className="options-grid">
                        {q.options.map((opt, oi) => {
                          let optClass = "option-btn";
                          if (selectedAnswers[qi] === oi) optClass += " selected";
                          if (submitted) {
                            if (oi === q.correctIndex) optClass += " correct";
                            else if (selectedAnswers[qi] === oi) optClass += " incorrect";
                          }

                          return (
                            <button
                              key={oi}
                              className={optClass}
                              disabled={submitted}
                              onClick={() => selectOption(qi, oi)}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {submitted && (
                        <div className="question-explanation">
                          <strong>Explanation:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {!submitted ? (
                  <button className="btn-primary" style={{ marginTop: 24 }} onClick={handleSubmit}>
                    Submit Answers
                  </button>
                ) : (
                  <div className="quiz-results-banner">
                    <h3>Quiz Complete!</h3>
                    <div className="quiz-score-circle">
                      <span className="quiz-score-num">{results?.score}%</span>
                      <span className="quiz-score-label">{results?.correct} / {results?.total} Correct</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card">
                <h2>Generate New Quiz</h2>
                <form onSubmit={handleGenerate} className="quiz-form">
                  <div className="form-grid">
                    <div className="field">
                      <label>Subject</label>
                      <input
                        placeholder="e.g. Physics"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                      />
                    </div>
                    <div className="field">
                      <label>Topic</label>
                      <input
                        placeholder="e.g. Thermodynamics"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <button className="btn-primary" type="submit" disabled={generating}>
                    {generating ? "Creating Questions..." : "Create Quiz"}
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="quiz-history-column">
            <div className="card">
              <h2>Quiz History</h2>
              {quizzes.length === 0 ? (
                <p className="empty-state">No quizzes taken yet.</p>
              ) : (
                <div className="quiz-history-list">
                  {quizzes.map((q) => (
                    <div key={q._id} className="quiz-history-item" onClick={() => startQuiz(q)}>
                      <div className="history-info">
                        <strong>{q.topic}</strong>
                        <span>{q.subject}</span>
                      </div>
                      <div className="history-score">
                        {q.score !== null ? (
                          <span className={`score-badge ${q.score >= 80 ? "high" : q.score >= 50 ? "medium" : "low"}`}>
                            {q.score}%
                          </span>
                        ) : (
                          <span className="score-badge unattempted">Start</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
