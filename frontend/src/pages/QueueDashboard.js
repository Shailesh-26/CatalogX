import { useEffect, useState } from "react";
import api from "../api";
import PageHeader from "../components/PageHeader";

function QueueDashboard() {
  const [queues,  setQueues]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null); // bookId of expanded row

  useEffect(() => {
    fetchQueues();
  }, []);

  const fetchQueues = async () => {
    try {
      // Get all active requests grouped by book
      const res = await api.get("/api/requests/all-queues");
      setQueues(res.data);
    } catch (err) {
      console.error("Failed to load queues:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalWaiting = queues.reduce((s, q) => s + q.waitingCount, 0);

  return (
    <>
      <PageHeader
        eyebrow="Admin · Reservations"
        title="Reservation Queue"
        subtitle="Students waiting for unavailable books. First in queue gets notified when a copy is returned."
        actions={
          <button className="btn btn-secondary btn-sm" onClick={fetchQueues}>
            ↻ Refresh
          </button>
        }
      />

      <div className="page-wrapper">
        {/* Summary */}
        {!loading && (
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card stat-card--amber">
              <span className="stat-icon">📋</span>
              <span className="stat-label">Books with Queues</span>
              <span className="stat-value">{queues.length}</span>
            </div>
            <div className="stat-card stat-card--info">
              <span className="stat-icon">👥</span>
              <span className="stat-label">Total Waiting</span>
              <span className="stat-value">{totalWaiting}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="spinner-wrapper"><div className="spinner"></div><span>Loading queues…</span></div>
        ) : queues.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <p className="empty-state-title">No active queues</p>
            <p className="empty-state-text">
              All books are currently available. Waitlists appear here when students queue for unavailable books.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {queues.map(queue => (
              <div key={queue.bookId} style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                boxShadow: "var(--shadow-sm)",
              }}>
                {/* Queue row header */}
                <div
                  onClick={() => setExpanded(expanded === queue.bookId ? null : queue.bookId)}
                  style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "16px 20px", cursor: "pointer",
                    transition: "var(--transition)",
                    background: expanded === queue.bookId ? "var(--surface-2)" : "var(--surface)",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                  onMouseLeave={e => e.currentTarget.style.background = expanded === queue.bookId ? "var(--surface-2)" : "var(--surface)"}
                >
                  {/* Book info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: "0.95rem",
                      color: "var(--text-primary)", marginBottom: 2 }}>
                      {queue.bookTitle}
                    </p>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                      by {queue.bookAuthor}
                    </p>
                  </div>

                  {/* Waiting count */}
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "5px 14px",
                      background: queue.waitingCount >= 5 ? "var(--color-danger-bg)" :
                        queue.waitingCount >= 3 ? "var(--color-warning-bg)" : "var(--color-info-bg)",
                      border: `1px solid ${queue.waitingCount >= 5 ? "#f5c6c3" :
                        queue.waitingCount >= 3 ? "#fde8aa" : "#b3d7f0"}`,
                      borderRadius: "20px",
                    }}>
                      <span style={{ fontSize: "1rem" }}>👥</span>
                      <span style={{
                        fontWeight: 700, fontSize: "0.875rem",
                        color: queue.waitingCount >= 5 ? "var(--color-danger-text)" :
                          queue.waitingCount >= 3 ? "var(--color-warning-text)" : "var(--color-info-text)",
                      }}>
                        {queue.waitingCount} waiting
                      </span>
                    </div>
                  </div>

                  {/* Expand chevron */}
                  <span style={{
                    color: "var(--text-muted)", fontSize: "0.8rem",
                    transform: expanded === queue.bookId ? "rotate(180deg)" : "rotate(0)",
                    transition: "transform 0.2s ease", flexShrink: 0,
                  }}>▼</span>
                </div>

                {/* Expanded student list */}
                {expanded === queue.bookId && (
                  <div style={{
                    borderTop: "1px solid var(--border)",
                    background: "var(--surface-2)",
                    padding: "12px 20px",
                    animation: "slideDown 0.2s ease",
                  }}>
                    <p style={{ fontSize: "0.72rem", fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.07em",
                      color: "var(--text-muted)", marginBottom: 12 }}>
                      Queue Order
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {queue.students.map((student, i) => (
                        <div key={student._id} style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "10px 14px",
                          background: i === 0 ? "var(--color-success-bg)" : "var(--surface)",
                          border: `1px solid ${i === 0 ? "#a8d5b8" : "var(--border)"}`,
                          borderRadius: "var(--radius-md)",
                        }}>
                          {/* Position */}
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                            background: i === 0 ? "var(--green-600)" : "var(--surface-2)",
                            border: `1px solid ${i === 0 ? "var(--green-400)" : "var(--border)"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.75rem", fontWeight: 700,
                            color: i === 0 ? "#fff" : "var(--text-muted)",
                          }}>
                            {student.position}
                          </div>

                          {/* Avatar */}
                          <div style={{
                            width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                            background: "linear-gradient(135deg, var(--green-600), var(--green-400))",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.72rem", fontWeight: 700, color: "#fff",
                          }}>
                            {student.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                          </div>

                          {/* Student info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 600, fontSize: "0.875rem",
                              color: "var(--text-primary)" }}>
                              {student.name}
                              {i === 0 && (
                                <span className="badge badge-success" style={{ marginLeft: 8, fontSize: "0.65rem" }}>
                                  Next in line
                                </span>
                              )}
                            </p>
                            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {student.email}
                            </p>
                          </div>

                          {/* Status */}
                          <span className={`badge ${student.status === "notified" ? "badge-warning" : "badge-neutral"}`}>
                            {student.status === "notified" ? "📧 Notified" : "⏳ Waiting"}
                          </span>

                          {/* Joined */}
                          <span className="text-muted" style={{ fontSize: "0.72rem",
                            flexShrink: 0, whiteSpace: "nowrap" }}>
                            Joined {new Date(student.joinedAt).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default QueueDashboard;