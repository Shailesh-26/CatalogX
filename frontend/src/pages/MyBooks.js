import { useEffect, useState, useCallback } from "react";
import api from "../api";
import { useToast } from "../context/ToastContext";
import { FINE_PER_DAY, BORROW_DAYS } from "../config";

function MyBooks() {
  const [records,      setRecords]    = useState([]);
  const [loading,      setLoading]    = useState(true);
  const [returning,    setReturning]  = useState(null);
  const [renewing,     setRenewing]   = useState(null);
  const [confirmId,    setConfirmId]  = useState(null);
  const [notes,        setNotes]      = useState({});   // { borrowId: string }
  const [editingNote,  setEditingNote] = useState(null); // borrowId being edited
  const [savingNote,   setSavingNote]  = useState(null);

  const userId = localStorage.getItem("userId");
  const toast  = useToast();

  const fetchMyBooks = useCallback(() => {
    api.get(`/api/borrow/mybooks/${userId}`)
      .then(res => {
        setRecords(res.data);
        // Fetch notes for all active borrows
        res.data.forEach(r => {
          api.get(`/api/notes/${r._id}`)
            .then(nr => {
              if (nr.data) {
                setNotes(prev => ({ ...prev, [r._id]: nr.data.content }));
              }
            })
            .catch(() => {});
        });
      })
      .catch(() => toast.error("Failed to load", "Could not fetch your books."))
      .finally(() => setLoading(false));
  }, [userId]); // eslint-disable-line

  useEffect(() => { fetchMyBooks(); }, [fetchMyBooks]);

  const calcFine = (dueDate) => {
    const today = new Date();
    const due   = new Date(dueDate);
    if (today <= due) return 0;
    return Math.ceil((today - due) / (1000 * 60 * 60 * 24)) * FINE_PER_DAY;
  };

  const daysLeft = (dueDate) => {
    const diff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // ── Return ────────────────────────────────────────────────
  const handleReturn = async (borrowId, bookTitle) => {
    setReturning(borrowId);
    try {
      await api.post("/api/borrow/return", { borrowId });
      toast.success("Book returned!", `"${bookTitle}" returned successfully.`);
      setConfirmId(null);
      fetchMyBooks();
    } catch (err) {
      toast.error("Return failed", err.response?.data?.message || "Please try again.");
    } finally {
      setReturning(null);
    }
  };

  // ── Renew ─────────────────────────────────────────────────
  const handleRenew = async (borrowId, bookTitle) => {
    setRenewing(borrowId);
    try {
      const res = await api.post("/api/borrow/renew", { borrowId });
      toast.success("Book renewed!", res.data.message);
      setConfirmId(null);
      fetchMyBooks();
    } catch (err) {
      toast.error("Cannot renew", err.response?.data?.message || "Please try again.");
    } finally {
      setRenewing(null);
    }
  };

  // ── Notes ─────────────────────────────────────────────────
  const handleSaveNote = async (borrowId, bookId) => {
    const content = notes[borrowId]?.trim();
    if (!content) {
      await handleDeleteNote(borrowId);
      return;
    }
    setSavingNote(borrowId);
    try {
      await api.post("/api/notes", { userId, bookId, borrowId, content });
      toast.success("Note saved!", "Your reading note has been saved.");
      setEditingNote(null);
    } catch {
      toast.error("Save failed", "Could not save your note.");
    } finally {
      setSavingNote(null);
    }
  };

  const handleDeleteNote = async (borrowId) => {
    try {
      await api.delete(`/api/notes/${borrowId}`);
      setNotes(prev => ({ ...prev, [borrowId]: "" }));
      setEditingNote(null);
      toast.success("Note deleted", "Your note has been removed.");
    } catch {
      toast.error("Delete failed", "Could not delete your note.");
    }
  };

  const overdueCount = records.filter(r => new Date(r.dueDate) < new Date()).length;
  const totalFine    = records.reduce((s, r) => s + calcFine(r.dueDate), 0);

  return (
    <div className="page-wrapper">
      <h1 className="page-title">My Borrowed Books</h1>
      <p className="page-subtitle">Track loans, add notes, renew or return books.</p>

      {/* ── Stat Cards ── */}
      {records.length > 0 && (
        <div className="stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))" }}>
          <div className="stat-card stat-card--green">
            <span className="stat-label">Active Loans</span>
            <span className="stat-value">{records.length}</span>
          </div>
          <div className="stat-card stat-card--info">
            <span className="stat-label">Borrow Period</span>
            <span className="stat-value" style={{ fontSize: "1.4rem" }}>{BORROW_DAYS} days</span>
          </div>
          <div className="stat-card stat-card--danger">
            <span className="stat-label">Overdue</span>
            <span className="stat-value stat-value--danger">{overdueCount}</span>
          </div>
          {totalFine > 0 && (
            <div className="stat-card stat-card--amber">
              <span className="stat-label">Total Fine</span>
              <span className="stat-value" style={{ color: "var(--amber-600)" }}>₹{totalFine}</span>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="spinner-wrapper"><div className="spinner"></div><span>Loading…</span></div>
      ) : records.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <p className="empty-state-title">No active loans</p>
          <p className="empty-state-text">Visit the catalogue to borrow your first book.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
          {records.map(record => {
            const isOverdue      = new Date(record.dueDate) < new Date();
            const fine           = calcFine(record.dueDate);
            const left           = daysLeft(record.dueDate);
            const isConfirmReturn = confirmId?.id === record._id && confirmId?.type === "return";
            const isConfirmRenew  = confirmId?.id === record._id && confirmId?.type === "renew";
            const isEditingNote   = editingNote === record._id;
            const noteContent     = notes[record._id] || "";

            return (
              <div key={record._id}
                className={`borrow-card ${isOverdue ? "borrow-card--overdue" : ""}`}
                style={{ flexDirection: "column", gap: 0, padding: 0 }}>

                {/* ── Main row ── */}
                <div style={{ display: "flex", alignItems: "flex-start",
                  gap: 16, padding: "20px 20px 16px" }}>

                  {/* Book icon */}
                  <div style={{
                    width: 48, height: 60, flexShrink: 0,
                    background: isOverdue ? "var(--color-danger-bg)" : "var(--green-50)",
                    border: `1px solid ${isOverdue ? "#f5c6c3" : "var(--green-100)"}`,
                    borderRadius: "var(--radius-sm)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22
                  }}>
                    {isOverdue ? "⚠️" : "📗"}
                  </div>

                  <div className="borrow-card-body">
                    <p className="borrow-card-title">{record.bookId.title}</p>
                    <p className="borrow-card-author">by {record.bookId.author}</p>
                    <div className="borrow-card-dates">
                      <span>📅 {new Date(record.borrowDate).toLocaleDateString("en-IN")}</span>
                      <span>⏰ Due: {new Date(record.dueDate).toLocaleDateString("en-IN")}</span>
                    </div>
                    <div className="flex gap-8 mt-8" style={{ flexWrap: "wrap", alignItems: "center" }}>
                      {isOverdue
                        ? <span className="badge badge-danger">🚨 Overdue by {Math.abs(left)} day{Math.abs(left) !== 1 ? "s" : ""}</span>
                        : left <= 1
                          ? <span className="badge badge-warning">⏰ Due tomorrow</span>
                          : <span className="badge badge-success">✓ {left} days left</span>
                      }
                      {fine > 0 && <span className="badge badge-warning">₹{fine} fine</span>}
                      {record.renewed && <span className="badge badge-neutral">🔄 Renewed</span>}
                    </div>
                  </div>

                  {/* Action buttons */}
                  {!isConfirmReturn && !isConfirmRenew && (
                    <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                      <button className="btn btn-secondary btn-sm"
                        onClick={() => setConfirmId({ id: record._id, type: "return" })}>
                        ↩ Return
                      </button>
                      {!record.renewed && !isOverdue && (
                        <button className="btn btn-ghost btn-sm"
                          style={{ border: "1px solid var(--color-info)", color: "var(--color-info)" }}
                          onClick={() => setConfirmId({ id: record._id, type: "renew" })}>
                          🔄 Renew
                        </button>
                      )}
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ border: "1px solid var(--border)", fontSize: "0.75rem" }}
                        onClick={() => setEditingNote(isEditingNote ? null : record._id)}
                      >
                        {noteContent ? "📝 Edit Note" : "📝 Add Note"}
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Inline confirmations ── */}
                {(isConfirmReturn || isConfirmRenew) && (
                  <div style={{ padding: "0 20px 16px" }}>
                    <div className="return-confirm"
                      style={isConfirmRenew ? {
                        background: "var(--color-info-bg)",
                        border: "1px solid #b3d7f0",
                        borderLeftColor: "var(--color-info)"
                      } : {}}>
                      {isConfirmReturn ? (
                        <>
                          <strong>Return "{record.bookId.title}"?</strong>
                          {fine > 0 && (
                            <p style={{ marginTop: 4, fontSize: "0.8rem" }}>
                              ⚠ Fine of <strong>₹{fine}</strong> applies for overdue return.
                            </p>
                          )}
                          <div className="return-confirm-actions">
                            <button className="btn btn-sm btn-primary"
                              onClick={() => handleReturn(record._id, record.bookId.title)}
                              disabled={returning === record._id}>
                              {returning === record._id ? "Returning…" : "Yes, return it"}
                            </button>
                            <button className="btn btn-sm btn-secondary"
                              onClick={() => setConfirmId(null)}>Cancel</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <strong>Renew "{record.bookId.title}"?</strong>
                          <p style={{ marginTop: 4, fontSize: "0.8rem", color: "var(--color-info-text)" }}>
                            Due date extends by <strong>{BORROW_DAYS} more days</strong>. You can only renew once.
                          </p>
                          <div className="return-confirm-actions">
                            <button className="btn btn-sm btn-primary"
                              onClick={() => handleRenew(record._id, record.bookId.title)}
                              disabled={renewing === record._id}>
                              {renewing === record._id ? "Renewing…" : "Yes, renew it"}
                            </button>
                            <button className="btn btn-sm btn-secondary"
                              onClick={() => setConfirmId(null)}>Cancel</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Notes panel ── */}
                {isEditingNote && (
                  <div style={{
                    padding: "0 20px 20px",
                    borderTop: "1px solid var(--border)",
                    paddingTop: 16,
                    animation: "slideDown 0.2s ease"
                  }}>
                    <p style={{ fontSize: "0.8rem", fontWeight: 600,
                      color: "var(--text-muted)", textTransform: "uppercase",
                      letterSpacing: "0.05em", marginBottom: 8 }}>
                      📝 Reading Notes
                    </p>
                    <textarea
                      className="form-textarea"
                      placeholder="Jot down your thoughts, key ideas, or page numbers to remember…"
                      value={noteContent}
                      onChange={e => setNotes(prev => ({ ...prev, [record._id]: e.target.value }))}
                      style={{ minHeight: 100, fontSize: "0.875rem", marginBottom: 10 }}
                      maxLength={1000}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "center" }}>
                      <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                        {noteContent.length}/1000
                      </span>
                      <div className="flex gap-8">
                        {noteContent && (
                          <button className="btn btn-ghost btn-sm"
                            style={{ color: "var(--color-danger)", fontSize: "0.78rem" }}
                            onClick={() => handleDeleteNote(record._id)}>
                            🗑 Delete
                          </button>
                        )}
                        <button className="btn btn-secondary btn-sm"
                          onClick={() => setEditingNote(null)}>Cancel</button>
                        <button className="btn btn-primary btn-sm"
                          onClick={() => handleSaveNote(record._id, record.bookId._id)}
                          disabled={savingNote === record._id}>
                          {savingNote === record._id ? "Saving…" : "Save Note"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Saved note preview (collapsed) ── */}
                {!isEditingNote && noteContent && (
                  <div style={{
                    padding: "10px 20px 14px",
                    borderTop: "1px solid var(--border)",
                    background: "var(--surface-2)"
                  }}>
                    <p style={{ fontSize: "0.75rem", fontWeight: 600,
                      color: "var(--text-muted)", marginBottom: 4,
                      textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      📝 My Note
                    </p>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)",
                      lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {noteContent.length > 120 ? noteContent.slice(0, 120) + "…" : noteContent}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyBooks;