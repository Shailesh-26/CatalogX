import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";
import PageHeader from "../components/PageHeader";

const SPINE_EMOJIS = {
  Fiction: "📕", Science: "🔬", Technology: "💻", History: "📜", Other: "📗"
};

const CAT_BADGE = {
  Fiction: "badge-info", Science: "badge-success",
  Technology: "badge-warning", History: "badge-neutral", Other: "badge-neutral"
};

function calcFine(dueDate, returnDate) {
  if (!returnDate) return 0;
  const due = new Date(dueDate);
  const ret = new Date(returnDate);
  if (ret <= due) return 0;
  return Math.ceil((ret - due) / (1000 * 60 * 60 * 24)) * 5;
}

// ── AI Recommendations Section ────────────────────────────────
function AIRecommendations({ userId }) {
  const [recs,     setRecs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [basis,    setBasis]    = useState("ai");
  const [basedOn,  setBasedOn]  = useState([]);
  const [error,    setError]    = useState("");

  useEffect(() => {
    api.post("/api/ai/recommendations", { userId })
      .then(res => {
        setRecs(res.data.recommendations);
        setBasis(res.data.basis);
        setBasedOn(res.data.basedOn || []);
      })
      .catch(() => setError("Could not load recommendations."))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div>
      {/* Section header */}
      <div className="flex-between" style={{ marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: "1rem" }}>✨</span>
            <p className="section-title" style={{ margin: 0 }}>
              {basis === "ai" ? "Recommended for You" : "Popular This Week"}
            </p>
            <span style={{
              fontSize: "0.65rem", fontWeight: 700, padding: "2px 7px",
              background: "linear-gradient(135deg, var(--green-600), var(--amber-400))",
              color: "#fff", borderRadius: "20px", letterSpacing: "0.04em",
            }}>AI</span>
          </div>
          {basis === "ai" && basedOn.length > 0 && (
            <p className="text-muted" style={{ fontSize: "0.78rem" }}>
              Based on: {basedOn.slice(0, 2).map(t => `"${t}"`).join(", ")}
              {basedOn.length > 2 ? ` +${basedOn.length - 2} more` : ""}
            </p>
          )}
          {basis === "popular" && (
            <p className="text-muted" style={{ fontSize: "0.78rem" }}>
              Borrow some books to get personalized recommendations
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12,
          padding: "20px 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
          <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
          Gemini is finding books for you…
        </div>
      ) : error ? (
        <p className="text-muted">{error}</p>
      ) : recs.length === 0 ? (
        <div className="empty-state" style={{ padding: "24px 0" }}>
          <p className="empty-state-text">No recommendations yet — borrow a few books first!</p>
        </div>
      ) : (
        <div className="books-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))" }}>
          {recs.map(book => (
            <Link key={book._id} to={`/books/${book._id}`} style={{ textDecoration: "none" }}>
              <div className="book-card" style={{ cursor: "pointer", position: "relative" }}>
                {/* AI badge on card */}
                <div style={{
                  position: "absolute", top: 10, right: 10,
                  fontSize: "0.6rem", fontWeight: 700, padding: "2px 7px",
                  background: "linear-gradient(135deg, var(--green-600), var(--amber-400))",
                  color: "#fff", borderRadius: "20px",
                }}>
                  ✨ AI Pick
                </div>

                {book.coverImage ? (
                  <img src={book.coverImage} alt={book.title}
                    style={{ width: "100%", height: 130, objectFit: "cover",
                      borderRadius: "var(--radius-sm)", marginBottom: 4 }} />
                ) : (
                  <div className="book-card-spine">{SPINE_EMOJIS[book.category] || "📘"}</div>
                )}
                <p className="book-title">{book.title}</p>
                <p className="book-author">by {book.author}</p>
                <div className="book-meta">
                  <span className={`badge ${CAT_BADGE[book.category] || "badge-neutral"}`}>
                    {book.category}
                  </span>
                  <span className={`badge ${book.availableCopies > 0 ? "badge-success" : "badge-danger"}`}>
                    {book.availableCopies > 0 ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentHome() {
  const name   = localStorage.getItem("name");
  const userId = localStorage.getItem("userId");

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  useEffect(() => {
    api.get(`/api/borrow/history/${userId}`)
      .then(res => setHistory(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <>
      <PageHeader
        eyebrow={`Student · ${today}`}
        title={`Welcome, ${name} 👋`}
        subtitle="Manage your books, track due dates, and explore new titles."
        actions={
          <Link to="/books" className="btn btn-primary btn-sm">Browse Books →</Link>
        }
      />

      <div className="page-wrapper">
        {/* Hero */}
        <div className="hero-banner">
          <p className="hero-banner-eyebrow">Smart Library</p>
          <h1 className="hero-title">Ready to read something new?</h1>
          <p className="hero-subtitle">
            Explore our catalogue, borrow books, and track your reading journey.
          </p>
          <div className="hero-actions">
            <Link to="/books"   className="btn btn-amber">Browse Catalogue</Link>
            <Link to="/mybooks" className="btn btn-secondary"
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff",
                border: "1px solid rgba(255,255,255,0.25)" }}>
              My Active Loans
            </Link>
          </div>
        </div>

        {/* Quick actions */}
        <p className="section-title">Quick Access</p>
        <div className="quick-actions" style={{ marginBottom: 32 }}>
          <Link to="/books" className="quick-action-card">
            <span className="quick-action-icon">🔍</span>
            <span className="quick-action-label">Browse Books</span>
            <span className="quick-action-desc">Search and borrow from the catalogue</span>
          </Link>
          <Link to="/mybooks" className="quick-action-card">
            <span className="quick-action-icon">📖</span>
            <span className="quick-action-label">My Active Loans</span>
            <span className="quick-action-desc">Track and return your books</span>
          </Link>
          <Link to="/profile" className="quick-action-card">
            <span className="quick-action-icon">👤</span>
            <span className="quick-action-label">My Profile</span>
            <span className="quick-action-desc">Edit preferences and account</span>
          </Link>
        </div>

        <hr className="divider" />

        {/* ✨ AI Recommendations */}
        <AIRecommendations userId={userId} />

        <hr className="divider" />

        {/* Return history */}
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <div>
            <p className="section-title" style={{ marginBottom: 2 }}>Return History</p>
            <p className="text-muted">Books you've previously borrowed and returned</p>
          </div>
          <span className="badge badge-neutral">{history.length} records</span>
        </div>

        {loading ? (
          <div className="spinner-wrapper" style={{ padding: 24 }}>
            <div className="spinner"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="empty-state" style={{ padding: "32px 20px" }}>
            <div className="empty-state-icon">📭</div>
            <p className="empty-state-title">No history yet</p>
            <p className="empty-state-text">Returned books will appear here.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Author</th>
                  <th>Borrowed On</th>
                  <th>Returned On</th>
                  <th>Fine Paid</th>
                </tr>
              </thead>
              <tbody>
                {history.map(r => {
                  const fine = calcFine(r.dueDate, r.returnDate);
                  return (
                    <tr key={r._id}>
                      <td style={{ fontWeight: 600 }}>{r.bookId?.title || "—"}</td>
                      <td className="text-muted">{r.bookId?.author || "—"}</td>
                      <td className="text-muted">
                        {new Date(r.borrowDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="text-muted">
                        {r.returnDate ? new Date(r.returnDate).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td>
                        {fine > 0
                          ? <span className="badge badge-warning">₹{fine}</span>
                          : <span className="badge badge-success">None</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default StudentHome;