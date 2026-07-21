import { useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Sidebar from "../components/Sidebar";

export default function Tools() {
  const { token } = useAuth();
  const { addToast } = useToast();

  const [activeTool, setActiveTool] = useState("simplify"); // 'simplify' | 'summarize'

  // Simplify Tool state
  const [concept, setConcept] = useState("");
  const [conceptContext, setConceptContext] = useState("");
  const [simplifying, setSimplifying] = useState(false);
  const [simplifiedResult, setSimplifiedResult] = useState(null);

  // Summarize Tool state
  const [notes, setNotes] = useState("");
  const [notesSubject, setNotesSubject] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [summarizedResult, setSummarizedResult] = useState(null);

  async function handleSimplify(e) {
    e.preventDefault();
    if (!concept) return;

    setSimplifying(true);
    try {
      const res = await api.simplify({ concept, context: conceptContext }, token);
      setSimplifiedResult(res);
      addToast("💡 Concept simplified!", "success");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSimplifying(false);
    }
  }

  async function handleSummarize(e) {
    e.preventDefault();
    if (!notes) return;

    setSummarizing(true);
    try {
      const res = await api.summarize({ notes, subject: notesSubject }, token);
      setSummarizedResult(res);
      addToast("📝 Notes summarized!", "success");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSummarizing(false);
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="page-main">
        <div className="page-header">
          <span className="section-eyebrow">AI-Powered Study Utilities</span>
          <h1>Productivity Tools</h1>
        </div>

        <div className="tools-tab-row">
          <button
            className={`tool-tab-btn${activeTool === "simplify" ? " active" : ""}`}
            onClick={() => setActiveTool("simplify")}
          >
            💡 Concept Simplifier
          </button>
          <button
            className={`tool-tab-btn${activeTool === "summarize" ? " active" : ""}`}
            onClick={() => setActiveTool("summarize")}
          >
            📝 Notes Summarizer
          </button>
        </div>

        {activeTool === "simplify" ? (
          <div className="tool-content-grid">
            <div className="tool-form-column">
              <div className="card">
                <h2>Feynman Technique Simplifier</h2>
                <p className="tool-desc">
                  Type in any complex concept or formula, and the AI will explain it as if teaching a 12-year-old child.
                </p>
                <form onSubmit={handleSimplify} className="tool-form">
                  <div className="field">
                    <label>What concept do you want to understand?</label>
                    <input
                      placeholder="e.g. Schrödinger's Cat, Blockchain, Inflation"
                      value={concept}
                      onChange={(e) => setConcept(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Additional context or source text (optional)</label>
                    <textarea
                      placeholder="Paste formula details or confusing paragraphs here..."
                      value={conceptContext}
                      onChange={(e) => setConceptContext(e.target.value)}
                      rows="4"
                    />
                  </div>
                  <button className="btn-primary" type="submit" disabled={simplifying}>
                    {simplifying ? "Simplifying..." : "Simplify Concept"}
                  </button>
                </form>
              </div>
            </div>

            <div className="tool-result-column">
              {simplifiedResult ? (
                <div className="card result-card">
                  <h2>Simplified Explanation</h2>
                  <div className="result-feynman-body">
                    <p className="feynman-text">"{simplifiedResult.simplified}"</p>

                    {simplifiedResult.analogy && (
                      <div className="feynman-analogy-box">
                        <h3>💡 Real-world Analogy</h3>
                        <p>{simplifiedResult.analogy}</p>
                      </div>
                    )}

                    {simplifiedResult.keyPoints && simplifiedResult.keyPoints.length > 0 && (
                      <div className="feynman-keypoints-box">
                        <h3>🎯 Key Points</h3>
                        <ul>
                          {simplifiedResult.keyPoints.map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="card empty-result-card">
                  <p className="empty-state">Enter a concept to see the simplified explanation.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="tool-content-grid">
            <div className="tool-form-column">
              <div className="card">
                <h2>AI Notes Summarizer</h2>
                <p className="tool-desc">
                  Paste lecture notes, study texts, or textbook excerpts to extract a summary, key terms, and bullet points.
                </p>
                <form onSubmit={handleSummarize} className="tool-form">
                  <div className="field">
                    <label>Subject (optional)</label>
                    <input
                      placeholder="e.g. Biology, History"
                      value={notesSubject}
                      onChange={(e) => setNotesSubject(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>Paste your notes here</label>
                    <textarea
                      placeholder="Paste text notes here (max 3000 characters)..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows="10"
                      required
                    />
                  </div>
                  <button className="btn-primary" type="submit" disabled={summarizing}>
                    {summarizing ? "Summarizing..." : "Summarize Notes"}
                  </button>
                </form>
              </div>
            </div>

            <div className="tool-result-column">
              {summarizedResult ? (
                <div className="card result-card">
                  <h2>Summary Result</h2>
                  <div className="result-summary-body">
                    <p className="summary-overview">{summarizedResult.summary}</p>

                    {summarizedResult.bulletPoints && summarizedResult.bulletPoints.length > 0 && (
                      <div className="summary-bullets-box">
                        <h3>📌 Key Takeaways</h3>
                        <ul>
                          {summarizedResult.bulletPoints.map((bp, i) => (
                            <li key={i}>{bp}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {summarizedResult.keyTerms && summarizedResult.keyTerms.length > 0 && (
                      <div className="summary-terms-box">
                        <h3>🔑 Core Vocabulary</h3>
                        <div className="terms-chips-container">
                          {summarizedResult.keyTerms.map((term, i) => (
                            <span key={i} className="term-chip">
                              {term}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="card empty-result-card">
                  <p className="empty-state">Paste your study notes to generate summaries.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
