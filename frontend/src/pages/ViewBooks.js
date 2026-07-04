import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useToast } from "../context/ToastContext";
import Pagination from "../components/Pagination";
// import { FINE_PER_DAY, BORROW_DAYS, MAX_BORROWS } from "../config";
import {  BORROW_DAYS } from "../config";

const DEFAULT_CATEGORIES = ["Fiction", "Science", "Technology", "History", "Other"];

const SPINE_EMOJIS = {
  Fiction: "📕", Science: "🔬", Technology: "💻", History: "📜", Other: "📗"
};

const CAT_BADGE = {
  Fiction: "badge-info", Science: "badge-success",
  Technology: "badge-warning", History: "badge-neutral", Other: "badge-neutral"
};

// ── Heart / Wishlist Button ───────────────────────────────────
function HeartButton({ bookId, userId }) {
  const [liked,    setLiked]    = useState(null); // null = loading
  const [bouncing, setBouncing] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!userId) return;
    api.get(`/api/favourites/check/${userId}/${bookId}`)
      .then(res => setLiked(res.data.isFavourite))
      .catch(() => setLiked(false));
  }, [bookId, userId]);

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setBouncing(true);
    setTimeout(() => setBouncing(false), 300);
    try {
      const res = await api.post("/api/favourites/toggle", { userId, bookId });
      setLiked(res.data.isFavourite);
      toast.success(
        res.data.isFavourite ? "Added to Wishlist ❤️" : "Removed from Wishlist",
        res.data.isFavourite ? "Book saved to your wishlist." : "Book removed from wishlist."
      );
    } catch {
      toast.error("Failed", "Could not update wishlist.");
    }
  };

  if (liked === null) return null; // still loading

  return (
    <button
      onClick={toggle}
      title={liked ? "Remove from wishlist" : "Add to wishlist"}
      style={{
        background: liked ? "rgba(231,76,60,0.1)" : "rgba(255,255,255,0.8)",
        border: `1.5px solid ${liked ? "rgba(231,76,60,0.3)" : "var(--border)"}`,
        borderRadius: "50%",
        width: 30, height: 30,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", fontSize: "0.9rem",
        transform: bouncing ? "scale(1.4)" : "scale(1)",
        transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), background 0.2s ease",
        flexShrink: 0,
      }}
    >
      {liked ? "❤️" : "🤍"}
    </button>
  );
}

function ViewBooks() {
  const [books,         setBooks]         = useState([]);
  const [pagination,    setPagination]    = useState({});
  const [page,          setPage]          = useState(1);
  const [search,        setSearch]        = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category,      setCategory]      = useState("All");
  const [availability,  setAvailability]  = useState("all");
  const [loading,       setLoading]       = useState(true);
  const [borrowing,     setBorrowing]     = useState(null);
  const [editId,        setEditId]        = useState(null);
  const [editForm,      setEditForm]      = useState({});
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [customCat,     setCustomCat]     = useState("");
  const [sessionCats,   setSessionCats]   = useState([]);

  const role   = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");
  const toast  = useToast();
  const debounceRef = useRef(null);
  const allCategories = [...DEFAULT_CATEGORIES, ...sessionCats];

  // ── Debounce search ───────────────────────────────────────
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 400);
  };

  // ── Fetch books ───────────────────────────────────────────
  const fetchBooks = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page, limit: 9,
      search:       debouncedSearch,
      category:     category === "All" ? "" : category,
      availability: availability === "all" ? "" : availability,
    });
    api.get(`/api/books?${params}`)
      .then(res => { setBooks(res.data.books); setPagination(res.data.pagination); })
      .catch(() => toast.error("Failed to load", "Could not fetch the catalogue."))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, category, availability]); // eslint-disable-line

  useEffect(() => { fetchBooks(); }, [fetchBooks]);
  useEffect(() => { setPage(1); }, [debouncedSearch, category, availability]);

  // ── Borrow ────────────────────────────────────────────────
  const handleBorrow = async (bookId, bookTitle) => {
    setBorrowing(bookId);
    try {
      await api.post("/api/borrow/borrow", { userId, bookId });
      toast.success("Book borrowed!", `"${bookTitle}" is due in ${BORROW_DAYS} days.`);
      fetchBooks();
    } catch (err) {
      toast.error("Cannot borrow", err.response?.data?.message || "Please try again.");
    } finally { setBorrowing(null); }
  };

  // ── Edit ──────────────────────────────────────────────────
  const openEdit = (book) => {
    setEditId(book._id);
    setEditForm({ title: book.title, author: book.author,
      isbn: book.isbn, availableCopies: book.availableCopies, category: book.category });
    setCustomCat("");
  };

  const handleAddCustomCat = () => {
    const t = customCat.trim();
    if (!t) return;
    if (!allCategories.includes(t)) setSessionCats(p => [...p, t]);
    setEditForm(p => ({ ...p, category: t }));
    setCustomCat("");
  };

  const handleEditSave = async (bookId) => {
    try {
      await api.put(`/api/books/${bookId}`, editForm);
      toast.success("Book updated!", "Changes saved.");
      setEditId(null); fetchBooks();
    } catch { toast.error("Update failed", "Could not save changes."); }
  };

  // ── Delete ────────────────────────────────────────────────
  const confirmDelete = async () => {
    try {
      await api.delete(`/api/books/${deleteTarget._id}`);
      toast.success("Book deleted", `"${deleteTarget.title}" removed.`);
      setDeleteTarget(null); fetchBooks();
    } catch { toast.error("Delete failed", "Could not delete the book."); }
  };

  return (
    <div className="page-wrapper">
      <div className="flex-between mb-16">
        <div>
          <h1 className="page-title">Book Catalogue</h1>
          <p className="page-subtitle">
            {pagination.total ?? "..."} book{pagination.total !== 1 ? "s" : ""} in the library
          </p>
        </div>
        {role === "admin" && (
          <Link to="/add" className="btn btn-primary btn-sm">➕ Add Book</Link>
        )}
      </div>

      {/* ── Search + Filter ── */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", padding: "16px 20px",
        marginBottom: 24, boxShadow: "var(--shadow-sm)",
      }}>
        <div style={{ position: "relative", marginBottom: 12 }}>
          <span style={{ position: "absolute", left: 12, top: "50%",
            transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: 14 }}>🔍</span>
          <input className="form-input" type="text"
            placeholder="Search by title, author, ISBN or category…"
            value={search} onChange={handleSearchChange}
            style={{ paddingLeft: 38 }} />
          {search && (
            <button onClick={() => { setSearch(""); setDebouncedSearch(""); }}
              style={{ position: "absolute", right: 12, top: "50%",
                transform: "translateY(-50%)", background: "none", border: "none",
                cursor: "pointer", color: "var(--text-muted)", fontSize: "1rem" }}>✕</button>
          )}
        </div>

        <div className="flex gap-12" style={{ flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="text-muted" style={{ fontSize: "0.78rem", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.04em" }}>Category</span>
            <select className="form-select" style={{ width: "auto", minWidth: 140 }}
              value={category} onChange={e => setCategory(e.target.value)}>
              <option value="All">All Categories</option>
              {allCategories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="text-muted" style={{ fontSize: "0.78rem", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.04em" }}>Availability</span>
            <div className="flex gap-8">
              {[
                { value: "all",         label: "All" },
                { value: "available",   label: "✓ Available" },
                { value: "unavailable", label: "✕ Unavailable" },
              ].map(opt => (
                <button key={opt.value}
                  className={`btn btn-sm ${availability === opt.value ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setAvailability(opt.value)}
                  style={{ fontSize: "0.78rem" }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {(debouncedSearch || category !== "All" || availability !== "all") && (
            <button className="btn btn-ghost btn-sm"
              style={{ marginLeft: "auto", color: "var(--color-danger)", fontSize: "0.78rem" }}
              onClick={() => { setSearch(""); setDebouncedSearch(""); setCategory("All"); setAvailability("all"); setPage(1); }}>
              ✕ Clear all filters
            </button>
          )}
        </div>

        {/* Active filter chips */}
        <div className="flex gap-8" style={{ marginTop: 10, flexWrap: "wrap" }}>
          {debouncedSearch && <span className="badge badge-info">🔍 "{debouncedSearch}"</span>}
          {category !== "All" && <span className="badge badge-success">📚 {category}</span>}
          {availability !== "all" && (
            <span className="badge badge-warning">
              {availability === "available" ? "✓ Available only" : "✕ Unavailable only"}
            </span>
          )}
        </div>
      </div>

      {/* ── Book Grid ── */}
      {loading ? (
        <div className="spinner-wrapper"><div className="spinner"></div><span>Loading catalogue…</span></div>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <p className="empty-state-title">No books found</p>
          <p className="empty-state-text">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <div className="books-grid">
            {books.map(book => (
              <div key={book._id} className="book-card">

                {/* Cover — clickable */}
                <Link to={`/books/${book._id}`} style={{ textDecoration: "none" }}>
                  {book.coverImage ? (
                    <img src={book.coverImage} alt={book.title}
                      style={{ width: "100%", height: 140, objectFit: "cover",
                        borderRadius: "var(--radius-sm)", cursor: "pointer" }} />
                  ) : (
                    <div className="book-card-spine" style={{ cursor: "pointer" }}>
                      {SPINE_EMOJIS[book.category] || "📘"}
                    </div>
                  )}
                </Link>

                {editId === book._id ? (
                  /* ── Inline edit form ── */
                  <div className="book-edit-form">
                    <div className="form-row">
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Title</label>
                        <input className="form-input" value={editForm.title}
                          onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Author</label>
                        <input className="form-input" value={editForm.author}
                          onChange={e => setEditForm(p => ({ ...p, author: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">ISBN</label>
                        <input className="form-input" value={editForm.isbn}
                          onChange={e => setEditForm(p => ({ ...p, isbn: e.target.value }))} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Copies</label>
                        <input className="form-input" type="number" min="0"
                          value={editForm.availableCopies}
                          onChange={e => setEditForm(p => ({ ...p, availableCopies: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Category</label>
                      <div className="category-combo">
                        <select className="form-select" value={editForm.category}
                          onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}>
                          {allCategories.map(c => <option key={c}>{c}</option>)}
                        </select>
                        <input className="form-input" placeholder="New category…"
                          value={customCat} onChange={e => setCustomCat(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleAddCustomCat()} />
                        <button className="btn btn-secondary btn-sm" type="button"
                          onClick={handleAddCustomCat}>+</button>
                      </div>
                    </div>
                    <div className="flex gap-8 mt-8">
                      <button className="btn btn-primary btn-sm"
                        style={{ flex: 1, justifyContent: "center" }}
                        onClick={() => handleEditSave(book._id)}>✓ Save</button>
                      <button className="btn btn-secondary btn-sm"
                        onClick={() => setEditId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Title row with heart */}
                    <div style={{ display: "flex", alignItems: "flex-start",
                      gap: 6, justifyContent: "space-between" }}>
                      <Link to={`/books/${book._id}`} style={{ textDecoration: "none", flex: 1 }}>
                        <p className="book-title" style={{ cursor: "pointer" }}>{book.title}</p>
                      </Link>
                      {/* Heart only for students */}
                      {role === "student" && (
                        <HeartButton bookId={book._id} userId={userId} />
                      )}
                    </div>

                    <p className="book-author">by {book.author}</p>

                    <div className="book-meta">
                      <span className={`badge ${CAT_BADGE[book.category] || "badge-neutral"}`}>
                        {book.category}
                      </span>
                      <span className={`badge ${book.availableCopies > 0 ? "badge-success" : "badge-danger"}`}>
                        {book.availableCopies > 0 ? `${book.availableCopies} available` : "Unavailable"}
                      </span>
                    </div>

                    <p className="text-muted">ISBN: {book.isbn}</p>

                    <div className="book-card-actions">
                      {role === "student" && (
                        <button className="btn btn-primary btn-sm"
                          onClick={() => handleBorrow(book._id, book.title)}
                          disabled={book.availableCopies <= 0 || borrowing === book._id}
                          style={{ flex: 1, justifyContent: "center" }}>
                          {borrowing === book._id ? "Borrowing…" : "Borrow"}
                        </button>
                      )}
                      {role === "admin" && (
                        <>
                          <Link to={`/books/${book._id}`}
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1, justifyContent: "center" }}>
                            👁 View
                          </Link>
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => openEdit(book)}>✏</button>
                          <button className="btn btn-danger btn-sm"
                            onClick={() => setDeleteTarget(book)}>🗑</button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />

          <p className="text-muted" style={{ textAlign: "center", marginTop: 8, fontSize: "0.78rem" }}>
            Showing {((page-1)*9)+1}–{Math.min(page*9, pagination.total)} of {pagination.total} books
          </p>
        </>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">🗑</div>
            <h2 className="modal-title">Delete this book?</h2>
            <p className="modal-message">
              "<strong>{deleteTarget.title}</strong>" will be permanently removed.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Yes, delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewBooks;