import { useState } from "react";

import { askAnalytics } from "../services/aiAnalyticsService.js";

const DashboardAnalytics = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!question.trim()) {
      setError("Enter a question first");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setAnswer("");

      const data = await askAnalytics(question.trim());

      setAnswer(data.answer);
    } catch (requestError) {
      setError(
        requestError.message || "Unable to get an answer right now"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="merchant-products">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Merchant workspace</p>

          <h1>Analytics assistant</h1>

          <p className="page-heading__description">
            Ask questions about your store's revenue and top products.
          </p>
        </div>
      </section>

      {error && (
        <p className="form-message form-message--error" role="alert">
          {error}
        </p>
      )}

      <section className="analytics-panel">
        <form onSubmit={handleSubmit}>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="e.g. What were my top 5 products by revenue last month?"
          />

          <button
            type="submit"
            className="button button--primary"
            disabled={loading}
          >
            {loading ? "Thinking..." : "Ask"}
          </button>
        </form>

        {answer && <p className="analytics-answer">{answer}</p>}
      </section>
    </main>
  );
};

export default DashboardAnalytics;
