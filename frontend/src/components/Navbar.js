import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import NotificationBell from "./NotificationBell";
import api from "../api";

const CATEGORY_ICONS = {
  Fiction: "📕", Science: "🔬", Technology: "💻", History: "📜", Other: "📗"
};

function Navbar() {
  const role     = localStorage.getItem("role");
  const name     = localStorage.getItem("name");
  const navigate = useNavigate();

  const [darkMode,      setDarkMode]      = useState(localStorage.getItem("theme") === "dark");
  const [toggling,      setToggling]      = useState(false);
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [showLogout,    setShowLogout]    = useState(false);
  const dropdownRef = useRef(null);

  // ── Global search ──────────────────────────────────────────
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeIndex,   setActiveIndex]   = useState(-1);
  const searchRef  = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      setActiveIndex(-1);
      return;
    }
    setSearchLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      api.get(`/api/books?search=${encodeURIComponent(searchQuery.trim())}&limit=6`)
        .then(res => {
          setSearchResults(res.data.books || []);
          setSearchOpen(true);
          setActiveIndex(-1);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const goToBook = (bookId) => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    navigate(`/books/${bookId}`);
  };

  const handleSearchKeyDown = (e) => {
    if (!searchOpen || searchResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => (i + 1) % searchResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => (i - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) goToBook(searchResults[activeIndex]._id);
    } else if (e.key === "Escape") {
      setSearchOpen(false);
    }
  };

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleThemeToggle = () => {
    setToggling(true);
    setTimeout(() => setToggling(false), 400);
    setDarkMode(prev => !prev);
  };

  const confirmLogout = () => {
    setShowLogout(false);
    localStorage.clear();
    navigate("/login");
  };

  const initials = name
    ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  // Dropdown menu items — role-aware
  const dropdownItems = [
    { icon: "👤", label: "My Profile",       to: "/profile" },
    role === "student" && { icon: "📖", label: "My Books",    to: "/mybooks" },
    role === "admin"   && { icon: "📋", label: "Borrow Logs", to: "/admin" },
    role === "admin"   && { icon: "🔍", label: "Audit Logs",  to: "/audit" },
  ].filter(Boolean);

  return (
    <>
      <nav className="navbar">
        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <div className="navbar-brand-icon">📚</div>
          Smart Library
        </Link>

        {/* Global search */}
        {role && (
          <div ref={searchRef} style={{ position: "relative", flex: "0 1 340px", margin: "0 16px" }}>
            <div style={{ position: "relative" }}>
              <span style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                fontSize: "0.85rem", color: "var(--text-muted)", pointerEvents: "none",
              }}>🔍</span>
              <input
                type="text"
                placeholder="Search books, authors…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                onKeyDown={handleSearchKeyDown}
                style={{
                  width: "100%", padding: "8px 12px 8px 34px",
                  borderRadius: "20px", border: "1px solid var(--border)",
                  background: "var(--surface)", color: "var(--text-primary)",
                  fontSize: "0.85rem", fontFamily: "var(--font-body)",
                  outline: "none",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); setSearchResults([]); setSearchOpen(false); }}
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--text-muted)", fontSize: "0.8rem", padding: 0,
                  }}
                >✕</button>
              )}
            </div>

            {/* Dropdown results */}
            {searchOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-xl)",
                zIndex: 500, overflow: "hidden", animation: "slideDown 0.15s ease",
                maxHeight: 360, overflowY: "auto",
              }}>
                {searchLoading ? (
                  <div style={{ padding: "16px", textAlign: "center", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    Searching…
                  </div>
                ) : searchResults.length === 0 ? (
                  <div style={{ padding: "16px", textAlign: "center", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    No books found for "{searchQuery}"
                  </div>
                ) : (
                  searchResults.map((b, i) => (
                    <div
                      key={b._id}
                      onClick={() => goToBook(b._id)}
                      onMouseEnter={() => setActiveIndex(i)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 14px", cursor: "pointer",
                        background: activeIndex === i ? "var(--surface-2)" : "transparent",
                        borderBottom: i < searchResults.length - 1 ? "1px solid var(--border)" : "none",
                      }}
                    >
                      <span style={{ fontSize: "1.1rem" }}>{CATEGORY_ICONS[b.category] || "📘"}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{
                          fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>{b.title}</p>
                        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>by {b.author}</p>
                      </div>
                      <span className={`badge ${b.availableCopies > 0 ? "badge-success" : "badge-danger"}`}
                        style={{ fontSize: "0.65rem", flexShrink: 0 }}>
                        {b.availableCopies > 0 ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="navbar-actions">
          {/* Theme toggle */}
          <button
            className={`btn-theme-toggle ${toggling ? "toggling" : ""}`}
            onClick={handleThemeToggle}
            title="Toggle theme"
          >
            <span className="theme-icon">{darkMode ? "☀" : "🌙"}</span>
            {darkMode ? "Light" : "Dark"}
          </button>

          {!role && (
            <>
              <Link to="/login"  className="navbar-link">Log in</Link>
              <Link to="/signup" className="btn btn-amber btn-sm">Register</Link>
            </>
          )}

          {role && (
            <>
              <NotificationBell />

              {/* User pill — clickable dropdown trigger */}
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <button
  className="navbar-user"
  onClick={() => setDropdownOpen(o => !o)}
  style={{
    background: dropdownOpen
      ? "rgba(255,255,255,0.12)"
      : undefined,
    fontFamily: "var(--font-body)"
  }}
  title="Account menu"
>
                  <div className="navbar-avatar">{initials}</div>
                  <span className="navbar-user-name">{name}</span>
                  <span className="navbar-user-badge">{role}</span>
                  {/* Chevron */}
                  <span style={{
                    fontSize: "0.65rem",
                    color: "var(--green-200)",
                    marginLeft: 2,
                    transition: "transform 0.2s ease",
                    transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                    display: "inline-block",
                  }}>▼</span>
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: 0,
                    width: 220,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    boxShadow: "var(--shadow-xl)",
                    zIndex: 500,
                    overflow: "hidden",
                    animation: "slideDown 0.18s ease",
                  }}>
                    {/* User info header */}
                    <div style={{
                      padding: "14px 16px",
                      borderBottom: "1px solid var(--border)",
                      background: "var(--surface-2)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: "linear-gradient(135deg, var(--green-600), var(--green-400))",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.8rem", fontWeight: 700, color: "#fff", flexShrink: 0,
                        }}>
                          {initials}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: "0.875rem",
                            color: "var(--text-primary)", whiteSpace: "nowrap",
                            overflow: "hidden", textOverflow: "ellipsis" }}>
                            {name}
                          </p>
                          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)",
                            textTransform: "capitalize" }}>
                            {role}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Nav items */}
                    <div style={{ padding: "6px 0" }}>
                      {dropdownItems.map(item => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setDropdownOpen(false)}
                          style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "10px 16px",
                            textDecoration: "none",
                            color: "var(--text-secondary)",
                            fontSize: "0.875rem", fontWeight: 500,
                            transition: "var(--transition)",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = "var(--surface-2)";
                            e.currentTarget.style.color = "var(--text-primary)";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "var(--text-secondary)";
                          }}
                        >
                          <span style={{ width: 20, textAlign: "center" }}>{item.icon}</span>
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    {/* Divider + Logout */}
                    <div style={{ borderTop: "1px solid var(--border)", padding: "6px 0" }}>
                      <button
                        onClick={() => { setDropdownOpen(false); setShowLogout(true); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "10px 16px", width: "100%",
                          background: "none", border: "none", cursor: "pointer",
                          color: "var(--color-danger)", fontSize: "0.875rem", fontWeight: 600,
                          transition: "var(--transition)", fontFamily: "var(--font-body)",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--color-danger-bg)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <span style={{ width: 20, textAlign: "center" }}>🚪</span>
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Logout confirmation modal */}
      {showLogout && (
        <div
          className="modal-overlay"
          onClick={() => setShowLogout(false)}
        >
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">👋</div>
            <h2 className="modal-title">Leaving so soon?</h2>
            <p className="modal-message">
              Are you sure you want to log out of Smart Library?
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowLogout(false)}>
                Stay
              </button>
              <button className="btn btn-danger" onClick={confirmLogout}>
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;