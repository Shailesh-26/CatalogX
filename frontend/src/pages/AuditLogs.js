import { useEffect, useState, useCallback } from "react";
import api from "../api";
import Pagination from "../components/Pagination";

const ACTION_LABELS = {
  BORROW_BOOK:  { label: "Borrow",        badge: "badge-info",    icon: "📖" },
  RETURN_BOOK:  { label: "Return",         badge: "badge-success", icon: "↩" },
  RENEW_BOOK:   { label: "Renew",          badge: "badge-warning", icon: "🔄" },
  ADD_BOOK:     { label: "Add Book",       badge: "badge-success", icon: "➕" },
  EDIT_BOOK:    { label: "Edit Book",      badge: "badge-neutral", icon: "✏" },
  DELETE_BOOK:  { label: "Delete Book",    badge: "badge-danger",  icon: "🗑" },
  CREATE_STAFF: { label: "Create Staff",   badge: "badge-warning", icon: "👤" },
  LOGIN:        { label: "Login",          badge: "badge-neutral", icon: "🔐" },
};

const ROLE_BADGE = {
  admin:     "badge-warning",
  librarian: "badge-info",
  student:   "badge-success",
};

function AuditLogs() {
  const [logs,       setLogs]       = useState([]);
  const [pagination, setPagination] = useState({});
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [action,     setAction]     = useState("ALL");
  const [search,     setSearch]     = useState("");
  const [debounced,  setDebounced]  = useState("");
  const debounceRef = useState(null);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page, limit: 20,
      action: action === "ALL" ? "" : action,
      search: debounced,
    });
    api.get(`/api/audit?${params}`)
      .then(res => { setLogs(res.data.logs); setPagination(res.data.pagination); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, action, debounced]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
    clearTimeout(debounceRef[0]);
    debounceRef[0] = setTimeout(() => setDebounced(e.target.value), 400);
  };

  return (
    <div className="page-wrapper">
      <h1 className="page-title">Audit Logs</h1>
      <p className="page-subtitle">
        Complete record of every action taken in the system.
        {pagination.total ? ` ${pagination.total} total events.` : ""}
      </p>

      {/* Filters */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", padding: "16px 20px",
        marginBottom: 24, boxShadow: "var(--shadow-sm)"
      }}>
        <div className="flex gap-12" style={{ flexWrap: "wrap", alignItems: "center" }}>
          <div className="search-input-wrapper" style={{ maxWidth: 280, flex: 1 }}>
            <span className="search-icon">🔍</span>
            <input className="form-input" placeholder="Search by user, book, or action…"
              value={search} onChange={handleSearch} />
          </div>
          <div className="flex gap-8" style={{ flexWrap: "wrap" }}>
            {["ALL", ...Object.keys(ACTION_LABELS)].map(a => (
              <button key={a}
                className={`btn btn-sm ${action === a ? "btn-primary" : "btn-secondary"}`}
                onClick={() => { setAction(a); setPage(1); }}
                style={{ fontSize: "0.75rem" }}>
                {a === "ALL" ? "All" : ACTION_LABELS[a]?.icon + " " + ACTION_LABELS[a]?.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="spinner-wrapper"><div className="spinner"></div><span>Loading logs…</span></div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p className="empty-state-title">No logs found</p>
          <p className="empty-state-text">Actions will appear here as they happen.</p>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const meta = ACTION_LABELS[log.action] || { label: log.action, badge: "badge-neutral", icon: "•" };
                  return (
                    <tr key={log._id}>
                      <td className="text-muted" style={{ whiteSpace: "nowrap", fontSize: "0.8rem" }}>
                        <div>{new Date(log.createdAt).toLocaleDateString("en-IN")}</div>
                        <div style={{ fontSize: "0.75rem" }}>
                          {new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{log.userName}</div>
                      </td>
                      <td>
                        <span className={`badge ${ROLE_BADGE[log.userRole] || "badge-neutral"}`}>
                          {log.userRole}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${meta.badge}`}>
                          {meta.icon} {meta.label}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)", maxWidth: 300 }}>
                        {log.details}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={pagination.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

export default AuditLogs;