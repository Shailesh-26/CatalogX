import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useToast } from "../context/ToastContext";
import { useCallback } from "react";
import PageHeader from "../components/PageHeader";

const SPINE_EMOJIS = {
  Fiction: "📕", Science: "🔬", Technology: "💻", History: "📜", Other: "📗"
};

const CAT_BADGE = {
  Fiction: "badge-info", Science: "badge-success",
  Technology: "badge-warning", History: "badge-neutral", Other: "badge-neutral"
};

function WishlistPage() {
  const [favourites, setFavourites] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const userId = localStorage.getItem("userId");
  const toast  = useToast();

  const fetchFavourites = useCallback(() => {
    api.get(`/api/favourites/${userId}`)
      .then(res => setFavourites(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));    
  }, [userId]);

  useEffect(() => { fetchFavourites(); }, [userId]);

  const handleRemove = async (bookId, title) => {
    try {
      await api.post("/api/favourites/toggle", { userId, bookId });
      toast.success("Removed", `"${title}" removed from wishlist.`);
      fetchFavourites();
    } catch {
      toast.error("Failed", "Could not remove from wishlist.");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Student · Wishlist"
        title="My Wishlist ❤️"
        subtitle="Books you've saved. You'll get notified when an unavailable book becomes free."
        actions={
          <Link to="/books" className="btn btn-primary btn-sm">Browse Books →</Link>
        }
      />

      <div className="page-wrapper">
        {loading ? (
          <div className="spinner-wrapper"><div className="spinner"></div></div>
        ) : favourites.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🤍</div>
            <p className="empty-state-title">Your wishlist is empty</p>
            <p className="empty-state-text">
              Tap the ❤️ on any book card to save it here.
            </p>
            <Link to="/books" className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>
              Browse Books
            </Link>
          </div>
        ) : (
          <>
            <p className="text-muted" style={{ marginBottom: 20 }}>
              {favourites.length} book{favourites.length !== 1 ? "s" : ""} saved
            </p>
            <div className="books-grid">
              {favourites.map(fav => {
                if (!fav.bookId) return null;
                const book = fav.bookId;
                return (
                  <div key={fav._id} className="book-card" style={{ position: "relative" }}>
                    {/* Remove button */}
                    <button
                      onClick={() => handleRemove(book._id, book.title)}
                      style={{
                        position: "absolute", top: 10, right: 10, zIndex: 1,
                        background: "rgba(231,76,60,0.1)",
                        border: "1.5px solid rgba(231,76,60,0.3)",
                        borderRadius: "50%", width: 30, height: 30,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", fontSize: "0.9rem", transition: "var(--transition)",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(231,76,60,0.2)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(231,76,60,0.1)"}
                      title="Remove from wishlist"
                    >
                      ❤️
                    </button>

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
                      <p className="book-title" style={{ marginTop: 6 }}>{book.title}</p>
                    </Link>

                    <p className="book-author">by {book.author}</p>

                    <div className="book-meta">
                      <span className={`badge ${CAT_BADGE[book.category] || "badge-neutral"}`}>
                        {book.category}
                      </span>
                      <span className={`badge ${book.availableCopies > 0 ? "badge-success" : "badge-danger"}`}>
                        {book.availableCopies > 0 ? `${book.availableCopies} available` : "Unavailable"}
                      </span>
                    </div>

                    {book.availableCopies === 0 && (
                      <div style={{
                        marginTop: 6, padding: "6px 10px",
                        background: "var(--color-info-bg)",
                        border: "1px solid #b3d7f0",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.75rem", color: "var(--color-info-text)",
                        fontWeight: 600,
                      }}>
                        🔔 You'll be notified when this becomes available
                      </div>
                    )}

                    <div className="book-card-actions">
                      <Link to={`/books/${book._id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, justifyContent: "center" }}>
                        View Book
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default WishlistPage;