import { useEffect, useState, useCallback } from "react";
import api from "../api";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";

const GREEN = "#3a9e68";
const AMBER = "#f59e0b";
const BLUE  = "#2471a3";
const MUTED = "#7a9485";
const PIE_COLORS = [GREEN, BLUE, AMBER, "#c0392b", "#8e44ad", "#16a085"];

function ChartCard({ title, subtitle, controls, children, minHeight = 220 }) {
  return (
    <div className="card" style={{ padding: "20px" }}>
      <div className="flex-between" style={{ marginBottom: 4 }}>
        <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)" }}>{title}</p>
        {controls}
      </div>
      {subtitle && <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", marginBottom: 16 }}>{subtitle}</p>}
      <div style={{ minHeight }}>{children}</div>
    </div>
  );
}

function MonthToggle({ value, onChange }) {
  return (
    <div className="flex gap-6">
      {[3, 6, 12].map(m => (
        <button key={m}
          className={`btn btn-sm ${value === m ? "btn-primary" : "btn-secondary"}`}
          onClick={() => onChange(m)}
          style={{ padding: "3px 10px", fontSize: "0.73rem" }}>
          {m}M
        </button>
      ))}
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-md)", padding: "10px 14px",
      boxShadow: "var(--shadow-md)", fontSize: "0.82rem" }}>
      {label && <p style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || "var(--text-primary)", marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-md)", padding: "10px 14px",
      boxShadow: "var(--shadow-md)", fontSize: "0.82rem" }}>
      <p style={{ fontWeight: 700, color: "var(--text-primary)" }}>{payload[0].name}</p>
      <p style={{ color: "var(--text-secondary)" }}>{payload[0].value} ({payload[0].payload.percent}%)</p>
    </div>
  );
}

const tickStyle = { fontSize: 11, fill: MUTED };
const gridStyle = { stroke: "var(--border)", strokeDasharray: "3 3" };

// ── Inventory Alert Widget ─────────────────────────────────────
function InventoryAlerts() {
  const [alerts,  setAlerts]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/analytics/inventory-alerts")
      .then(res => setAlerts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  const total = (alerts?.outOfStock?.length || 0) + (alerts?.lowStock?.length || 0);
  if (total === 0) return null;

  return (
    <div style={{
      background: "var(--color-warning-bg)",
      border: "1.5px solid var(--amber-200)",
      borderLeft: "4px solid var(--amber-400)",
      borderRadius: "var(--radius-lg)",
      padding: "16px 20px",
      marginBottom: 24,
    }}>
      <div className="flex gap-8" style={{ alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: "1.1rem" }}>⚠</span>
        <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--amber-800)" }}>
          Inventory Alerts ({total})
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {alerts.outOfStock?.map(book => (
          <Link key={book._id} to={`/books/${book._id}`}
            style={{ textDecoration: "none" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px",
              background: "var(--color-danger-bg)",
              border: "1px solid #f5c6c3",
              borderRadius: "var(--radius-md)",
              transition: "var(--transition)",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <span style={{ fontSize: "0.9rem" }}>🚫</span>
              <p style={{ flex: 1, fontSize: "0.85rem", fontWeight: 600,
                color: "var(--color-danger-text)" }}>
                {book.title}
              </p>
              <span className="badge badge-danger">Out of Stock</span>
            </div>
          </Link>
        ))}

        {alerts.lowStock?.map(book => (
          <Link key={book._id} to={`/books/${book._id}`}
            style={{ textDecoration: "none" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 12px",
              background: "rgba(255,255,255,0.5)",
              border: "1px solid var(--amber-200)",
              borderRadius: "var(--radius-md)",
              transition: "var(--transition)",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <span style={{ fontSize: "0.9rem" }}>⚠</span>
              <p style={{ flex: 1, fontSize: "0.85rem", fontWeight: 600,
                color: "var(--amber-800)" }}>
                {book.title}
              </p>
              <span className="badge badge-warning">
                {book.availableCopies} cop{book.availableCopies === 1 ? "y" : "ies"} left
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Book Statistics Section ────────────────────────────────────
function BookStatistics() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    api.get("/api/analytics/book-stats")
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-wrapper"><div className="spinner"></div></div>;
  if (!stats)  return null;

  const displayed = showAll ? stats.neverBorrowed : stats.neverBorrowed.slice(0, 5);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Top borrowed */}
        <div className="card" style={{ padding: "20px" }}>
          <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)", marginBottom: 4 }}>
            🏆 Top Performing Books
          </p>
          <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", marginBottom: 16 }}>
            Most borrowed books in your catalogue
          </p>
          {stats.topBorrowed.length === 0 ? (
            <p className="text-muted" style={{ fontSize: "0.875rem" }}>No borrows yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {stats.topBorrowed.map((book, i) => (
                <Link key={book._id} to={`/books/${book._id}`}
                  style={{ textDecoration: "none" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 10px",
                    background: "var(--surface-2)",
                    borderRadius: "var(--radius-md)",
                    transition: "var(--transition)",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--green-50)"}
                  onMouseLeave={e => e.currentTarget.style.background = "var(--surface-2)"}
                  >
                    <span style={{ fontSize: "0.75rem", fontWeight: 700,
                      color: "var(--text-muted)", minWidth: 20 }}>#{i + 1}</span>
                    <p style={{ flex: 1, fontSize: "0.85rem", fontWeight: 600,
                      color: "var(--text-primary)", whiteSpace: "nowrap",
                      overflow: "hidden", textOverflow: "ellipsis" }}>
                      {book.title}
                    </p>
                    <span className="badge badge-success">{book.totalBorrows} borrows</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Never borrowed */}
        <div className="card" style={{ padding: "20px" }}>
          <div className="flex-between" style={{ marginBottom: 4 }}>
            <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)" }}>
              📦 Dead Stock
            </p>
            <span className="badge badge-neutral">{stats.neverBorrowed.length} books</span>
          </div>
          <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", marginBottom: 16 }}>
            Books that have never been borrowed
          </p>
          {stats.neverBorrowed.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <p style={{ fontSize: "1.5rem", marginBottom: 6 }}>🎉</p>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Every book has been borrowed at least once!
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {displayed.map(book => (
                  <Link key={book._id} to={`/books/${book._id}`}
                    style={{ textDecoration: "none" }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "7px 10px", background: "var(--surface-2)",
                      borderRadius: "var(--radius-md)", transition: "var(--transition)",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--color-warning-bg)"}
                    onMouseLeave={e => e.currentTarget.style.background = "var(--surface-2)"}
                    >
                      <span style={{ fontSize: "0.85rem" }}>📚</span>
                      <p style={{ flex: 1, fontSize: "0.82rem", fontWeight: 600,
                        color: "var(--text-primary)", whiteSpace: "nowrap",
                        overflow: "hidden", textOverflow: "ellipsis" }}>
                        {book.title}
                      </p>
                      <span className="badge badge-neutral">0 borrows</span>
                    </div>
                  </Link>
                ))}
              </div>
              {stats.neverBorrowed.length > 5 && (
                <button className="btn btn-ghost btn-sm"
                  style={{ marginTop: 10, width: "100%", justifyContent: "center",
                    fontSize: "0.78rem" }}
                  onClick={() => setShowAll(s => !s)}>
                  {showAll ? "Show less" : `Show ${stats.neverBorrowed.length - 5} more`}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Avg borrows info */}
      <div style={{
        padding: "12px 16px", background: "var(--surface-2)",
        border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
        fontSize: "0.85rem", color: "var(--text-secondary)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span>📊</span>
        Average borrows per book: <strong style={{ color: "var(--text-primary)" }}>
          {stats.avgBorrows}
        </strong>
        &nbsp;· Total books in catalogue: <strong style={{ color: "var(--text-primary)" }}>
          {stats.totalBooks}
        </strong>
      </div>
    </div>
  );
}

export default function AdminHome() {
  const name = localStorage.getItem("name");
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  const [stats,        setStats]       = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [monthlyData,  setMonthlyData]  = useState([]);
  const [monthRange,   setMonthRange]   = useState(6);
  const [monthLoading, setMonthLoading] = useState(true);
  const [categoryData, setCategoryData] = useState([]);
  const [selectedSlice, setSelectedSlice] = useState(null);
  const [userData,     setUserData]     = useState([]);
  const [userLimit,    setUserLimit]    = useState(5);
  const [userLoading,  setUserLoading]  = useState(true);

  useEffect(() => {
    api.get("/api/analytics/stats")
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, []);

  const fetchMonthly = useCallback(() => {
    setMonthLoading(true);
    api.get(`/api/analytics/monthly?months=${monthRange}`)
      .then(res => setMonthlyData(res.data))
      .catch(console.error)
      .finally(() => setMonthLoading(false));
  }, [monthRange]);

  useEffect(() => { fetchMonthly(); }, [fetchMonthly]);

  useEffect(() => {
    api.get("/api/borrow/all").then(res => {
      const counts = res.data.reduce((acc, r) => {
        const cat = r.bookId?.category || "Unknown";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      setCategoryData(Object.entries(counts).map(([name, value]) => ({
        name, value, percent: total > 0 ? Math.round((value / total) * 100) : 0
      })));
    }).catch(console.error);
    fetchUsers(userLimit);
  }, []); // eslint-disable-line

  const fetchUsers = (limit) => {
    setUserLoading(true);
    api.get(`/api/analytics/active-users?limit=${limit}`)
      .then(res => setUserData(res.data))
      .catch(console.error)
      .finally(() => setUserLoading(false));
  };

  const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.08) return null;
    const RADIAN = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle"
        dominantBaseline="central" fontSize={11} fontWeight={700}>
        {`${Math.round(percent * 100)}%`}
      </text>
    );
  };

  return (
    <>
      <PageHeader
        eyebrow={`Admin · ${today}`}
        title={`Welcome back, ${name} 👋`}
        subtitle="Your library analytics, inventory alerts, and quick actions."
      />

      <div className="page-wrapper">
        {/* ── Inventory Alerts — shown first if any ── */}
        <InventoryAlerts />

        {/* ── Stats ── */}
        <p className="section-title">Library Overview</p>
        {statsLoading ? (
          <div className="spinner-wrapper"><div className="spinner"></div></div>
        ) : (
          <div className="stat-grid">
            <div className="stat-card stat-card--green">
              <span className="stat-icon">📚</span>
              <span className="stat-label">Total Books</span>
              <span className="stat-value">{stats?.totalBooks ?? "—"}</span>
              <span className="stat-change">In catalogue</span>
            </div>
            <div className="stat-card stat-card--info">
              <span className="stat-icon">👥</span>
              <span className="stat-label">Registered Students</span>
              <span className="stat-value">{stats?.totalUsers ?? "—"}</span>
              <span className="stat-change">Active members</span>
            </div>
            <div className="stat-card stat-card--amber">
              <span className="stat-icon">⏳</span>
              <span className="stat-label">Currently Issued</span>
              <span className="stat-value">{stats?.activeBorrowed ?? "—"}</span>
              <span className="stat-change">Active loans</span>
            </div>
            <div className="stat-card stat-card--danger">
              <span className="stat-icon">🚨</span>
              <span className="stat-label">Overdue</span>
              <span className="stat-value stat-value--danger">{stats?.overdue ?? "—"}</span>
              <span className="stat-change">Need attention</span>
            </div>
          </div>
        )}

        <hr className="divider" />

        {/* ── Trends ── */}
        <p className="section-title">Borrowing Trends</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <ChartCard title="📈 Books Borrowed Per Month"
            subtitle="Monthly borrow volume"
            controls={<MonthToggle value={monthRange} onChange={setMonthRange} />}>
            {monthLoading ? (
              <div className="spinner-wrapper" style={{ padding: 20 }}><div className="spinner"></div></div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={monthlyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid {...gridStyle} vertical={false} />
                  <XAxis dataKey="month" tick={tickStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={tickStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="borrows" name="Borrows"
                    stroke={GREEN} strokeWidth={2.5}
                    dot={{ fill: GREEN, r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="🔄 Borrow vs Return Trend"
            subtitle="Issue and return volumes"
            controls={<MonthToggle value={monthRange} onChange={setMonthRange} />}>
            {monthLoading ? (
              <div className="spinner-wrapper" style={{ padding: 20 }}><div className="spinner"></div></div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={monthlyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradBorrow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={GREEN} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={GREEN} stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="gradReturn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={BLUE} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={BLUE} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridStyle} vertical={false} />
                  <XAxis dataKey="month" tick={tickStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={tickStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8}
                    formatter={v => <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{v}</span>} />
                  <Area type="monotone" dataKey="borrows" name="Borrows"
                    stroke={GREEN} strokeWidth={2} fill="url(#gradBorrow)" />
                  <Area type="monotone" dataKey="returns" name="Returns"
                    stroke={BLUE} strokeWidth={2} fill="url(#gradReturn)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <hr className="divider" />

        {/* ── Distribution ── */}
        <p className="section-title">Distribution</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
          <ChartCard title="📚 Category Distribution"
            subtitle={selectedSlice ? `Showing: ${selectedSlice} — click again to reset` : "Click a slice to highlight"}>
            {categoryData.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <p className="empty-state-text">No borrow data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%"
                    outerRadius={80} innerRadius={40}
                    paddingAngle={3} dataKey="value"
                    labelLine={false} label={renderPieLabel}
                    onClick={d => setSelectedSlice(selectedSlice === d.name ? null : d.name)}
                    style={{ cursor: "pointer" }} strokeWidth={0}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}
                        opacity={selectedSlice && selectedSlice !== categoryData[i].name ? 0.3 : 1} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend iconType="circle" iconSize={8}
                    formatter={(v, entry) => (
                      <span style={{ fontSize: "0.78rem",
                        color: selectedSlice === v ? "var(--text-primary)" : "var(--text-secondary)",
                        fontWeight: selectedSlice === v ? 700 : 400 }}>
                        {v} ({entry.payload.value})
                      </span>
                    )} />
                </PieChart>
              </ResponsiveContainer>
            )}
            {selectedSlice && (
              <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--green-600)",
                fontWeight: 600, cursor: "pointer", marginTop: 4 }}
                onClick={() => setSelectedSlice(null)}>
                ✕ Clear filter
              </p>
            )}
          </ChartCard>

          <ChartCard title="👥 Most Active Students"
            subtitle="Students with highest borrow count"
            controls={
              <div className="flex gap-6">
                {[5, 8, 10].map(n => (
                  <button key={n}
                    className={`btn btn-sm ${userLimit === n ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => { setUserLimit(n); fetchUsers(n); }}
                    style={{ padding: "3px 10px", fontSize: "0.73rem" }}>
                    Top {n}
                  </button>
                ))}
              </div>
            }>
            {userLoading ? (
              <div className="spinner-wrapper" style={{ padding: 20 }}><div className="spinner"></div></div>
            ) : userData.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <p className="empty-state-text">No borrow activity yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={userData} layout="vertical"
                  margin={{ top: 4, right: 20, left: 8, bottom: 0 }}>
                  <CartesianGrid {...gridStyle} horizontal={false} />
                  <XAxis type="number" tick={tickStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name"
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-2)" }} />
                  <Bar dataKey="borrows" name="Borrows"
                    fill={AMBER} radius={[0, 6, 6, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <hr className="divider" />

        {/* ── Book Statistics ── */}
        <p className="section-title">Book Statistics</p>
        <BookStatistics />

        <hr className="divider" />

        {/* ── Quick Actions ── */}
        <p className="section-title">Quick Actions</p>
        <div className="quick-actions">
          <Link to="/books"          className="quick-action-card">
            <span className="quick-action-icon">📚</span>
            <span className="quick-action-label">Browse Books</span>
            <span className="quick-action-desc">View and manage all books</span>
          </Link>
          <Link to="/add"            className="quick-action-card">
            <span className="quick-action-icon">➕</span>
            <span className="quick-action-label">Add Book</span>
            <span className="quick-action-desc">Add a new title</span>
          </Link>
          <Link to="/admin"          className="quick-action-card">
            <span className="quick-action-icon">📋</span>
            <span className="quick-action-label">Borrow Logs</span>
            <span className="quick-action-desc">Full borrow audit</span>
          </Link>
          <Link to="/admin/queues"   className="quick-action-card">
            <span className="quick-action-icon">📋</span>
            <span className="quick-action-label">Queue Dashboard</span>
            <span className="quick-action-desc">Manage reservation queues</span>
          </Link>
          <Link to="/admin/announcements" className="quick-action-card">
            <span className="quick-action-icon">📢</span>
            <span className="quick-action-label">Announcements</span>
            <span className="quick-action-desc">Broadcast to all students</span>
          </Link>
          <Link to="/popular"        className="quick-action-card">
            <span className="quick-action-icon">🔥</span>
            <span className="quick-action-label">Popular Books</span>
            <span className="quick-action-desc">Most borrowed titles</span>
          </Link>
          <Link to="/create-staff"   className="quick-action-card">
            <span className="quick-action-icon">👑</span>
            <span className="quick-action-label">Create Staff</span>
            <span className="quick-action-desc">Add admin or librarian</span>
          </Link>
        </div>
      </div>
    </>
  );
}