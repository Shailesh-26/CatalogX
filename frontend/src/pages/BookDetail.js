import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api";
import { useToast } from "../context/ToastContext";
import { FINE_PER_DAY, BORROW_DAYS } from "../config";
import PageHeader from "../components/PageHeader";

const CATEGORY_COLORS = {
  Fiction:    { bg: "var(--color-info-bg)",    badge: "badge-info"    },
  Science:    { bg: "var(--color-success-bg)", badge: "badge-success" },
  Technology: { bg: "var(--color-warning-bg)", badge: "badge-warning" },
  History:    { bg: "var(--surface-2)",        badge: "badge-neutral" },
  Other:      { bg: "var(--surface-2)",        badge: "badge-neutral" },
};

const SPINE_EMOJIS = {
  Fiction: "📕", Science: "🔬", Technology: "💻", History: "📜", Other: "📗"
};

const MOOD_COLORS = {
  "Thought-provoking": "#8e44ad",
  "Inspiring":         "#1a6b3c",
  "Fast read":         "#2471a3",
  "Dense":             "#7a9485",
  "Emotional":         "#c0392b",
  "Adventurous":       "#d35400",
  "Educational":       "#2471a3",
  "Relaxing":          "#1a6b3c",
  "Intense":           "#c0392b",
  "Humorous":          "#f59e0b",
  "Dark":              "#4a4a4a",
  "Uplifting":         "#1a6b3c",
};

function StarRating({ value, onChange, readonly = false, size = "1.4rem" }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-8" style={{ alignItems: "center" }}>
      {[1,2,3,4,5].map(star => (
        <span key={star}
          style={{
            fontSize: size, cursor: readonly ? "default" : "pointer",
            color: star <= (hovered || value) ? "#f59e0b" : "var(--border-2)",
            transition: "color 0.1s ease", lineHeight: 1,
          }}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
        >★</span>
      ))}
    </div>
  );
}

function ReviewCard({ review, isOwn, onDelete }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-md)", padding: "16px 18px",
      boxShadow: "var(--shadow-sm)",
    }}>
      <div className="flex-between" style={{ marginBottom: 8 }}>
        <div className="flex gap-8" style={{ alignItems: "center" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "var(--green-600)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.75rem", fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>
            {review.userId?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2) || "?"}
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>
              {review.userId?.name || "Anonymous"}
              {isOwn && <span className="badge badge-success" style={{ marginLeft: 8, fontSize: "0.68rem" }}>You</span>}
            </p>
            <p className="text-muted" style={{ fontSize: "0.75rem" }}>
              {new Date(review.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}
            </p>
          </div>
        </div>
        <div className="flex gap-8" style={{ alignItems: "center" }}>
          <StarRating value={review.rating} readonly size="1rem" />
          {isOwn && (
            <button className="btn btn-ghost btn-sm"
              style={{ color: "var(--color-danger)", fontSize: "0.75rem", padding: "2px 8px" }}
              onClick={onDelete}>🗑</button>
          )}
        </div>
      </div>
      {review.comment && (
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6, marginTop: 6 }}>
          "{review.comment}"
        </p>
      )}
    </div>
  );
}

// ── AI Summary Panel ──────────────────────────────────────────
function AISummaryPanel({ bookId, bookTitle }) {
  const [summary,  setSummary]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [cached,   setCached]   = useState(false);
  const [open,     setOpen]     = useState(false);

  const fetchSummary = async () => {
    if (summary) { setOpen(true); return; } // Already loaded
    setLoading(true);
    setError("");
    setOpen(true);
    try {
      const res = await api.post(`/api/ai/summary/${bookId}`);
      setSummary(res.data.summary);
      setCached(res.data.cached);
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        className="btn btn-secondary w-full"
        style={{
          justifyContent: "center",
          background: "linear-gradient(135deg, var(--green-50), var(--amber-50))",
          border: "1.5px solid var(--green-200)",
          color: "var(--green-800)",
          fontWeight: 600,
        }}
        onClick={fetchSummary}
      >
        ✨ AI Summary
      </button>
    );
  }

  return (
    <div style={{
      background: "linear-gradient(135deg, var(--green-50) 0%, var(--amber-50) 100%)",
      border: "1.5px solid var(--green-200)",
      borderRadius: "var(--radius-lg)",
      padding: "18px",
      animation: "slideDown 0.2s ease",
    }}>
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: 12 }}>
        <div className="flex gap-8" style={{ alignItems: "center" }}>
          <span style={{ fontSize: "1.1rem" }}>✨</span>
          <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--green-800)" }}>
            AI Summary
            {cached && (
              <span style={{ fontSize: "0.68rem", fontWeight: 500,
                color: "var(--text-muted)", marginLeft: 8 }}>
                (cached)
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setOpen(false)}
          style={{ background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", fontSize: "0.9rem" }}>✕</button>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column",
          alignItems: "center", gap: 12, padding: "20px 0" }}>
          <div style={{
            width: 28, height: 28,
            border: "3px solid var(--green-100)",
            borderTopColor: "var(--green-600)",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }} />
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Gemini is reading "{bookTitle}"…
          </p>
        </div>
      ) : error ? (
        <div className="alert alert-danger" style={{ margin: 0 }}>
          <span>⚠</span> {error}
        </div>
      ) : summary ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Overview */}
          <div>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.07em", color: "var(--green-600)", marginBottom: 5 }}>
              Overview
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)",
              lineHeight: 1.65 }}>
              {summary.overview}
            </p>
          </div>

          {/* Themes */}
          <div>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.07em", color: "var(--green-600)", marginBottom: 5 }}>
              Themes
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)",
              lineHeight: 1.65 }}>
              {summary.themes}
            </p>
          </div>

          {/* Best For */}
          <div style={{
            background: "rgba(26,107,60,0.08)", border: "1px solid var(--green-100)",
            borderRadius: "var(--radius-sm)", padding: "10px 12px",
          }}>
            <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.07em", color: "var(--green-600)", marginBottom: 3 }}>
              Best For
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--green-800)", fontWeight: 500 }}>
              {summary.bestFor}
            </p>
          </div>

          {/* Meta row */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: "0.78rem", color: "var(--text-muted)",
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "20px", padding: "3px 10px",
            }}>
              📖 {summary.readingTime}
            </span>
            <span style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: "0.78rem", color: "var(--text-muted)",
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "20px", padding: "3px 10px",
            }}>
              🎓 {summary.difficulty}
            </span>
          </div>

          {/* Mood tags */}
          {summary.mood && summary.mood.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {summary.mood.map(tag => (
                <span key={tag} style={{
                  padding: "3px 10px", borderRadius: "20px",
                  fontSize: "0.72rem", fontWeight: 700,
                  background: `${MOOD_COLORS[tag] || "#7a9485"}18`,
                  color: MOOD_COLORS[tag] || "var(--text-muted)",
                  border: `1px solid ${MOOD_COLORS[tag] || "#7a9485"}33`,
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 4 }}>
            ✨ Generated by Gemini AI
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
function BookDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const toast    = useToast();
  const role     = localStorage.getItem("role");
  const userId   = localStorage.getItem("userId");

  const [book,           setBook]           = useState(null);
  const [related,        setRelated]        = useState([]);
  const [alsoBorrowed,   setAlsoBorrowed]   = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [borrowing,      setBorrowing]      = useState(false);
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [showDelete,     setShowDelete]     = useState(false);
  const [editing,        setEditing]        = useState(false);
  const [editForm,       setEditForm]       = useState({});

  const [reviews,          setReviews]          = useState([]);
  const [avgRating,        setAvgRating]        = useState(null);
  const [totalReviews,     setTotalReviews]     = useState(0);
  const [myReview,         setMyReview]         = useState(null);
  const [showReviewForm,   setShowReviewForm]   = useState(false);
  const [reviewForm,       setReviewForm]       = useState({ rating: 0, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasReturned,      setHasReturned]      = useState(false);

  const [waitlist,     setWaitlist]     = useState([]);
  const [onWaitlist,   setOnWaitlist]   = useState(false);
  const [joiningQueue, setJoiningQueue] = useState(false);
  const [myPosition,   setMyPosition]   = useState(null);

  const fetchBook = () => {
    Promise.all([
      api.get(`/api/books/${id}`),
      api.get(`/api/books/${id}/related`),
      api.get(`/api/books/${id}/also-borrowed`),
    ])
      .then(([bookRes, relatedRes, alsoBorrowedRes]) => {
        setBook(bookRes.data);
        setEditForm(bookRes.data);
        setRelated(relatedRes.data);
        setAlsoBorrowed(alsoBorrowedRes.data.books || []);
      })
      .catch(() => { toast.error("Not found", "Could not load this book."); navigate("/books"); })
      .finally(() => setLoading(false));
  };

  const fetchReviews = () => {
    api.get(`/api/reviews/${id}`)
      .then(res => {
        setReviews(res.data.reviews);
        setAvgRating(res.data.averageRating);
        setTotalReviews(res.data.totalReviews);
        const mine = res.data.reviews.find(r => r.userId?._id === userId || r.userId === userId);
        setMyReview(mine || null);
        if (mine) setReviewForm({ rating: mine.rating, comment: mine.comment });
      })
      .catch(() => {});
  };

  const fetchWaitlist = () => {
    api.get(`/api/requests/book/${id}`).then(res => setWaitlist(res.data)).catch(() => {});
    if (role === "student") {
      api.get(`/api/requests/check/${id}/${userId}`)
        .then(res => { setOnWaitlist(res.data.onWaitlist); setMyPosition(res.data.request?.position || null); })
        .catch(() => {});
    }
  };

  const checkIfReturned = () => {
    if (role !== "student") return;
    api.get(`/api/borrow/history/${userId}`)
      .then(res => setHasReturned(res.data.some(r => r.bookId?._id === id || r.bookId === id)))
      .catch(() => {});
  };

  useEffect(() => {
    setLoading(true);
    fetchBook(); fetchReviews(); fetchWaitlist(); checkIfReturned();
  }, [id]); // eslint-disable-line

  const handleBorrow = async () => {
    setBorrowing(true);
    try {
      await api.post("/api/borrow/borrow", { userId, bookId: id });
      toast.success("Book borrowed!", `"${book.title}" is due in ${BORROW_DAYS} days.`);
      setShowConfirm(false);
      const res = await api.get(`/api/books/${id}`);
      setBook(res.data);
    } catch (err) {
      toast.error("Cannot borrow", err.response?.data?.message || "Please try again.");
    } finally { setBorrowing(false); }
  };

  const handleJoinWaitlist = async () => {
    setJoiningQueue(true);
    try {
      const res = await api.post("/api/requests/join", { userId, bookId: id });
      toast.success("Joined waitlist!", res.data.message);
      setOnWaitlist(true); setMyPosition(res.data.position);
      fetchWaitlist();
    } catch (err) {
      toast.error("Cannot join", err.response?.data?.message || "Please try again.");
    } finally { setJoiningQueue(false); }
  };

  const handleLeaveWaitlist = async () => {
    try {
      await api.delete(`/api/requests/leave/${id}`, { data: { userId } });
      toast.success("Left waitlist", "Removed from the queue.");
      setOnWaitlist(false); setMyPosition(null); fetchWaitlist();
    } catch { toast.error("Failed", "Could not remove you from the waitlist."); }
  };

  const handleEditSave = async () => {
    try {
      await api.put(`/api/books/${id}`, editForm);
      toast.success("Book updated!", "Changes saved.");
      setBook(editForm); setEditing(false);
    } catch { toast.error("Update failed", "Could not save changes."); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/books/${id}`);
      toast.success("Book deleted", `"${book.title}" removed.`);
      navigate("/books");
    } catch { toast.error("Delete failed", "Could not delete the book."); }
  };

  const handleReviewSubmit = async () => {
    if (!reviewForm.rating) { toast.warning("Rating required", "Please select a star rating."); return; }
    setSubmittingReview(true);
    try {
      await api.post("/api/reviews", { userId, bookId: id, rating: reviewForm.rating, comment: reviewForm.comment });
      toast.success("Review submitted!", "Thank you for your feedback.");
      setShowReviewForm(false); fetchReviews();
    } catch (err) {
      toast.error("Review failed", err.response?.data?.message || "Please try again.");
    } finally { setSubmittingReview(false); }
  };

  const handleDeleteReview = async () => {
    try {
      await api.delete(`/api/reviews/${id}`);
      toast.success("Review deleted", "Your review has been removed.");
      setMyReview(null); setReviewForm({ rating: 0, comment: "" }); fetchReviews();
    } catch { toast.error("Failed", "Could not delete your review."); }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div className="spinner-wrapper"><div className="spinner"></div><span>Loading…</span></div>
      </div>
    );
  }

  if (!book) return null;

  const catStyle   = CATEGORY_COLORS[book.category] || CATEGORY_COLORS.Other;
  const spineEmoji = SPINE_EMOJIS[book.category] || "📘";
  const isAvailable = book.availableCopies > 0;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Books", to: "/books" }, { label: book.title }]}
        title={book.title}
        subtitle={`by ${book.author} · ${book.category}`}
        actions={
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
        }
      />

      <div className="page-wrapper">
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 24, alignItems: "start" }}>

          {/* LEFT — Cover + actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Cover */}
            <div style={{
              background: `linear-gradient(145deg, ${catStyle.bg}, var(--surface))`,
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "28px 20px",
              textAlign: "center",
              boxShadow: "var(--shadow-md)",
            }}>
              {book.coverImage ? (
                <img src={book.coverImage} alt={book.title}
                  style={{ width: "100%", height: 180, objectFit: "cover",
                    borderRadius: "var(--radius-md)", marginBottom: 14 }} />
              ) : (
                <div style={{ fontSize: "4.5rem", marginBottom: 14, lineHeight: 1 }}>{spineEmoji}</div>
              )}
              <p style={{ fontFamily: "var(--font-display)", fontSize: "1rem",
                fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3, marginBottom: 6 }}>
                {book.title}
              </p>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: 12 }}>
                by {book.author}
              </p>
              <span className={`badge ${catStyle.badge}`}>{book.category}</span>

              {avgRating && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                  <div className="flex-center gap-8" style={{ marginBottom: 3 }}>
                    <StarRating value={Math.round(avgRating)} readonly size="1rem" />
                    <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--amber-600)" }}>
                      {avgRating}
                    </span>
                  </div>
                  <p className="text-muted" style={{ fontSize: "0.72rem" }}>
                    {totalReviews} review{totalReviews !== 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </div>

            {/* Availability */}
            <div style={{
              background: isAvailable ? "var(--color-success-bg)" : "var(--color-danger-bg)",
              border: `1px solid ${isAvailable ? "#a8d5b8" : "#f5c6c3"}`,
              borderRadius: "var(--radius-md)", padding: "12px 16px", textAlign: "center",
            }}>
              <p style={{ fontWeight: 700, fontSize: "1.5rem",
                color: isAvailable ? "var(--color-success)" : "var(--color-danger)" }}>
                {book.availableCopies}
              </p>
              <p style={{ fontSize: "0.75rem", fontWeight: 600,
                color: isAvailable ? "var(--color-success-text)" : "var(--color-danger-text)",
                textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {isAvailable ? "Copies Available" : "Unavailable"}
              </p>
            </div>

            {/* Student actions */}
            {role === "student" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {isAvailable ? (
                  <button className="btn btn-primary w-full" style={{ justifyContent: "center" }}
                    onClick={() => setShowConfirm(true)}>
                    📖 Borrow this Book
                  </button>
                ) : (
                  <>
                    <button className="btn btn-secondary w-full" disabled style={{ justifyContent: "center" }}>
                      ❌ Unavailable
                    </button>
                    {onWaitlist ? (
                      <div style={{ background: "var(--color-info-bg)", border: "1px solid #b3d7f0",
                        borderRadius: "var(--radius-md)", padding: "12px 14px", textAlign: "center" }}>
                        <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--color-info-text)", marginBottom: 6 }}>
                          📋 You're #{myPosition} in queue
                        </p>
                        <p style={{ fontSize: "0.75rem", color: "var(--color-info-text)", marginBottom: 10 }}>
                          We'll notify you when available.
                        </p>
                        <button className="btn btn-ghost btn-sm"
                          style={{ color: "var(--color-danger)", width: "100%", justifyContent: "center" }}
                          onClick={handleLeaveWaitlist}>Leave Waitlist</button>
                      </div>
                    ) : (
                      <button className="btn btn-amber w-full" style={{ justifyContent: "center" }}
                        onClick={handleJoinWaitlist} disabled={joiningQueue}>
                        {joiningQueue ? "Joining…" : "📋 Join Waitlist"}
                      </button>
                    )}
                  </>
                )}

                {/* ✨ AI Summary button */}
                <AISummaryPanel bookId={id} bookTitle={book.title} />
              </div>
            )}

            {/* Admin actions */}
            {role === "admin" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <AISummaryPanel bookId={id} bookTitle={book.title} />
                <button className="btn btn-secondary w-full" style={{ justifyContent: "center" }}
                  onClick={() => setEditing(e => !e)}>
                  {editing ? "✕ Cancel Edit" : "✏ Edit Book"}
                </button>
                <button className="btn btn-danger w-full" style={{ justifyContent: "center" }}
                  onClick={() => setShowDelete(true)}>
                  🗑 Delete Book
                </button>
              </div>
            )}

            {/* Admin waitlist */}
            {role === "admin" && waitlist.length > 0 && (
              <div>
                <p style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 8 }}>
                  Waitlist ({waitlist.length})
                </p>
                {waitlist.map(req => (
                  <div key={req._id} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "7px 10px", background: "var(--surface-2)",
                    borderRadius: "var(--radius-sm)", marginBottom: 5, fontSize: "0.82rem",
                  }}>
                    <span style={{ fontWeight: 700, color: "var(--text-muted)", minWidth: 20 }}>#{req.position}</span>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)", flex: 1 }}>{req.userId?.name || "Unknown"}</span>
                    <span className={`badge ${req.status === "notified" ? "badge-warning" : "badge-neutral"}`}>{req.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — Details */}
          <div>
            <div className="card" style={{ marginBottom: 20 }}>
              {!editing ? (
                <div>
                  {[
                    { label: "Author",         value: book.author },
                    { label: "ISBN",           value: book.isbn },
                    { label: "Category",       value: book.category },
                    { label: "Copies",         value: book.availableCopies },
                    { label: "Times Borrowed", value: book.totalBorrows || 0 },
                    { label: "Last Borrowed",  value: book.lastBorrowed
                      ? new Date(book.lastBorrowed).toLocaleDateString("en-IN") : "Never" },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "13px 0", borderBottom: "1px solid var(--border)",
                    }}>
                      <span style={{ fontSize: "0.82rem", color: "var(--text-muted)",
                        fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        {label}
                      </span>
                      <span style={{ fontSize: "0.925rem", color: "var(--text-primary)", fontWeight: 500 }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ animation: "slideDown 0.2s ease" }}>
                  <p style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: 16,
                    color: "var(--text-primary)" }}>Editing Book</p>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Title</label>
                      <input className="form-input" value={editForm.title}
                        onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Author</label>
                      <input className="form-input" value={editForm.author}
                        onChange={e => setEditForm(p => ({ ...p, author: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">ISBN</label>
                      <input className="form-input" value={editForm.isbn}
                        onChange={e => setEditForm(p => ({ ...p, isbn: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Copies</label>
                      <input className="form-input" type="number" min="0"
                        value={editForm.availableCopies}
                        onChange={e => setEditForm(p => ({ ...p, availableCopies: Number(e.target.value) }))} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={editForm.category}
                      onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}>
                      {["Fiction","Science","Technology","History","Other"].map(c => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-8 mt-8">
                    <button className="btn btn-primary" onClick={handleEditSave}
                      style={{ flex: 1, justifyContent: "center" }}>✓ Save</button>
                    <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {/* Popularity badge */}
            {book.totalBorrows > 0 && (
              <div style={{ marginBottom: 20, padding: "12px 16px",
                background: "var(--amber-50)", border: "1px solid var(--amber-100)",
                borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: "1.3rem" }}>
                  {book.totalBorrows >= 20 ? "🔥" : book.totalBorrows >= 10 ? "⭐" : "📈"}
                </span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--amber-800)" }}>
                    {book.totalBorrows >= 20 ? "Trending" : book.totalBorrows >= 10 ? "Popular Pick" : "Rising Title"}
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "var(--amber-600)" }}>
                    Borrowed {book.totalBorrows} time{book.totalBorrows !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            )}

            {/* Borrow confirm */}
            {showConfirm && (
              <div className="return-confirm" style={{ marginBottom: 20 }}>
                <strong>Borrow "{book.title}"?</strong>
                <p style={{ marginTop: 4, fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  Due in <strong>{BORROW_DAYS} days</strong>. Fine of ₹{FINE_PER_DAY}/day if returned late.
                </p>
                <div className="return-confirm-actions">
                  <button className="btn btn-primary btn-sm" onClick={handleBorrow} disabled={borrowing}>
                    {borrowing ? "Borrowing…" : "Yes, borrow it"}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowConfirm(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <hr className="divider" style={{ marginTop: 28 }} />
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <div>
            <p className="section-title" style={{ marginBottom: 2 }}>Reviews & Ratings</p>
            <p className="text-muted">
              {totalReviews > 0
                ? `${totalReviews} review${totalReviews !== 1 ? "s" : ""} · avg ${avgRating} ★`
                : "No reviews yet"}
            </p>
          </div>
          {role === "student" && hasReturned && !myReview && !showReviewForm && (
            <button className="btn btn-amber btn-sm" onClick={() => setShowReviewForm(true)}>
              ★ Write a Review
            </button>
          )}
          {role === "student" && !hasReturned && (
            <span className="text-muted" style={{ fontSize: "0.8rem" }}>
              Return this book to leave a review
            </span>
          )}
        </div>

        {showReviewForm && (
          <div className="card" style={{ marginBottom: 20, animation: "slideDown 0.2s ease" }}>
            <p style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 14 }}>Your Review</p>
            <div style={{ marginBottom: 12 }}>
              <p className="form-label" style={{ marginBottom: 8 }}>Rating</p>
              <StarRating value={reviewForm.rating}
                onChange={r => setReviewForm(p => ({ ...p, rating: r }))} size="1.8rem" />
            </div>
            <div className="form-group">
              <label className="form-label">Comment (optional)</label>
              <textarea className="form-textarea" placeholder="Share your thoughts…"
                value={reviewForm.comment}
                onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                maxLength={500} />
              <span className="form-hint">{reviewForm.comment.length}/500</span>
            </div>
            <div className="flex gap-8">
              <button className="btn btn-secondary" onClick={() => setShowReviewForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleReviewSubmit}
                disabled={submittingReview || !reviewForm.rating}
                style={{ flex: 1, justifyContent: "center" }}>
                {submittingReview ? "Submitting…" : "Submit Review"}
              </button>
            </div>
          </div>
        )}

        {myReview && !showReviewForm && (
          <div style={{ marginBottom: 16 }}>
            <ReviewCard review={myReview} isOwn onDelete={handleDeleteReview} />
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }}
              onClick={() => { setShowReviewForm(true); setReviewForm({ rating: myReview.rating, comment: myReview.comment }); }}>
              ✏ Edit your review
            </button>
          </div>
        )}

        {reviews.length === 0 && !showReviewForm ? (
          <div className="empty-state" style={{ padding: "32px 20px" }}>
            <div className="empty-state-icon">⭐</div>
            <p className="empty-state-title">No reviews yet</p>
            <p className="empty-state-text">
              {role === "student" && hasReturned
                ? "You've read this book! Share your thoughts."
                : "Reviews appear here after students return this book."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {reviews
              .filter(r => r.userId?._id !== userId && r.userId !== userId)
              .map(r => <ReviewCard key={r._id} review={r} isOwn={false} />)
            }
          </div>
        )}

        {/* People Also Borrowed */}
        {alsoBorrowed.length > 0 && (
          <>
            <hr className="divider" style={{ marginTop: 32 }} />
            <p className="section-title" style={{ marginBottom: 16 }}>👥 People Also Borrowed</p>
            <div className="books-grid">
              {alsoBorrowed.map(b => (
                <Link key={b._id} to={`/books/${b._id}`} style={{ textDecoration: "none" }}>
                  <div className="book-card" style={{ cursor: "pointer" }}>
                    <div className="book-card-spine">{SPINE_EMOJIS[b.category] || "📘"}</div>
                    <p className="book-title">{b.title}</p>
                    <p className="book-author">by {b.author}</p>
                    <div className="book-meta">
                      <span className={`badge ${b.availableCopies > 0 ? "badge-success" : "badge-danger"}`}>
                        {b.availableCopies > 0 ? `${b.availableCopies} available` : "Unavailable"}
                      </span>
                      {b.totalBorrows > 0 && (
                        <span className="badge badge-neutral">
                          {b.totalBorrows} borrow{b.totalBorrows !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Related */}
        {related.length > 0 && (
          <>
            <hr className="divider" style={{ marginTop: 32 }} />
            <p className="section-title" style={{ marginBottom: 16 }}>More in {book.category}</p>
            <div className="books-grid">
              {related.map(r => (
                <Link key={r._id} to={`/books/${r._id}`} style={{ textDecoration: "none" }}>
                  <div className="book-card" style={{ cursor: "pointer" }}>
                    <div className="book-card-spine">{SPINE_EMOJIS[r.category] || "📘"}</div>
                    <p className="book-title">{r.title}</p>
                    <p className="book-author">by {r.author}</p>
                    <div className="book-meta">
                      <span className={`badge ${CATEGORY_COLORS[r.category]?.badge || "badge-neutral"}`}>
                        {r.category}
                      </span>
                      <span className={`badge ${r.availableCopies > 0 ? "badge-success" : "badge-danger"}`}>
                        {r.availableCopies > 0 ? `${r.availableCopies} available` : "Unavailable"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete modal */}
      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">🗑</div>
            <h2 className="modal-title">Delete this book?</h2>
            <p className="modal-message">
              "<strong>{book.title}</strong>" will be permanently removed. This cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDelete(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Yes, delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BookDetail;