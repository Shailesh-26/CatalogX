import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import api from "../api";
import PageHeader from "../components/PageHeader";
import { FINE_PER_DAY } from "../config";
import {
  LayoutGrid, BarChart3, Trophy, Heart, History as HistoryIcon,
  BookOpen, Clock, AlertTriangle, Flame, Calendar,
} from "lucide-react";

const SPINE_EMOJIS = {
  Fiction: "📕", Science: "🔬", Technology: "💻", History: "📜", Other: "📗"
};

const CAT_BADGE = {
  Fiction: "badge-info", Science: "badge-success",
  Technology: "badge-warning", History: "badge-neutral", Other: "badge-neutral"
};

const ACHIEVEMENT_META = {
  FIRST_BORROW:  { icon: "📚", title: "First Borrow",   color: "#2471a3" },
  BOOKWORM:      { icon: "📖", title: "Bookworm",        color: "#1a6b3c" },
  EXPLORER:      { icon: "🚀", title: "Explorer",        color: "#8e44ad" },
  REVIEWER:      { icon: "⭐", title: "Reviewer",        color: "#f59e0b" },
  SPEED_READER:  { icon: "⚡", title: "Speed Reader",    color: "#d35400" },
  LOYAL_READER:  { icon: "💚", title: "Loyal Reader",    color: "#1a6b3c" },
  NO_FINES:      { icon: "✅", title: "Perfect Record",  color: "#1a6b3c" },
};

// ── Heatmap Component ─────────────────────────────────────────
function ReadingHeatmap({ heatmap }) {
  if (!heatmap?.weeks?.length) return null;

  const getColor = (count) => {
    if (!count || count === 0) return "var(--surface-3)";
    if (count === 1) return "#c6e8d0";
    if (count === 2) return "#3a9e68";
    return "#1a6b3c";
  };

  // Use monthInfo directly from backend — already correctly ordered
  const monthInfo = heatmap.monthInfo || [];

  return (
    <div style={{ overflowX: "auto", paddingBottom: 8 }}>
      <div style={{ display: "inline-flex", gap: 0, alignItems: "flex-start",
        minWidth: "max-content" }}>

        {/* Day-of-week labels */}
        <div style={{ display: "flex", flexDirection: "column",
          paddingTop: 20, marginRight: 4, gap: 1 }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d, i) => (
            <div key={d} style={{
              height: 13, fontSize: "0.6rem",
              color: "var(--text-muted)", textAlign: "right",
              paddingRight: 4, lineHeight: "13px",
              visibility: [1,3,5].includes(i) ? "visible" : "hidden",
            }}>
              {d}
            </div>
          ))}
        </div>

        <div>
          {/* Month labels row */}
          <div style={{ display: "flex", height: 18, marginBottom: 2,
            position: "relative" }}>
            {heatmap.weeks.map((_, wi) => {
              const m = monthInfo.find(m => m.weekIndex === wi);
              return (
                <div key={wi} style={{ width: 13, position: "relative",
                  flexShrink: 0 }}>
                  {m && (
                    <span style={{
                      position: "absolute", left: 0, top: 0,
                      fontSize: "0.62rem", color: "var(--text-muted)",
                      whiteSpace: "nowrap", userSelect: "none",
                    }}>
                      {m.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grid */}
          <div style={{ display: "flex", gap: 1 }}>
            {heatmap.weeks.map((week, wi) => (
              <div key={wi} style={{ display: "flex",
                flexDirection: "column", gap: 1 }}>
                {(week.length === 7 ? week : [...week, ...Array(7 - week.length).fill(null)])
                  .map((day, di) => (
                  <div key={di}
                    title={day?.count
                      ? `${day.date}: ${day.count} borrow${day.count !== 1 ? "s" : ""}`
                      : day?.date || ""}
                    style={{
                      width: 12, height: 12,
                      background: day ? getColor(day.count) : "transparent",
                      borderRadius: 2,
                      border: day ? "1px solid rgba(0,0,0,0.12)" : "none",
                      cursor: day?.count ? "pointer" : "default",
                      transition: "transform 0.1s ease",
                    }}
                    onMouseEnter={e => {
                      if (day?.count) e.currentTarget.style.transform = "scale(1.4)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = "";
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 6,
        marginTop: 10, justifyContent: "flex-end" }}>
        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Less</span>
        {["var(--surface-3)", "#c6e8d0", "#3a9e68", "#1a6b3c"].map((c, i) => (
          <div key={i} style={{ width: 12, height: 12, background: c,
            borderRadius: 2, border: "1px solid rgba(0,0,0,0.1)" }} />
        ))}
        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>More</span>
      </div>
    </div>
  );
}

// ── Heart Button ──────────────────────────────────────────────
function HeartButton({ bookId, userId }) {
  const [liked,    setLiked]    = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [bouncing, setBouncing] = useState(false);

  useEffect(() => {
    api.get(`/api/favourites/check/${userId}/${bookId}`)
      .then(res => setLiked(res.data.isFavourite))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookId, userId]);

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setBouncing(true);
    setTimeout(() => setBouncing(false), 300);
    try {
      const res = await api.post("/api/favourites/toggle", { userId, bookId });
      setLiked(res.data.isFavourite);
    } catch {}
  };

  if (loading) return null;

  return (
    <button onClick={toggle} style={{
      background: "none", border: "none", cursor: "pointer",
      fontSize: "1.1rem", lineHeight: 1, padding: "4px",
      transform: bouncing ? "scale(1.4)" : "scale(1)",
      transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
      color: liked ? "#e74c3c" : "var(--text-muted)",
    }} title={liked ? "Remove from wishlist" : "Add to wishlist"}>
      {liked ? "❤️" : "🤍"}
    </button>
  );
}

// ── AI Recommendations Section ────────────────────────────────
function AIRecommendations({ userId }) {
  const [recs,    setRecs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [basis,   setBasis]   = useState("ai");
  const [basedOn, setBasedOn] = useState([]);

  useEffect(() => {
    api.post("/api/ai/recommendations", { userId })
      .then(res => {
        setRecs(res.data.recommendations);
        setBasis(res.data.basis);
        setBasedOn(res.data.basedOn || []);
      })
      .catch(() => {
        // Silently fall back — don't show error to user
        setRecs([]);
        setBasis("popular");
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const basisLabel = {
    ai:      "✨ AI Recommended",
    db:      "📊 Based on Your Taste",
    popular: "🔥 Trending Now",
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <p className="section-title" style={{ margin: 0 }}>{basisLabel[basis] || "Recommended"}</p>
            {(basis === "ai" || basis === "db") && (
              <span style={{
                fontSize: "0.6rem", fontWeight: 700, padding: "2px 7px",
                background: "linear-gradient(135deg, var(--green-600), var(--amber-400))",
                color: "#fff", borderRadius: "20px",
              }}>SMART</span>
            )}
          </div>
          {basedOn.length > 0 && (
            <p className="text-muted" style={{ fontSize: "0.78rem" }}>
              Based on: {basedOn.slice(0,2).map(t => `"${t}"`).join(", ")}
              {basedOn.length > 2 ? ` +${basedOn.length - 2} more` : ""}
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 0",
          color: "var(--text-muted)", fontSize: "0.875rem" }}>
          <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
          Finding books for you…
        </div>
        ) : recs.length === 0 ? (
  <div className="empty-state" style={{ padding: "24px 0" }}>
    <p className="empty-state-text">No recommendations yet — borrow a few books first!</p>
  </div>
      
      ) : (
        <div className="books-grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))" }}>
          {recs.map(book => (
            <Link key={book._id} to={`/books/${book._id}`} style={{ textDecoration: "none" }}>
              <div className="book-card" style={{ position: "relative", cursor: "pointer" }}>
                <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1 }}>
                  <HeartButton bookId={book._id} userId={userId} />
                </div>
                {book.coverImage ? (
                  <img src={book.coverImage} alt={book.title}
                    style={{ width: "100%", height: 120, objectFit: "cover",
                      borderRadius: "var(--radius-sm)" }} />
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

// ── Main Component ────────────────────────────────────────────
function StudentDashboard() {
  const name   = localStorage.getItem("name");
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  const [analytics,     setAnalytics]     = useState(null);
  const [achievements,  setAchievements]  = useState([]);
  const [history,       setHistory]       = useState([]);
  const [favourites,    setFavourites]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState("overview");
  const tabsRef = useRef(null);

  const goToTab = (tabKey) => {
    setActiveTab(tabKey);
    setTimeout(() => tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  useEffect(() => {
    Promise.all([
      api.get(`/api/student-analytics/${userId}`),
      api.get(`/api/achievements/${userId}`),
      api.get(`/api/borrow/history/${userId}`),
      api.get(`/api/favourites/${userId}`),
    ])
      .then(([analyticsRes, achievementsRes, historyRes, favsRes]) => {
        setAnalytics(analyticsRes.data);
        setAchievements(achievementsRes.data);
        setHistory(historyRes.data);
        setFavourites(favsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  function calcFine(dueDate, returnDate) {
    if (!returnDate) return 0;
    const due = new Date(dueDate);
    const ret = new Date(returnDate);
    if (ret <= due) return 0;
    return Math.ceil((ret - due) / (1000 * 60 * 60 * 24)) * FINE_PER_DAY;
  }

  const tabs = [
    { key: "overview",       label: "Overview",     Icon: LayoutGrid },
    { key: "analytics",      label: "Analytics",    Icon: BarChart3 },
    { key: "achievements",   label: "Achievements", Icon: Trophy },
    { key: "wishlist",       label: "Wishlist",     Icon: Heart },
    { key: "history",        label: "History",      Icon: HistoryIcon },
  ];

  return (
    <>
      <PageHeader
        eyebrow={`Student · ${today}`}
        title={`Welcome, ${name} 👋`}
        subtitle="Your personal reading dashboard."
        actions={
          <Link to="/books" className="btn btn-primary btn-sm">Browse Books →</Link>
        }
      />

      <div className="page-wrapper">
        {/* Hero + Streak */}
        <div className="hero-banner" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p className="hero-banner-eyebrow">CatalogX</p>
              <h1 className="hero-title">Your Reading Journey</h1>
              <p className="hero-subtitle">
                {analytics?.totalBorrowed
                  ? `You've borrowed ${analytics.totalBorrowed} book${analytics.totalBorrowed !== 1 ? "s" : ""} so far. Keep it up!`
                  : "Start borrowing books to track your reading journey."}
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

            {/* Streak badge */}
            {analytics?.streak?.current > 0 && (
              <div style={{
                background: "rgba(245,158,11,0.15)",
                border: "1.5px solid rgba(245,158,11,0.3)",
                borderRadius: "var(--radius-lg)", padding: "16px 20px",
                textAlign: "center", minWidth: 120,
              }}>
                <Flame size={32} color="#f59e0b" fill="#f59e0b"
                  style={{ marginBottom: 4, animation: "flamePulse 1.6s ease-in-out infinite" }} />
                <p style={{ fontSize: "1.6rem", fontWeight: 700, color: "#fff",
                  lineHeight: 1 }}>
                  {analytics.streak.current}
                </p>
                <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.7)",
                  fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
                  marginTop: 2 }}>
                  Day Streak
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick stat cards */}
        {!loading && analytics && (
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <button className="stat-card stat-card--green" onClick={() => goToTab("history")}
              style={{ cursor: "pointer", border: "none", textAlign: "left", width: "100%",
                fontFamily: "var(--font-body)" }}>
              <BookOpen className="stat-icon" size={22} strokeWidth={2} />
              <span className="stat-label">Total Borrowed</span>
              <span className="stat-value">{analytics.totalBorrowed}</span>
            </button>
            <button className="stat-card stat-card--info" onClick={() => navigate("/mybooks")}
              style={{ cursor: "pointer", border: "none", textAlign: "left", width: "100%",
                fontFamily: "var(--font-body)" }}>
              <Clock className="stat-icon" size={22} strokeWidth={2} />
              <span className="stat-label">Active Loans</span>
              <span className="stat-value">{analytics.currentlyBorrowed}</span>
            </button>
            <button className="stat-card stat-card--amber" onClick={() => goToTab("achievements")}
              style={{ cursor: "pointer", border: "none", textAlign: "left", width: "100%",
                fontFamily: "var(--font-body)" }}>
              <Trophy className="stat-icon" size={22} strokeWidth={2} />
              <span className="stat-label">Achievements</span>
              <span className="stat-value">{unlockedCount}/{achievements.length}</span>
            </button>
            <button className="stat-card stat-card--danger" onClick={() => goToTab("history")}
              style={{ cursor: "pointer", border: "none", textAlign: "left", width: "100%",
                fontFamily: "var(--font-body)" }}>
              <AlertTriangle className="stat-icon" size={22} strokeWidth={2} />
              <span className="stat-label">Late Returns</span>
              <span className="stat-value stat-value--danger">{analytics.lateReturns}</span>
            </button>
          </div>
        )}

        {/* Tabs */}
        <div ref={tabsRef} style={{
          display: "flex", gap: 2, marginBottom: 24,
          background: "var(--surface-2)", borderRadius: "var(--radius-lg)",
          padding: 4, flexWrap: "wrap", scrollMarginTop: 80,
        }}>
          {tabs.map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, minWidth: 80, padding: "8px 12px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: activeTab === tab.key ? "var(--surface)" : "transparent",
                border: "none", borderRadius: "var(--radius-md)",
                cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
                color: activeTab === tab.key ? "var(--text-primary)" : "var(--text-muted)",
                boxShadow: activeTab === tab.key ? "var(--shadow-sm)" : "none",
                transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)", fontFamily: "var(--font-body)",
                transform: activeTab === tab.key ? "scale(1.02)" : "scale(1)",
              }}>
              <tab.Icon size={15} strokeWidth={2.2} />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="spinner-wrapper"><div className="spinner"></div><span>Loading your dashboard…</span></div>
        ) : (
          <>
            {/* ── Overview Tab ── */}
            {activeTab === "overview" && (
              <div>
                <AIRecommendations userId={userId} />

                {/* Reading Heatmap */}
                {analytics?.heatmap && (
                  <>
                    <hr className="divider" />
                    <p className="section-title" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      <Calendar size={16} /> Reading Activity
                    </p>
                    <div className="card" style={{ overflowX: "auto" }}>
                      <ReadingHeatmap heatmap={analytics.heatmap} />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Analytics Tab ── */}
            {activeTab === "analytics" && analytics && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Stats grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {/* Reading stats card */}
                  <div className="card">
                    <p style={{ fontWeight: 700, fontSize: "0.875rem",
                      color: "var(--text-primary)", marginBottom: 16 }}>
                      📊 Reading Statistics
                    </p>
                    {[
                      { label: "Books Borrowed",     value: analytics.totalBorrowed },
                      { label: "Books Returned",     value: analytics.totalReturned },
                      { label: "Reviews Written",    value: analytics.reviewsWritten },
                      { label: "Late Returns",       value: analytics.lateReturns },
                      { label: "Total Fines Paid",   value: analytics.totalFines > 0 ? `₹${analytics.totalFines}` : "None" },
                      { label: "Avg Rating Given",   value: analytics.avgRating ? `${analytics.avgRating} ★` : "No reviews yet" },
                      { label: "Longest Streak",     value: `${analytics.streak?.longest || 0} days` },
                    ].map(({ label, value }) => (
                      <div key={label} style={{
                        display: "flex", justifyContent: "space-between",
                        padding: "9px 0", borderBottom: "1px solid var(--border)",
                        fontSize: "0.875rem",
                      }}>
                        <span style={{ color: "var(--text-muted)", fontWeight: 600,
                          fontSize: "0.78rem", textTransform: "uppercase",
                          letterSpacing: "0.04em" }}>{label}</span>
                        <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Categories card */}
                  <div className="card">
                    <p style={{ fontWeight: 700, fontSize: "0.875rem",
                      color: "var(--text-primary)", marginBottom: 16 }}>
                      📚 Categories Read
                    </p>
                    {analytics.categoriesRead.length === 0 ? (
                      <div className="empty-state" style={{ padding: "20px 0" }}>
                        <p className="empty-state-text">No categories yet</p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {analytics.categoriesRead.map(cat => {
                          const max = analytics.categoriesRead[0].count;
                          const pct = Math.round((cat.count / max) * 100);
                          return (
                            <div key={cat.name}>
                              <div style={{ display: "flex", justifyContent: "space-between",
                                fontSize: "0.82rem", marginBottom: 4 }}>
                                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                  {cat.name}
                                  {cat.name === analytics.favouriteCategory && (
                                    <span style={{ marginLeft: 6, fontSize: "0.68rem",
                                      color: "var(--amber-600)", fontWeight: 700 }}>
                                      ★ Favourite
                                    </span>
                                  )}
                                </span>
                                <span style={{ color: "var(--text-muted)" }}>
                                  {cat.count} book{cat.count !== 1 ? "s" : ""}
                                </span>
                              </div>
                              <div style={{ height: 6, background: "var(--surface-2)",
                                borderRadius: 3, overflow: "hidden" }}>
                                <div style={{
                                  height: "100%", width: `${pct}%`,
                                  background: "linear-gradient(90deg, var(--green-400), var(--amber-400))",
                                  borderRadius: 3, transition: "width 0.6s ease",
                                }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Heatmap */}
                <div className="card" style={{ overflowX: "auto" }}>
                  <p style={{ fontWeight: 700, fontSize: "0.875rem",
                    color: "var(--text-primary)", marginBottom: 16,
                    display: "flex", alignItems: "center", gap: 6 }}>
                    <Calendar size={15} /> Reading Heatmap — Last 12 Months
                  </p>
                  <ReadingHeatmap heatmap={analytics.heatmap} />
                </div>
              </div>
            )}

            {/* ── Achievements Tab ── */}
            {activeTab === "achievements" && (
              <div>
                <div style={{ display: "flex", alignItems: "center",
                  gap: 12, marginBottom: 20 }}>
                  <div style={{
                    background: "var(--amber-50)", border: "1px solid var(--amber-100)",
                    borderRadius: "var(--radius-md)", padding: "10px 16px",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <span style={{ fontSize: "1.2rem" }}>🏆</span>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "1.1rem",
                        color: "var(--amber-800)" }}>
                        {unlockedCount} / {achievements.length} Unlocked
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "var(--amber-600)" }}>
                        Keep reading to unlock more!
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 12 }}>
                  {achievements.map(ach => (
                    <div key={ach.type} style={{
                      background: ach.unlocked ? "var(--surface)" : "var(--surface-2)",
                      border: `1.5px solid ${ach.unlocked ? ACHIEVEMENT_META[ach.type]?.color + "44" || "var(--border)" : "var(--border)"}`,
                      borderRadius: "var(--radius-lg)",
                      padding: "18px 16px",
                      opacity: ach.unlocked ? 1 : 0.55,
                      transition: "var(--transition)",
                      boxShadow: ach.unlocked ? "var(--shadow-sm)" : "none",
                      position: "relative", overflow: "hidden",
                    }}>
                      {ach.unlocked && (
                        <div style={{
                          position: "absolute", top: 0, right: 0,
                          width: 0, height: 0,
                          borderLeft: "24px solid transparent",
                          borderTop: `24px solid ${ACHIEVEMENT_META[ach.type]?.color || "var(--green-400)"}`,
                        }} />
                      )}
                      <div style={{ fontSize: "2rem", marginBottom: 10 }}>
                        {ach.unlocked ? ach.icon : "🔒"}
                      </div>
                      <p style={{ fontWeight: 700, fontSize: "0.9rem",
                        color: ach.unlocked ? "var(--text-primary)" : "var(--text-muted)",
                        marginBottom: 4 }}>
                        {ach.title}
                      </p>
                      <p style={{ fontSize: "0.78rem",
                        color: ach.unlocked ? "var(--text-secondary)" : "var(--text-muted)",
                        lineHeight: 1.5 }}>
                        {ach.desc}
                      </p>
                      {ach.unlocked && ach.unlockedAt && (
                        <p style={{ fontSize: "0.7rem", color: "var(--text-muted)",
                          marginTop: 8 }}>
                          Unlocked {new Date(ach.unlockedAt).toLocaleDateString("en-IN")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Wishlist Tab ── */}
            {activeTab === "wishlist" && (
              <div>
                {favourites.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">🤍</div>
                    <p className="empty-state-title">Your wishlist is empty</p>
                    <p className="empty-state-text">
                      Tap the ❤️ on any book to save it here.
                    </p>
                    <Link to="/books" className="btn btn-primary btn-sm"
                      style={{ marginTop: 16 }}>Browse Books</Link>
                  </div>
                ) : (
                  <div className="books-grid">
                    {favourites.map(fav => {
                      if (!fav.bookId) return null;
                      const book = fav.bookId;
                      return (
                        <div key={fav._id} style={{ position: "relative" }}>
                          <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1 }}>
                            <HeartButton bookId={book._id} userId={userId} />
                          </div>
                          <Link to={`/books/${book._id}`} style={{ textDecoration: "none" }}>
                            <div className="book-card">
                              {book.coverImage ? (
                                <img src={book.coverImage} alt={book.title}
                                  style={{ width: "100%", height: 120, objectFit: "cover",
                                    borderRadius: "var(--radius-sm)" }} />
                              ) : (
                                <div className="book-card-spine">
                                  {SPINE_EMOJIS[book.category] || "📘"}
                                </div>
                              )}
                              <p className="book-title">{book.title}</p>
                              <p className="book-author">by {book.author}</p>
                              <div className="book-meta">
                                <span className={`badge ${CAT_BADGE[book.category] || "badge-neutral"}`}>
                                  {book.category}
                                </span>
                                <span className={`badge ${book.availableCopies > 0 ? "badge-success" : "badge-danger"}`}>
                                  {book.availableCopies > 0 ? `${book.availableCopies} available` : "Unavailable"}
                                </span>
                              </div>
                            </div>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── History Tab ── */}
            {activeTab === "history" && (
              <div>
                {history.length === 0 ? (
                  <div className="empty-state">
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
                          <th>Borrowed</th>
                          <th>Returned</th>
                          <th>Fine Paid</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map(r => {
                          const fine = calcFine(r.dueDate, r.returnDate);
                          return (
                            <tr key={r._id}>
                              <td>
                                <Link to={`/books/${r.bookId?._id}`}
                                  style={{ fontWeight: 600, color: "var(--green-600)",
                                    textDecoration: "none", fontSize: "0.875rem" }}>
                                  {r.bookId?.title || "—"}
                                </Link>
                              </td>
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
            )}
          </>
        )}
      </div>
    </>
  );
}

export default StudentDashboard;