import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Pagination from "../components/Pagination";

const BASE = "http://localhost:5000/api/public";

const DEFAULT_CATEGORIES = ["Fiction", "Science", "Technology", "History", "Other"];

const SPINE_EMOJIS = {
  Fiction: "📕", Science: "🔬", Technology: "💻", History: "📜", Other: "📗"
};

const CAT_BADGE = {
  Fiction: "badge-info", Science: "badge-success",
  Technology: "badge-warning", History: "badge-neutral", Other: "badge-neutral"
};

const CAT_ICONS = {
  Fiction: "📕", Science: "🔬", Technology: "💻", History: "📜", Other: "📗"
};

const CAT_COLORS = {
  Fiction:    { bg: "#eaf4fb", border: "#b3d7f0", text: "#1a5276" },
  Science:    { bg: "#edf7f0", border: "#a8d5b8", text: "#0f4025" },
  Technology: { bg: "#fef9ec", border: "#fde8aa", text: "#7a4e05" },
  History:    { bg: "#f5f7f5", border: "#d4e0d7", text: "#4a6352" },
  Other:      { bg: "#f5f7f5", border: "#d4e0d7", text: "#4a6352" },
};

function StarDisplay({ rating }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{
          fontSize: "0.85rem",
          color: s <= rating ? "#f59e0b" : "var(--border-2)",
        }}>★</span>
      ))}
    </div>
  );
}

function PublicCatalog() {
  const [books,       setBooks]       = useState([]);
  const [pagination,  setPagination]  = useState({});
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState("");
  const [debounced,   setDebounced]   = useState("");
  const [category,    setCategory]    = useState("All");
  const [loading,     setLoading]     = useState(true);
  const [stats,       setStats]       = useState(null);
  const [featured,    setFeatured]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [reviews,     setReviews]     = useState([]);
  const [activeSection, setActiveSection] = useState("catalogue");
  const debounceRef = useRef(null);

  const catalogueRef = useRef(null);

  // Initial data fetch
  useEffect(() => {
    axios.get(`${BASE}/stats`)
      .then(res => setStats(res.data))
      .catch(console.error);
    axios.get(`${BASE}/featured`)
      .then(res => setFeatured(res.data))
      .catch(console.error);
    axios.get(`${BASE}/categories`)
      .then(res => setCategories(res.data))
      .catch(console.error);
    axios.get(`${BASE}/reviews`)
      .then(res => setReviews(res.data))
      .catch(console.error);
  }, []);

  // Books fetch
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page, limit: 9,
      search:   debounced,
      category: category === "All" ? "" : category,
    });
    axios.get(`${BASE}/books?${params}`)
      .then(res => { setBooks(res.data.books); setPagination(res.data.pagination); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, debounced, category]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebounced(e.target.value), 400);
  };

  const scrollToCatalogue = () => {
    catalogueRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* ── Public Navbar ── */}
      <nav style={{
        background: "var(--nav-bg)", padding: "0 32px", height: 58,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34,
            background: "linear-gradient(135deg, var(--amber-400), var(--amber-600))",
            borderRadius: "var(--radius-sm)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, boxShadow: "0 2px 6px rgba(245,158,11,0.35)",
          }}>📚</div>
          <span style={{
            fontFamily: "var(--font-display)", fontSize: "1.1rem",
            fontWeight: 600, color: "var(--nav-text)",
          }}>CatalogX - Smart Library</span>
          <span style={{
            fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px",
            background: "rgba(245,158,11,0.2)", color: "var(--amber-200)",
            borderRadius: "20px", border: "1px solid rgba(245,158,11,0.3)",
            textTransform: "uppercase", letterSpacing: "0.06em",
          }}>Public</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link to="/login"  style={{
            color: "var(--green-200)", textDecoration: "none",
            fontSize: "0.875rem", padding: "6px 12px",
            borderRadius: "var(--radius-sm)", transition: "var(--transition)",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >Log in</Link>
          <Link to="/signup" style={{
            background: "var(--amber-400)", color: "#fff",
            textDecoration: "none", fontSize: "0.875rem",
            fontWeight: 600, padding: "7px 16px",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 2px 6px rgba(245,158,11,0.3)",
            transition: "var(--transition)",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--amber-600)"}
          onMouseLeave={e => e.currentTarget.style.background = "var(--amber-400)"}
          >Register Free</Link>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <div style={{
        background: "linear-gradient(135deg, var(--green-900) 0%, var(--green-800) 50%, var(--green-700, #1a5c36) 100%)",
        padding: "80px 32px 72px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Background decorations */}
        <div style={{
          position: "absolute", top: -80, right: -80,
          width: 400, height: 400, borderRadius: "50%",
          background: "rgba(245,158,11,0.06)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -60, left: -60,
          width: 280, height: 280, borderRadius: "50%",
          background: "rgba(255,255,255,0.03)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", right: 80, top: "50%",
          transform: "translateY(-50%)",
          fontSize: "8rem", opacity: 0.07, pointerEvents: "none",
          userSelect: "none",
        }}>📚</div>

        <div style={{ maxWidth: 680, position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 14px", marginBottom: 20,
            background: "rgba(245,158,11,0.15)",
            border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: "20px",
          }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.08em",
              color: "var(--amber-200)" }}>
              ✨  CatalogX - Smart Library System
            </span>
          </div>

          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 600, color: "#fff",
            lineHeight: 1.15, marginBottom: 16,
          }}>
            Discover Your Next<br />
            <span style={{ color: "var(--amber-200)" }}>Favourite Book</span>
          </h1>

          <p style={{
            fontSize: "1rem", color: "rgba(255,255,255,0.72)",
            lineHeight: 1.7, marginBottom: 32, maxWidth: 520,
          }}>
            Browse our full catalogue, explore categories, and read reviews from fellow students —
            all without logging in. Register free to start borrowing.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={scrollToCatalogue}
              style={{
                background: "var(--amber-400)", color: "#fff",
                border: "none", padding: "13px 28px",
                borderRadius: "var(--radius-md)", fontWeight: 700,
                fontSize: "0.95rem", cursor: "pointer",
                boxShadow: "0 4px 14px rgba(245,158,11,0.4)",
                fontFamily: "var(--font-body)",
                transition: "var(--transition)",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--amber-600)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--amber-400)"; e.currentTarget.style.transform = ""; }}
            >
              Browse Catalogue →
            </button>
            <Link to="/signup" style={{
              background: "rgba(255,255,255,0.1)",
              border: "1.5px solid rgba(255,255,255,0.25)",
              color: "#fff", padding: "13px 28px",
              borderRadius: "var(--radius-md)", fontWeight: 600,
              fontSize: "0.95rem", textDecoration: "none",
              transition: "var(--transition)",
              display: "inline-flex", alignItems: "center",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            >
              Join for Free
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats Banner ── */}
      {stats && (
        <div style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          padding: "0 32px",
        }}>
          <div style={{
            maxWidth: 1100, margin: "0 auto",
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          }}>
            {[
              { label: "Books in Catalogue", value: stats.totalBooks,   icon: "📚" },
              { label: "Available Now",       value: stats.available,    icon: "✅" },
              { label: "Registered Members",  value: stats.totalMembers, icon: "👥" },
              { label: "Total Borrows",       value: stats.totalBorrows, icon: "📖" },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{
                padding: "24px 20px", textAlign: "center",
                borderRight: "1px solid var(--border)",
              }}>
                <p style={{ fontSize: "1.5rem", marginBottom: 4 }}>{icon}</p>
                <p style={{
                  fontSize: "1.8rem", fontWeight: 700,
                  color: "var(--text-primary)", lineHeight: 1, marginBottom: 4,
                }}>
                  {value?.toLocaleString()}
                </p>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)",
                  fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 32px 64px" }}>

        {/* ── Featured Books ── */}
        {featured.length > 0 && (
          <section style={{ marginBottom: 56 }}>
            <div style={{ display: "flex", alignItems: "baseline",
              justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.08em",
                    color: "var(--amber-600)" }}>◆ Featured</span>
                </div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem",
                  fontWeight: 600, color: "var(--text-primary)" }}>
                  Most Popular Right Now
                </h2>
              </div>
              <button onClick={scrollToCatalogue}
                style={{ background: "none", border: "none", cursor: "pointer",
                  color: "var(--green-600)", fontWeight: 600, fontSize: "0.875rem",
                  fontFamily: "var(--font-body)", padding: "6px 12px",
                  borderRadius: "var(--radius-sm)", transition: "var(--transition)",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--green-50)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                View all →
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px,1fr))", gap: 16 }}>
              {featured.map((book, i) => (
                <div key={book._id} style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)", overflow: "hidden",
                  boxShadow: "var(--shadow-sm)", transition: "var(--transition)",
                  position: "relative",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.borderColor = "var(--green-400)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  {i === 0 && (
                    <div style={{
                      position: "absolute", top: 12, left: 12, zIndex: 1,
                      background: "var(--amber-400)", color: "#fff",
                      fontSize: "0.68rem", fontWeight: 700, padding: "3px 9px",
                      borderRadius: "20px",
                    }}>🔥 #1 Popular</div>
                  )}

                  {book.coverImage ? (
                    <img src={book.coverImage} alt={book.title}
                      style={{ width: "100%", height: 160, objectFit: "cover" }} />
                  ) : (
                    <div style={{
                      height: 120,
                      background: `linear-gradient(135deg, ${CAT_COLORS[book.category]?.bg || "#f5f7f5"}, var(--surface))`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "3rem",
                    }}>
                      {SPINE_EMOJIS[book.category] || "📘"}
                    </div>
                  )}

                  <div style={{ padding: "14px 16px 16px" }}>
                    <p style={{ fontWeight: 700, fontSize: "0.9rem",
                      color: "var(--text-primary)", marginBottom: 3,
                      lineHeight: 1.3,
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {book.title}
                    </p>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)",
                      marginBottom: 10 }}>by {book.author}</p>
                    <div style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "center" }}>
                      <span className={`badge ${CAT_BADGE[book.category] || "badge-neutral"}`}
                        style={{ fontSize: "0.68rem" }}>
                        {book.category}
                      </span>
                      <span className={`badge ${book.availableCopies > 0 ? "badge-success" : "badge-danger"}`}
                        style={{ fontSize: "0.68rem" }}>
                        {book.availableCopies > 0 ? `${book.availableCopies} free` : "Unavailable"}
                      </span>
                    </div>
                    {book.totalBorrows > 0 && (
                      <p style={{ fontSize: "0.72rem", color: "var(--text-muted)",
                        marginTop: 8 }}>
                        📈 Borrowed {book.totalBorrows} times
                      </p>
                    )}
                    <Link to="/login" style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginTop: 12, padding: "8px",
                      background: "var(--green-600)", color: "#fff",
                      borderRadius: "var(--radius-sm)", textDecoration: "none",
                      fontSize: "0.8rem", fontWeight: 600,
                      transition: "var(--transition)",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--green-800)"}
                    onMouseLeave={e => e.currentTarget.style.background = "var(--green-600)"}
                    >
                      Log in to Borrow
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Categories ── */}
        {categories.length > 0 && (
          <section style={{ marginBottom: 56 }}>
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.08em",
                color: "var(--green-600)", display: "block", marginBottom: 4 }}>
                ◆ Browse by Category
              </span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem",
                fontWeight: 600, color: "var(--text-primary)" }}>
                What Are You Looking For?
              </h2>
            </div>

            <div style={{ display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 12 }}>
              {categories.map(cat => {
                const colors = CAT_COLORS[cat._id] || CAT_COLORS.Other;
                return (
                  <button key={cat._id}
                    onClick={() => {
                      setCategory(cat._id);
                      scrollToCatalogue();
                    }}
                    style={{
                      background: category === cat._id ? "var(--green-600)" : colors.bg,
                      border: `1.5px solid ${category === cat._id ? "var(--green-600)" : colors.border}`,
                      borderRadius: "var(--radius-lg)",
                      padding: "18px 16px", cursor: "pointer",
                      textAlign: "left", transition: "var(--transition)",
                      fontFamily: "var(--font-body)",
                    }}
                    onMouseEnter={e => { if (category !== cat._id) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}}
                    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
                  >
                    <p style={{ fontSize: "1.6rem", marginBottom: 8 }}>
                      {CAT_ICONS[cat._id] || "📚"}
                    </p>
                    <p style={{ fontWeight: 700, fontSize: "0.875rem",
                      color: category === cat._id ? "#fff" : colors.text,
                      marginBottom: 3 }}>
                      {cat._id}
                    </p>
                    <p style={{ fontSize: "0.75rem",
                      color: category === cat._id ? "rgba(255,255,255,0.75)" : "var(--text-muted)" }}>
                      {cat.count} book{cat.count !== 1 ? "s" : ""}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Full Catalogue ── */}
        <section ref={catalogueRef} style={{ marginBottom: 56 }}>
          <div style={{ marginBottom: 20 }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.08em",
              color: "var(--green-600)", display: "block", marginBottom: 4 }}>
              ◆ Full Catalogue
            </span>
            <div style={{ display: "flex", alignItems: "baseline",
              justifyContent: "space-between" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem",
                fontWeight: 600, color: "var(--text-primary)" }}>
                All Books
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                {pagination.total ?? "..."} books
              </p>
            </div>
          </div>

          {/* Search + filter */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)", padding: "16px 20px",
            marginBottom: 20, boxShadow: "var(--shadow-sm)",
          }}>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <span style={{
                position: "absolute", left: 12, top: "50%",
                transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: 14,
              }}>🔍</span>
              <input
                style={{
                  width: "100%", padding: "10px 14px 10px 38px",
                  background: "var(--surface)", border: "1.5px solid var(--border)",
                  borderRadius: "var(--radius-md)", fontSize: "0.9rem",
                  color: "var(--text-primary)", fontFamily: "var(--font-body)",
                  outline: "none", transition: "var(--transition)",
                }}
                type="text"
                placeholder="Search by title, author or category…"
                value={search}
                onChange={handleSearch}
                onFocus={e => { e.target.style.borderColor = "var(--green-400)"; e.target.style.boxShadow = "0 0 0 3px rgba(58,158,104,0.1)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
              />
              {search && (
                <button onClick={() => { setSearch(""); setDebounced(""); }}
                  style={{ position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)", background: "none", border: "none",
                    cursor: "pointer", color: "var(--text-muted)", fontSize: "1rem" }}>
                  ✕
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["All", ...DEFAULT_CATEGORIES].map(c => (
                <button key={c}
                  onClick={() => { setCategory(c); setPage(1); }}
                  style={{
                    padding: "5px 13px",
                    background: category === c ? "var(--green-600)" : "var(--surface-2)",
                    border: `1.5px solid ${category === c ? "var(--green-600)" : "var(--border)"}`,
                    borderRadius: "20px", cursor: "pointer",
                    fontSize: "0.8rem", fontWeight: 600,
                    color: category === c ? "#fff" : "var(--text-secondary)",
                    fontFamily: "var(--font-body)", transition: "var(--transition)",
                  }}
                >
                  {c}
                </button>
              ))}
              {category !== "All" && (
                <button onClick={() => { setCategory("All"); setPage(1); }}
                  style={{ padding: "5px 13px", background: "none",
                    border: "1.5px solid transparent", cursor: "pointer",
                    fontSize: "0.8rem", color: "var(--color-danger)",
                    fontWeight: 600, fontFamily: "var(--font-body)" }}>
                  ✕ Clear
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", padding: 48,
              gap: 14, color: "var(--text-muted)", fontSize: "0.875rem" }}>
              <div style={{ width: 28, height: 28, border: "3px solid var(--border)",
                borderTopColor: "var(--green-400)", borderRadius: "50%",
                animation: "spin 0.7s linear infinite" }} />
              Loading catalogue…
            </div>
          ) : books.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
              <p style={{ fontSize: "2.5rem", marginBottom: 12, opacity: 0.4 }}>📭</p>
              <p style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>No books found</p>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                Try adjusting your search or filter.
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(235px,1fr))", gap: 14 }}>
                {books.map(book => (
                  <div key={book._id} style={{
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)", padding: "16px",
                    display: "flex", flexDirection: "column", gap: 8,
                    transition: "var(--transition)", boxShadow: "var(--shadow-sm)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--green-400)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.transform = ""; }}
                  >
                    {book.coverImage ? (
                      <img src={book.coverImage} alt={book.title}
                        style={{ width: "100%", height: 130, objectFit: "cover",
                          borderRadius: "var(--radius-sm)" }} />
                    ) : (
                      <div style={{
                        width: 44, height: 56, borderRadius: "var(--radius-sm)",
                        background: `linear-gradient(135deg, ${CAT_COLORS[book.category]?.bg || "var(--green-50)"}, var(--surface))`,
                        border: `1px solid ${CAT_COLORS[book.category]?.border || "var(--green-100)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "22px",
                      }}>
                        {SPINE_EMOJIS[book.category] || "📘"}
                      </div>
                    )}
                    <p style={{ fontWeight: 700, fontSize: "0.9rem",
                      color: "var(--text-primary)", lineHeight: 1.3 }}>
                      {book.title}
                    </p>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      by {book.author}
                    </p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span className={`badge ${CAT_BADGE[book.category] || "badge-neutral"}`}
                        style={{ fontSize: "0.68rem" }}>
                        {book.category}
                      </span>
                      <span className={`badge ${book.availableCopies > 0 ? "badge-success" : "badge-danger"}`}
                        style={{ fontSize: "0.68rem" }}>
                        {book.availableCopies > 0 ? `${book.availableCopies} available` : "Unavailable"}
                      </span>
                    </div>
                    {book.totalBorrows > 0 && (
                      <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        📈 {book.totalBorrows} borrow{book.totalBorrows !== 1 ? "s" : ""}
                      </p>
                    )}
                    <Link to="/login" style={{
                      marginTop: "auto", padding: "8px",
                      background: book.availableCopies > 0 ? "var(--green-600)" : "var(--surface-2)",
                      color: book.availableCopies > 0 ? "#fff" : "var(--text-muted)",
                      border: `1px solid ${book.availableCopies > 0 ? "var(--green-600)" : "var(--border)"}`,
                      borderRadius: "var(--radius-sm)", textDecoration: "none",
                      fontSize: "0.8rem", fontWeight: 600,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "var(--transition)",
                    }}
                    onMouseEnter={e => { if (book.availableCopies > 0) e.currentTarget.style.background = "var(--green-800)"; }}
                    onMouseLeave={e => { if (book.availableCopies > 0) e.currentTarget.style.background = "var(--green-600)"; }}
                    >
                      {book.availableCopies > 0 ? "Log in to Borrow" : "Join Waitlist"}
                    </Link>
                  </div>
                ))}
              </div>
              <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
            </>
          )}
        </section>

        {/* ── Recent Reviews ── */}
        {reviews.length > 0 && (
          <section style={{ marginBottom: 56 }}>
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.08em",
                color: "var(--green-600)", display: "block", marginBottom: 4 }}>
                ◆ Community Reviews
              </span>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem",
                fontWeight: 600, color: "var(--text-primary)" }}>
                What Readers Are Saying
              </h2>
            </div>

            <div style={{ display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr))", gap: 14 }}>
              {reviews.map(review => (
                <div key={review._id} style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)", padding: "18px 20px",
                  boxShadow: "var(--shadow-sm)",
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <div style={{ display: "flex", alignItems: "center",
                    justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--green-600), var(--green-400))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.75rem", fontWeight: 700, color: "#fff", flexShrink: 0,
                      }}>
                        {review.userId?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2) || "?"}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: "0.875rem",
                          color: "var(--text-primary)" }}>
                          {review.userId?.name || "Anonymous"}
                        </p>
                        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          {new Date(review.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric"
                          })}
                        </p>
                      </div>
                    </div>
                    <StarDisplay rating={review.rating} />
                  </div>

                  {review.comment && (
                    <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)",
                      lineHeight: 1.65, fontStyle: "italic" }}>
                      "{review.comment}"
                    </p>
                  )}

                  <div style={{ paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      📖 <span style={{ color: "var(--green-600)", fontWeight: 600 }}>
                        {review.bookId?.title || "Unknown Book"}
                      </span>
                      {review.bookId?.author && ` by ${review.bookId.author}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── CTA Banner ── */}
        <section>
          <div style={{
            background: "linear-gradient(125deg, var(--green-800), var(--green-600))",
            borderRadius: "var(--radius-xl)", padding: "48px 40px",
            textAlign: "center", position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -40, right: -40,
              width: 200, height: 200, borderRadius: "50%",
              background: "rgba(245,158,11,0.1)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -30, left: -30,
              width: 150, height: 150, borderRadius: "50%",
              background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

            <p style={{ fontSize: "2rem", marginBottom: 12 }}>🎓</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem",
              fontWeight: 600, color: "#fff", marginBottom: 10, position: "relative" }}>
              Ready to Start Reading?
            </h2>
            <p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.72)",
              marginBottom: 28, maxWidth: 440, margin: "0 auto 28px",
              lineHeight: 1.6, position: "relative" }}>
              Create a free account to borrow books, track due dates,
              get AI-powered recommendations, and more.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center",
              flexWrap: "wrap", position: "relative" }}>
              <Link to="/signup" style={{
                background: "var(--amber-400)", color: "#fff",
                padding: "13px 32px", borderRadius: "var(--radius-md)",
                fontWeight: 700, fontSize: "0.95rem", textDecoration: "none",
                boxShadow: "0 4px 14px rgba(245,158,11,0.4)",
                transition: "var(--transition)",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--amber-600)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "var(--amber-400)"; e.currentTarget.style.transform = ""; }}
              >
                Register Free →
              </Link>
              <Link to="/login" style={{
                background: "rgba(255,255,255,0.12)",
                border: "1.5px solid rgba(255,255,255,0.25)",
                color: "#fff", padding: "13px 28px",
                borderRadius: "var(--radius-md)", fontWeight: 600,
                fontSize: "0.95rem", textDecoration: "none",
                transition: "var(--transition)",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
              >
                Log in
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* ── Public Footer ── */}
      <div style={{
        background: "var(--surface)", borderTop: "1px solid var(--border)",
        padding: "20px 32px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8,
            fontSize: "0.82rem", color: "var(--text-muted)" }}>
            <div style={{ width: 22, height: 22, background: "var(--green-600)",
              borderRadius: 4, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 11 }}>📚</div>
            © {new Date().getFullYear()} CatalogX. All rights reserved.
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {[
              { label: "Browse", action: scrollToCatalogue },
            ].map(({ label, action }) => (
              <button key={label} onClick={action}
                style={{ background: "none", border: "none", cursor: "pointer",
                  fontSize: "0.8rem", color: "var(--text-muted)",
                  fontFamily: "var(--font-body)", transition: "var(--transition)" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--green-600)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
              >{label}</button>
            ))}
            <Link to="/login" style={{ fontSize: "0.8rem", color: "var(--text-muted)",
              textDecoration: "none", transition: "var(--transition)" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--green-600)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
            >Log in</Link>
            <Link to="/signup" style={{ fontSize: "0.8rem", color: "var(--text-muted)",
              textDecoration: "none", transition: "var(--transition)" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--green-600)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
            >Register</Link>
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            Built with MERN Stack · React · Node · MongoDB
          </p>
        </div>
      </div>
    </div>
  );
}

export default PublicCatalog;