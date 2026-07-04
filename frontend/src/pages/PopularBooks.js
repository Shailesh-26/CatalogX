import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import PageHeader from "../components/PageHeader";

const SPINE_EMOJIS = {
  Fiction: "📕", Science: "🔬", Technology: "💻", History: "📜", Other: "📗"
};

const CAT_BADGE = {
  Fiction: "badge-info", Science: "badge-success",
  Technology: "badge-warning", History: "badge-neutral", Other: "badge-neutral"
};

const RANK_STYLES = [
  { bg: "#fef9ec", border: "#fde8aa", color: "#b47408", medal: "🥇" },
  { bg: "#f5f7f5", border: "#d4e0d7", color: "#4a6352", medal: "🥈" },
  { bg: "#fdf0ef", border: "#f5c6c3", color: "#7b241c", medal: "🥉" },
];

function PopularityBar({ value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{
      height: 6, background: "var(--surface-2)",
      borderRadius: 3, overflow: "hidden", marginTop: 6,
    }}>
      <div style={{
        height: "100%", width: `${pct}%`,
        background: "linear-gradient(90deg, var(--green-400), var(--amber-400))",
        borderRadius: 3,
        transition: "width 0.6s ease",
      }} />
    </div>
  );
}

function PopularBooks() {
  const [books,   setBooks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");
  const role = localStorage.getItem("role");

  useEffect(() => {
    api.get("/api/books/all")
      .then(res => {
        const sorted = res.data
          .filter(b => b.totalBorrows > 0)
          .sort((a, b) => b.totalBorrows - a.totalBorrows);
        setBooks(sorted);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const maxBorrows = books[0]?.totalBorrows || 1;

  const filtered = filter === "all"    ? books
    : filter === "trending"  ? books.filter(b => b.totalBorrows >= 20)
    : filter === "popular"   ? books.filter(b => b.totalBorrows >= 10 && b.totalBorrows < 20)
    : books.filter(b => b.totalBorrows < 10);

  const getPopularityLabel = (count) => {
    if (count >= 20) return { label: "🔥 Trending",    color: "#c0392b" };
    if (count >= 10) return { label: "⭐ Popular",     color: "#b47408" };
    return               { label: "📈 Rising",        color: "#2471a3" };
  };

  return (
    <>
      <PageHeader
        eyebrow={role === "admin" ? "Admin · Analytics" : "Library"}
        title="Most Popular Books"
        subtitle="Ranked by total number of borrows across all students."
      />

      <div className="page-wrapper">
        {/* Summary stats */}
        {!loading && books.length > 0 && (
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card stat-card--green">
              <span className="stat-icon">📚</span>
              <span className="stat-label">Books with Borrows</span>
              <span className="stat-value">{books.length}</span>
            </div>
            <div className="stat-card stat-card--amber">
              <span className="stat-icon">🔥</span>
              <span className="stat-label">Most Borrowed</span>
              <span className="stat-value">{maxBorrows}</span>
            </div>
            <div className="stat-card stat-card--info">
              <span className="stat-icon">📈</span>
              <span className="stat-label">Total Borrows</span>
              <span className="stat-value">
                {books.reduce((s, b) => s + b.totalBorrows, 0)}
              </span>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-8" style={{ marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { key: "all",      label: "All" },
            { key: "trending", label: "🔥 Trending (20+)" },
            { key: "popular",  label: "⭐ Popular (10–19)" },
            { key: "rising",   label: "📈 Rising (<10)" },
          ].map(f => (
            <button key={f.key}
              className={`btn btn-sm ${filter === f.key ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="spinner-wrapper"><div className="spinner"></div><span>Loading…</span></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <p className="empty-state-title">No books in this category yet</p>
            <p className="empty-state-text">
              {books.length === 0
                ? "Books appear here once students start borrowing."
                : "Try a different filter."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((book, index) => {
              const rankStyle = RANK_STYLES[index] || null;
              const pop = getPopularityLabel(book.totalBorrows);
              const isTopThree = index < 3;

              return (
                <Link key={book._id} to={`/books/${book._id}`}
                  style={{ textDecoration: "none" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "16px 20px",
                    background: isTopThree ? rankStyle.bg : "var(--surface)",
                    border: `1px solid ${isTopThree ? rankStyle.border : "var(--border)"}`,
                    borderRadius: "var(--radius-lg)",
                    boxShadow: "var(--shadow-sm)",
                    transition: "var(--transition)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
                  >
                    {/* Rank */}
                    <div style={{
                      width: 44, height: 44, flexShrink: 0,
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center",
                      background: isTopThree ? "rgba(255,255,255,0.6)" : "var(--surface-2)",
                      border: `1px solid ${isTopThree ? rankStyle.border : "var(--border)"}`,
                      borderRadius: "var(--radius-md)",
                    }}>
                      {isTopThree ? (
                        <span style={{ fontSize: "1.3rem" }}>{rankStyle.medal}</span>
                      ) : (
                        <span style={{ fontSize: "0.875rem", fontWeight: 700,
                          color: "var(--text-muted)" }}>#{index + 1}</span>
                      )}
                    </div>

                    {/* Book icon / cover */}
                    <div style={{ flexShrink: 0 }}>
                      {book.coverImage ? (
                        <img src={book.coverImage} alt={book.title}
                          style={{ width: 40, height: 52, objectFit: "cover",
                            borderRadius: "var(--radius-sm)" }} />
                      ) : (
                        <div style={{
                          width: 40, height: 52,
                          background: "linear-gradient(135deg, var(--green-50), var(--green-100))",
                          border: "1px solid var(--green-100)",
                          borderRadius: "var(--radius-sm)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "1.2rem",
                        }}>
                          {SPINE_EMOJIS[book.category] || "📘"}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex gap-8" style={{ alignItems: "center", marginBottom: 2, flexWrap: "wrap" }}>
                        <p style={{ fontWeight: 700, fontSize: "0.95rem",
                          color: "var(--text-primary)", whiteSpace: "nowrap",
                          overflow: "hidden", textOverflow: "ellipsis" }}>
                          {book.title}
                        </p>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700,
                          color: pop.color, whiteSpace: "nowrap" }}>
                          {pop.label}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)",
                        marginBottom: 4 }}>
                        by {book.author}
                      </p>
                      <div className="flex gap-6" style={{ alignItems: "center", flexWrap: "wrap" }}>
                        <span className={`badge ${CAT_BADGE[book.category] || "badge-neutral"}`}>
                          {book.category}
                        </span>
                        <span className={`badge ${book.availableCopies > 0 ? "badge-success" : "badge-danger"}`}>
                          {book.availableCopies > 0 ? `${book.availableCopies} available` : "Unavailable"}
                        </span>
                        {book.lastBorrowed && (
                          <span className="text-muted" style={{ fontSize: "0.72rem" }}>
                            Last borrowed {new Date(book.lastBorrowed).toLocaleDateString("en-IN")}
                          </span>
                        )}
                      </div>
                      <PopularityBar value={book.totalBorrows} max={maxBorrows} />
                    </div>

                    {/* Borrow count */}
                    <div style={{ flexShrink: 0, textAlign: "center" }}>
                      <p style={{
                        fontSize: "1.8rem", fontWeight: 700, lineHeight: 1,
                        color: isTopThree ? rankStyle.color : "var(--text-primary)",
                      }}>
                        {book.totalBorrows}
                      </p>
                      <p style={{ fontSize: "0.7rem", color: "var(--text-muted)",
                        fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        borrows
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default PopularBooks;