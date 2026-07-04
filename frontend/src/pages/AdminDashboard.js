  import { useEffect, useState } from "react";
  import api from "../api";
  import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
  } from "recharts";

  const FINE_PER_DAY = 5; // ₹5 fine per day overdue

  const PIE_COLORS = {
    Active:   "#3a9e68",
    Returned: "#2471a3",
    Overdue:  "#c0392b",
  };

  function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)", padding: "10px 14px",
        boxShadow: "var(--shadow-md)", fontSize: "0.82rem"
      }}>
        {label && <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>{label}</p>}
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || "var(--text-primary)" }}>
            {p.name}: <strong>{p.value}</strong>
          </p>
        ))}
      </div>
    );
  }

  function PieTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)", padding: "10px 14px",
        boxShadow: "var(--shadow-md)", fontSize: "0.82rem"
      }}>
        <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>{payload[0].name}</p>
        <p style={{ color: "var(--text-secondary)" }}>Count: <strong>{payload[0].value}</strong></p>
      </div>
    );
  }

  // ── CSV Export utility ────────────────────────────────────────
  function exportToCSV(records, filter) {
    const calcFine = (dueDate, returned) => {
      if (returned) return 0;
      const today = new Date();
      const due   = new Date(dueDate);
      if (today <= due) return 0;
      return Math.ceil((today - due) / (1000 * 60 * 60 * 24)) * FINE_PER_DAY;
    };

    const getStatus = (r) => {
      if (r.returned) return "Returned";
      if (new Date(r.dueDate) < new Date()) return "Overdue";
      return "Active";
    };

    const headers = [
      "Student Name",
      "Student Email",
      "Book Title",
      "Category",
      "ISBN",
      "Borrowed On",
      "Due Date",
      "Returned On",
      "Status",
      "Fine (INR)"
    ];

    const rows = records.map(r => [
      r.userId?.name  || "Unknown",
      r.userId?.email || "Unknown",
      r.bookId?.title    || "Unknown",
      r.bookId?.category || "Unknown",
      r.bookId?.isbn     || "—",
      new Date(r.borrowDate).toLocaleDateString("en-IN"),
      new Date(r.dueDate).toLocaleDateString("en-IN"),
      r.returnDate ? new Date(r.returnDate).toLocaleDateString("en-IN") : "—",
      getStatus(r),
      calcFine(r.dueDate, r.returned)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const dateStr  = new Date().toISOString().split("T")[0];
    const fileName = filter === "All"
      ? `borrow-logs-${dateStr}.csv`
      : `borrow-logs-${filter.toLowerCase()}-${dateStr}.csv`;

    link.href     = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // ── Main Component ────────────────────────────────────────────
  function AdminDashboard() {
    const [records,      setRecords]      = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [filter,       setFilter]       = useState("All");
    const [search,       setSearch]       = useState("");
    const [exporting,    setExporting]    = useState(false);

    useEffect(() => {
      api.get("/api/borrow/all")
        .then(res => setRecords(res.data))
        .catch(err => console.error("Failed to load records:", err))
        .finally(() => setLoading(false));
    }, []);

    const calcFine = (dueDate) => {
      const today = new Date();
      const due   = new Date(dueDate);
      if (today <= due) return 0;
      return Math.ceil((today - due) / (1000 * 60 * 60 * 24)) * FINE_PER_DAY;
    };

    const getStatus = (r) => {
      if (r.returned) return "Returned";
      if (new Date(r.dueDate) < new Date()) return "Overdue";
      return "Active";
    };

    // ── Chart data ───────────────────────────────────────────────
    const statusCounts = records.reduce((acc, r) => {
      const s = getStatus(r);
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    const categoryCounts = records.reduce((acc, r) => {
      const cat = r.bookId?.category || "Unknown";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    const barData = Object.entries(categoryCounts)
      .map(([category, borrows]) => ({ category, borrows }))
      .sort((a, b) => b.borrows - a.borrows);

    // ── Summary ──────────────────────────────────────────────────
    const totalFines    = records.reduce((s, r) => s + (!r.returned ? calcFine(r.dueDate) : 0), 0);
    const overdueCount  = records.filter(r => getStatus(r) === "Overdue").length;
    const activeCount   = records.filter(r => getStatus(r) === "Active").length;
    const returnedCount = records.filter(r => r.returned).length;

    // ── Filter for table ─────────────────────────────────────────
    const filteredRecords = records.filter(r => {
      const status = getStatus(r);
      const matchFilter = filter === "All" || status === filter;
      const matchSearch =
        (r.userId?.name  || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.bookId?.title || "").toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });

    // ── CSV handler ──────────────────────────────────────────────
    const handleExport = () => {
      setExporting(true);
      try {
        exportToCSV(filteredRecords, filter);
      } finally {
        setTimeout(() => setExporting(false), 1000);
      }
    };

    const statusBadge = (r) => {
      const s = getStatus(r);
      if (s === "Returned") return <span className="badge badge-success">✓ Returned</span>;
      if (s === "Overdue")  return <span className="badge badge-danger">🚨 Overdue</span>;
      return <span className="badge badge-info">📖 Active</span>;
    };

    return (
      <div className="page-wrapper">
        <h1 className="page-title">Borrow Records</h1>
        <p className="page-subtitle">Analytics and full audit log of all borrowing activity.</p>

        {/* ── Stat Cards ── */}
        <div className="stat-grid">
          <div className="stat-card stat-card--info">
            <span className="stat-icon">📋</span>
            <span className="stat-label">Total Records</span>
            <span className="stat-value">{records.length}</span>
          </div>
          <div className="stat-card stat-card--green">
            <span className="stat-icon">📖</span>
            <span className="stat-label">Active Loans</span>
            <span className="stat-value">{activeCount}</span>
          </div>
          <div className="stat-card stat-card--danger">
            <span className="stat-icon">🚨</span>
            <span className="stat-label">Overdue</span>
            <span className="stat-value stat-value--danger">{overdueCount}</span>
          </div>
          <div className="stat-card stat-card--amber">
            <span className="stat-icon">💰</span>
            <span className="stat-label">Pending Fines</span>
            <span className="stat-value" style={{ color: "var(--amber-600)" }}>
              {totalFines > 0 ? `₹${totalFines}` : "—"}
            </span>
          </div>
        </div>

        {/* ── Charts ── */}
        {!loading && records.length > 0 && (
          <>
            <p className="section-title" style={{ marginBottom: 16 }}>Analytics Overview</p>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              gap: 20, marginBottom: 32
            }}>
              {/* Bar — Borrows by Category */}
              <div className="card" style={{ padding: "20px 16px" }}>
                <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", marginBottom: 4 }}>
                  Borrows by Category
                </p>
                <p className="text-muted" style={{ fontSize: "0.78rem", marginBottom: 16 }}>
                  Total borrow count per book category
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="category"
                      tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                      axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                      axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-2)" }} />
                    <Bar dataKey="borrows" name="Borrows"
                      fill="var(--green-400)" radius={[6, 6, 0, 0]} maxBarSize={52} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie — Status Breakdown */}
              <div className="card" style={{ padding: "20px 16px" }}>
                <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", marginBottom: 4 }}>
                  Status Breakdown
                </p>
                <p className="text-muted" style={{ fontSize: "0.78rem", marginBottom: 16 }}>
                  Active, returned and overdue distribution
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData} cx="50%" cy="45%"
                      innerRadius={50} outerRadius={78}
                      paddingAngle={3} dataKey="value" strokeWidth={0}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={PIE_COLORS[entry.name] || "#aaa"} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend
                      iconType="circle" iconSize={8}
                      formatter={v => (
                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                          {v} ({statusCounts[v] || 0})
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {returnedCount} returned out of {records.length} total
                </div>
              </div>
            </div>
          </>
        )}

        <hr className="divider" />

        {/* ── Filter Bar + Export Button ── */}
        <div className="flex-between" style={{ marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div className="filter-bar" style={{ marginBottom: 0, flex: 1 }}>
            <div className="search-input-wrapper" style={{ maxWidth: 280 }}>
              <span className="search-icon">🔍</span>
              <input
                className="form-input"
                placeholder="Search by student or book…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-8">
              {["All", "Active", "Overdue", "Returned"].map(f => (
                <button
                  key={f}
                  className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* ── CSV Export Button ── */}
          <button
            className="btn btn-secondary"
            onClick={handleExport}
            disabled={exporting || filteredRecords.length === 0}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              borderColor: "var(--green-400)", color: "var(--green-600)",
              fontWeight: 600, flexShrink: 0
            }}
          >
            {exporting ? (
              <>
                <span style={{
                  width: 14, height: 14, border: "2px solid var(--green-400)",
                  borderTopColor: "transparent", borderRadius: "50%",
                  animation: "spin 0.6s linear infinite", display: "inline-block"
                }} />
                Exporting…
              </>
            ) : (
              <>
                ⬇ Export CSV
                {filter !== "All" && (
                  <span className="badge badge-success" style={{ fontSize: "0.68rem" }}>
                    {filter}
                  </span>
                )}
              </>
            )}
          </button>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className="spinner-wrapper">
            <div className="spinner"></div>
            <span>Loading records…</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-title">No records found</p>
            <p className="empty-state-text">Try changing the filter or search term.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Book</th>
                  <th>Category</th>
                  <th>Borrowed On</th>
                  <th>Due Date</th>
                  <th>Fine</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(r => {
                  const fine = !r.returned ? calcFine(r.dueDate) : 0;
                  return (
                    <tr key={r._id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                          {r.userId?.name || "Unknown"}
                        </div>
                        <div className="text-muted" style={{ fontSize: "0.78rem" }}>
                          {r.userId?.email || ""}
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{r.bookId?.title || "Unknown"}</td>
                      <td>
                        <span className="badge badge-neutral">
                          {r.bookId?.category || "—"}
                        </span>
                      </td>
                      <td className="text-muted">
                        {new Date(r.borrowDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="text-muted">
                        {new Date(r.dueDate).toLocaleDateString("en-IN")}
                      </td>
                      <td>
                        {fine > 0
                          ? <span className="badge badge-warning">₹{fine}</span>
                          : <span className="text-muted">—</span>
                        }
                      </td>
                      <td>{statusBadge(r)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Export summary line */}
        {!loading && filteredRecords.length > 0 && (
          <p className="text-muted" style={{ marginTop: 12, fontSize: "0.78rem", textAlign: "right" }}>
            Showing {filteredRecords.length} of {records.length} records
            {filter !== "All" ? ` · filtered by ${filter}` : ""}
            {" · "}
            <span
              style={{ color: "var(--green-600)", cursor: "pointer", fontWeight: 600 }}
              onClick={handleExport}
            >
              Export this view as CSV
            </span>
          </p>
        )}
      </div>
    );
  }

  export default AdminDashboard;  