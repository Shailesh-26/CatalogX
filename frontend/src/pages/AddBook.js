import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import api from "../api";

const DEFAULT_CATEGORIES = ["Fiction", "Science", "Technology", "History", "Other"];

const CAT_BADGE = {
  Fiction: "badge-info", Science: "badge-success",
  Technology: "badge-warning", History: "badge-neutral", Other: "badge-neutral"
};

function AddBook() {
  const [book, setBook] = useState({
    title: "", author: "", isbn: "", availableCopies: "", category: ""
  });
  const [tags,        setTags]        = useState([]);
  const [tagInput,    setTagInput]    = useState("");
  const [coverFile,   setCoverFile]   = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [customCat,   setCustomCat]   = useState("");
  const [sessionCats, setSessionCats] = useState([]);
  const navigate = useNavigate();
  const toast    = useToast();

  const allCategories = [...DEFAULT_CATEGORIES, ...sessionCats];

  const handleChange = (e) => setBook(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", "Cover image must be under 5MB.");
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleAddCustomCat = () => {
    const t = customCat.trim();
    if (!t) return;
    if (!allCategories.includes(t)) setSessionCats(prev => [...prev, t]);
    setBook(prev => ({ ...prev, category: t }));
    setCustomCat("");
  };

  const handleAddTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (!t || tags.includes(t)) { setTagInput(""); return; }
    if (tags.length >= 8) { toast.error("Too many tags", "Max 8 tags per book."); return; }
    setTags(prev => [...prev, t]);
    setTagInput("");
  };

  const handleRemoveTag = (t) => setTags(prev => prev.filter(x => x !== t));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(book).forEach(([k, v]) => formData.append(k, v));
      formData.append("tags", JSON.stringify(tags));
      if (coverFile) formData.append("cover", coverFile);

      await api.post("/api/books/add", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Book added!", `"${book.title}" is now in the catalogue.`);
      setTimeout(() => navigate("/books"), 800);
    } catch (err) {
      toast.error("Failed to add", err.response?.data?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const catBadge = CAT_BADGE[book.category] || "badge-neutral";

  return (
    <div className="page-wrapper">
      <h1 className="page-title">Add New Book</h1>
      <p className="page-subtitle">Fill in the details — see a live preview on the right.</p>

      <div className="add-book-layout">
        {/* LEFT — Form */}
        <div className="card">
          <form onSubmit={handleSubmit}>
            {/* Cover upload */}
            <div className="form-group">
              <label className="form-label">Book Cover (optional)</label>
              <div style={{
                border: "2px dashed var(--border)", borderRadius: "var(--radius-md)",
                padding: "20px", textAlign: "center", cursor: "pointer",
                background: "var(--surface-2)", transition: "var(--transition)",
              }}
                onClick={() => document.getElementById("cover-upload").click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleCoverChange({ target: { files: [file] } });
                }}
              >
                {coverPreview ? (
                  <img src={coverPreview} alt="Preview"
                    style={{ width: 80, height: 100, objectFit: "cover",
                      borderRadius: "var(--radius-sm)", margin: "0 auto 8px" }} />
                ) : (
                  <div style={{ fontSize: "2rem", marginBottom: 8 }}>📷</div>
                )}
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  {coverPreview ? "Click to change image" : "Click or drag to upload cover"}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                  JPG, PNG, WebP · Max 5MB
                </p>
                <input id="cover-upload" type="file" accept="image/*"
                  style={{ display: "none" }} onChange={handleCoverChange} />
              </div>
              {coverPreview && (
                <button type="button" className="btn btn-ghost btn-sm"
                  style={{ color: "var(--color-danger)", marginTop: 8 }}
                  onClick={() => { setCoverFile(null); setCoverPreview(null); }}>
                  ✕ Remove cover
                </button>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Book Title</label>
                <input className="form-input" name="title"
                  placeholder="e.g. The Great Gatsby"
                  value={book.title} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Author</label>
                <input className="form-input" name="author"
                  placeholder="e.g. F. Scott Fitzgerald"
                  value={book.author} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">ISBN</label>
                <input className="form-input" name="isbn"
                  placeholder="e.g. 978-3-16-148410-0"
                  value={book.isbn} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Available Copies</label>
                <input className="form-input" name="availableCopies" type="number" min="1"
                  placeholder="e.g. 3"
                  value={book.availableCopies} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <div className="category-combo">
                <select className="form-select" name="category"
                  value={book.category} onChange={handleChange} required>
                  <option value="">Select a category</option>
                  {allCategories.map(c => <option key={c}>{c}</option>)}
                </select>
                <input className="form-input" placeholder="New category…"
                  value={customCat} onChange={e => setCustomCat(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddCustomCat(); }}} />
                <button className="btn btn-secondary btn-sm" type="button"
                  onClick={handleAddCustomCat}>+</button>
              </div>
              <span className="form-hint">Type a new category and press + or Enter.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Tags <span className="text-muted" style={{ fontWeight: 400 }}>(optional, max 8)</span></label>
              <div className="flex gap-8" style={{ flexWrap: "wrap", marginBottom: tags.length ? 10 : 0 }}>
                {tags.map(t => (
                  <span key={t} className="badge badge-info" style={{
                    display: "flex", alignItems: "center", gap: 6, cursor: "default",
                  }}>
                    #{t}
                    <button type="button" onClick={() => handleRemoveTag(t)}
                      style={{ background: "none", border: "none", cursor: "pointer",
                        padding: 0, color: "inherit", fontSize: "0.75rem", lineHeight: 1 }}>✕</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-8">
                <input className="form-input" placeholder="e.g. bestseller, award-winning…"
                  value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }} />
                <button className="btn btn-secondary btn-sm" type="button"
                  onClick={handleAddTag}>+</button>
              </div>
              <span className="form-hint">Press Enter or + to add a tag. Click ✕ on a tag to remove it.</span>
            </div>

            <div className="flex gap-12 mt-16">
              <button type="button" className="btn btn-secondary"
                onClick={() => navigate("/books")}>Cancel</button>
              <button type="submit" className="btn btn-primary"
                disabled={loading} style={{ flex: 1, justifyContent: "center" }}>
                {loading ? "Adding…" : "Add Book"}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT — Live preview */}
        <div>
          <p className="section-title" style={{ marginBottom: 12 }}>Live Preview</p>
          <div className="book-preview-card">
            {/* Cover preview */}
            {coverPreview ? (
              <img src={coverPreview} alt="Cover preview"
                style={{ width: "100%", height: 180, objectFit: "cover",
                  borderRadius: "var(--radius-md)", marginBottom: 16 }} />
            ) : (
              <div className="book-preview-spine">📘</div>
            )}

            <p className="book-preview-title">
              {book.title || <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                Book title will appear here
              </span>}
            </p>
            <p className="book-preview-author">
              {book.author ? `by ${book.author}` :
                <span style={{ color: "var(--text-muted)" }}>Author name</span>}
            </p>

            <div className="book-meta" style={{ marginBottom: 16 }}>
              {book.category && (
                <span className={`badge ${catBadge}`}>{book.category}</span>
              )}
              {book.availableCopies && (
                <span className="badge badge-success">
                  {book.availableCopies} {book.availableCopies === "1" ? "copy" : "copies"}
                </span>
              )}
            </div>

            {tags.length > 0 && (
              <div className="flex gap-6" style={{ flexWrap: "wrap", marginBottom: 16 }}>
                {tags.map(t => (
                  <span key={t} className="badge badge-neutral" style={{ fontSize: "0.7rem" }}>#{t}</span>
                ))}
              </div>
            )}

            <p className="book-preview-label">Details</p>
            <div className="book-preview-detail">
              <span>ISBN</span><span>{book.isbn || "—"}</span>
            </div>
            <div className="book-preview-detail">
              <span>Category</span><span>{book.category || "—"}</span>
            </div>
            <div className="book-preview-detail">
              <span>Copies</span><span>{book.availableCopies || "—"}</span>
            </div>
          </div>

          <div style={{ marginTop: 16, padding: "14px 16px",
            background: "var(--amber-50)", border: "1px solid var(--amber-100)",
            borderRadius: "var(--radius-md)", fontSize: "0.82rem",
            color: "var(--amber-800)", lineHeight: 1.6 }}>
            💡 <strong>Tip:</strong> Upload a cover image to make the book card stand out.
            Preview updates as you type.
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddBook;