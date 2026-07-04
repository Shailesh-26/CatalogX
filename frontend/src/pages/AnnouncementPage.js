import { useEffect, useState } from "react";
import api from "../api";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";

const PRIORITY_STYLES = {
  low:    { badge: "badge-neutral", label: "Low",    icon: "📢" },
  normal: { badge: "badge-info",    label: "Normal",  icon: "📣" },
  high:   { badge: "badge-danger",  label: "Urgent",  icon: "🚨" },
};

function AnnouncementPage() {
  const [form, setForm] = useState({ title: "", message: "", priority: "normal" });
  const [sending,       setSending]       = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const [charCount,     setCharCount]     = useState(0);
  const toast = useToast();

  const fetchAnnouncements = () => {
    api.get("/api/announcements")
      .then(res => setAnnouncements(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    if (e.target.name === "message") setCharCount(e.target.value.length);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.warning("Missing fields", "Both title and message are required.");
      return;
    }
    setSending(true);
    try {
      const res = await api.post("/api/announcements", form);
      toast.success("Announcement sent! 📢", res.data.message);
      setForm({ title: "", message: "", priority: "normal" });
      setCharCount(0);
      fetchAnnouncements();
    } catch (err) {
      toast.error("Failed", err.response?.data?.message || "Could not send announcement.");
    } finally { setSending(false); }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/announcements/${deleteTarget._id}`);
      toast.success("Deleted", "Announcement removed.");
      setDeleteTarget(null);
      fetchAnnouncements();
    } catch {
      toast.error("Failed", "Could not delete announcement.");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin · Communication"
        title="Announcements 📢"
        subtitle="Broadcast a message to all registered students instantly via in-app notification."
      />

      <div className="page-wrapper">
        {/* ── Compose Form ── */}
        <div className="card" style={{ marginBottom: 32 }}>
          <p style={{ fontWeight: 700, fontSize: "0.9rem",
            color: "var(--text-primary)", marginBottom: 20 }}>
            📝 New Announcement
          </p>

          <form onSubmit={handleSend}>
            {/* Priority selector */}
            <div className="form-group">
              <label className="form-label">Priority</label>
              <div style={{ display: "flex", gap: 10 }}>
                {Object.entries(PRIORITY_STYLES).map(([key, val]) => (
                  <button key={key} type="button"
                    onClick={() => setForm(p => ({ ...p, priority: key }))}
                    style={{
                      padding: "7px 16px",
                      background: form.priority === key
                        ? key === "high" ? "var(--color-danger-bg)"
                          : key === "normal" ? "var(--color-info-bg)"
                          : "var(--surface-2)"
                        : "var(--surface)",
                      border: `1.5px solid ${form.priority === key
                        ? key === "high" ? "var(--color-danger)"
                          : key === "normal" ? "var(--color-info)"
                          : "var(--border-2)"
                        : "var(--border)"}`,
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer", fontFamily: "var(--font-body)",
                      fontSize: "0.82rem", fontWeight: 600,
                      color: form.priority === key
                        ? key === "high" ? "var(--color-danger-text)"
                          : key === "normal" ? "var(--color-info-text)"
                          : "var(--text-primary)"
                        : "var(--text-muted)",
                      transition: "var(--transition)",
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                    {val.icon} {val.label}
                  </button>
                ))}
              </div>
              <span className="form-hint">
                Urgent announcements appear with a red badge in student notifications.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" name="title"
                placeholder="e.g. Library closed on Monday"
                value={form.title} onChange={handleChange}
                maxLength={100} required />
              <span className="form-hint">{form.title.length}/100</span>
            </div>

            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea className="form-textarea" name="message"
                placeholder="Write your announcement here…"
                value={form.message} onChange={handleChange}
                maxLength={500} rows={4} required />
              <span className="form-hint">{charCount}/500</span>
            </div>

            {/* Preview */}
            {(form.title || form.message) && (
              <div style={{
                background: "var(--surface-2)", border: "1px solid var(--border)",
                borderLeft: `4px solid ${
                  form.priority === "high" ? "var(--color-danger)"
                  : form.priority === "normal" ? "var(--color-info)"
                  : "var(--border-2)"}`,
                borderRadius: "var(--radius-md)", padding: "14px 16px",
                marginBottom: 20, animation: "slideDown 0.2s ease",
              }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  color: "var(--text-muted)", marginBottom: 8 }}>
                  Preview — how students will see it
                </p>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.1rem" }}>
                    {PRIORITY_STYLES[form.priority]?.icon}
                  </span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "0.875rem",
                      color: "var(--text-primary)", marginBottom: 3 }}>
                      {form.title || "Title preview"}
                    </p>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)",
                      lineHeight: 1.5 }}>
                      {form.message || "Message preview…"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-12">
              <button type="button" className="btn btn-secondary"
                onClick={() => { setForm({ title: "", message: "", priority: "normal" }); setCharCount(0); }}>
                Clear
              </button>
              <button type="submit" className="btn btn-primary"
                disabled={sending || !form.title.trim() || !form.message.trim()}
                style={{ flex: 1, justifyContent: "center" }}>
                {sending ? "Sending…" : "📢 Send to All Students"}
              </button>
            </div>
          </form>
        </div>

        {/* ── Past Announcements ── */}
        <div>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <p className="section-title" style={{ margin: 0 }}>Past Announcements</p>
            <span className="badge badge-neutral">{announcements.length} total</span>
          </div>

          {loading ? (
            <div className="spinner-wrapper"><div className="spinner"></div></div>
          ) : announcements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <p className="empty-state-title">No announcements yet</p>
              <p className="empty-state-text">
                Your first announcement will appear here after sending.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {announcements.map(ann => {
                const ps = PRIORITY_STYLES[ann.priority] || PRIORITY_STYLES.normal;
                return (
                  <div key={ann._id} style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderLeft: `4px solid ${
                      ann.priority === "high" ? "var(--color-danger)"
                      : ann.priority === "normal" ? "var(--color-info)"
                      : "var(--border-2)"}`,
                    borderRadius: "var(--radius-lg)",
                    padding: "16px 20px",
                    boxShadow: "var(--shadow-sm)",
                    transition: "var(--transition)",
                  }}>
                    <div className="flex-between" style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: "1.1rem" }}>{ps.icon}</span>
                        <p style={{ fontWeight: 700, fontSize: "0.9rem",
                          color: "var(--text-primary)" }}>
                          {ann.title}
                        </p>
                        <span className={`badge ${ps.badge}`}
                          style={{ fontSize: "0.65rem" }}>
                          {ps.label}
                        </span>
                      </div>
                      <button
                        onClick={() => setDeleteTarget(ann)}
                        style={{ background: "none", border: "none",
                          cursor: "pointer", color: "var(--text-muted)",
                          fontSize: "0.85rem", padding: "4px 8px",
                          borderRadius: "var(--radius-sm)",
                          transition: "var(--transition)",
                          fontFamily: "var(--font-body)",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = "var(--color-danger-bg)";
                          e.currentTarget.style.color = "var(--color-danger)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "var(--text-muted)";
                        }}
                      >
                        🗑 Delete
                      </button>
                    </div>

                    <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)",
                      lineHeight: 1.6, marginBottom: 10 }}>
                      {ann.message}
                    </p>

                    <div style={{ display: "flex", gap: 14, fontSize: "0.75rem",
                      color: "var(--text-muted)" }}>
                      <span>👤 {ann.createdBy?.name || "Admin"}</span>
                      <span>📅 {new Date(ann.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "long", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">🗑</div>
            <h2 className="modal-title">Delete announcement?</h2>
            <p className="modal-message">
              "<strong>{deleteTarget.title}</strong>" will be permanently removed from records.
              Students who already received it will keep the notification.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AnnouncementPage;