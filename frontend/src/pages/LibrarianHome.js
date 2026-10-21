import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const DAY = 24 * 60 * 60 * 1000;

function LibrarianHome() {
  const [books,   setBooks]   = useState([]);
  const [records, setRecords] = useState([]);
  const [queues,  setQueues]  = useState([]);
  const [loading, setLoading] = useState(true);
  const name = localStorage.getItem("name") || "Librarian";

  useEffect(() => {
    Promise.allSettled([
      api.get("/api/books/all"),
      api.get("/api/borrow/all"),
      api.get("/api/requests/all-queues"),
    ])
      .then(([booksRes, borrowRes, queueRes]) => {
        if (booksRes.status  === "fulfilled") setBooks(booksRes.value.data);
        if (borrowRes.status === "fulfilled") setRecords(borrowRes.value.data);
        if (queueRes.status  === "fulfilled") setQueues(queueRes.value.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="spinner-wrapper"><div className="spinner"></div><span>Loading dashboard…</span></div>;
  }

  const now            = new Date();
  const availableCopies = books.reduce((sum, b) => sum + (b.availableCopies || 0), 0);
  const active         = records.filter(r => !r.returned);
  const overdue        = active
    .filter(r => new Date(r.dueDate) < now)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const dueSoon        = active.filter(r => {
    const d = new Date(r.dueDate);
    return d >= now && d - now <= DAY;
  });
  const outOfStock     = books.filter(b => b.availableCopies === 0);
  const waitingTotal   = queues.reduce((s, q) => s + (q.waitingCount || 0), 0);

  return (
    <div className="page-wrapper">
      <h1 className="page-title">Welcome, {name.split(" ")[0]} 👋</h1>
      <p className="page-subtitle">
        Here's what needs your attention in the library today.
      </p>

      <div className="stat-grid">
        <div className="stat-card stat-card--info">
          <span className="stat-label">Titles</span>
          <span className="stat-value">{books.length}</span>
        </div>
        <div className="stat-card stat-card--green">
          <span className="stat-label">Copies on shelf</span>
          <span className="stat-value">{availableCopies}</span>
        </div>
        <div className="stat-card stat-card--amber">
          <span className="stat-label">Borrowed now</span>
          <span className="stat-value">{active.length}</span>
        </div>
        <div className="stat-card stat-card--danger">
          <span className="stat-label">Overdue</span>
          <span className="stat-value">{overdue.length}</span>
        </div>
      </div>

      <div className="quick-actions" style={{ marginBottom: 28 }}>
        <Link to="/add" className="quick-action-card">
          <span className="quick-action-icon">➕</span>
          <span className="quick-action-label">Add Book</span>
          <span className="quick-action-desc">Add a new title to the catalogue</span>
        </Link>
        <Link to="/books" className="quick-action-card">
          <span className="quick-action-icon">📚</span>
          <span className="quick-action-label">Manage Books</span>
          <span className="quick-action-desc">Edit copies, tags and covers</span>
        </Link>
        <Link to="/admin" className="quick-action-card">
          <span className="quick-action-icon">📋</span>
          <span className="quick-action-label">Borrow Logs</span>
          <span className="quick-action-desc">All borrowing activity</span>
        </Link>
        <Link to="/admin/queues" className="quick-action-card">
          <span className="quick-action-icon">⏳</span>
          <span className="quick-action-label">Waitlists</span>
          <span className="quick-action-desc">{waitingTotal} student{waitingTotal !== 1 ? "s" : ""} waiting</span>
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        <div className="card">
          <h3 className="section-title" style={{ marginBottom: 12 }}>🚨 Overdue returns</h3>
          {overdue.length === 0 ? (
            <p className="text-muted">Nothing overdue. 🎉</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead><tr><th>Student</th><th>Book</th><th>Days late</th></tr></thead>
                <tbody>
                  {overdue.slice(0, 8).map(r => (
                    <tr key={r._id}>
                      <td>{r.userId?.name || "—"}</td>
                      <td>{r.bookId?.title || "Deleted book"}</td>
                      <td><span className="badge badge-danger">{Math.ceil((now - new Date(r.dueDate)) / DAY)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {dueSoon.length > 0 && (
            <p className="text-muted" style={{ marginTop: 12, fontSize: "0.8rem" }}>
              ⏰ {dueSoon.length} more due within 24 hours.
            </p>
          )}
        </div>

        <div className="card">
          <h3 className="section-title" style={{ marginBottom: 12 }}>📦 Out of stock</h3>
          {outOfStock.length === 0 ? (
            <p className="text-muted">Every title has at least one copy on the shelf.</p>
          ) : (
            outOfStock.slice(0, 8).map(b => {
              const q = queues.find(x => String(x.bookId) === String(b._id));
              return (
                <Link key={b._id} to={`/books/${b._id}`} style={{
                  display: "flex", justifyContent: "space-between", gap: 12,
                  padding: "10px 0", borderBottom: "1px solid var(--border)",
                  textDecoration: "none", color: "var(--text-primary)",
                }}>
                  <span>
                    <strong>{b.title}</strong>
                    <span className="text-muted" style={{ display: "block", fontSize: "0.8rem" }}>{b.author}</span>
                  </span>
                  {q && <span className="badge badge-warning" style={{ alignSelf: "center" }}>{q.waitingCount} waiting</span>}
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default LibrarianHome;
