import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const TYPE_ICONS = {
  BORROW_CONFIRMED:  "📖",
  BOOK_OVERDUE:      "🚨",
  BOOK_AVAILABLE:    "✅",
  NEW_BOOK_ADDED:    "📚",
  RENEWAL_CONFIRMED: "🔄",
  RETURN_CONFIRMED:  "↩",
};

const TYPE_COLORS = {
  BORROW_CONFIRMED:  "var(--color-info)",
  BOOK_OVERDUE:      "var(--color-danger)",
  BOOK_AVAILABLE:    "var(--color-success)",
  NEW_BOOK_ADDED:    "var(--amber-400)",
  RENEWAL_CONFIRMED: "var(--color-info)",
  RETURN_CONFIRMED:  "var(--color-success)",
};

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [open,          setOpen]          = useState(false);
  const [loading,       setLoading]       = useState(false);
  const dropdownRef = useRef(null);
  // const userId      = localStorage.getItem("userId");
  const navigate    = useNavigate();

  const fetchNotifications = useCallback(() => {
    // if (!userId) return;
    api.get("/api/notifications")
      .then(res => {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      })
      .catch(() => {});
  }, []);

  // Poll every 30 seconds for new notifications
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/api/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      const wasUnread = notifications.find(n => n._id === id && !n.read);
      if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) await handleMarkRead(notif._id);
    if (notif.bookId) navigate(`/books/${notif.bookId}`);
    setOpen(false);
  };

  const timeAgo = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / 1000);
    if (diff < 60)  return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
        style={{
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "var(--radius-sm)",
          width: 36, height: 36,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", position: "relative",
          color: "var(--nav-text)", fontSize: "1rem",
          transition: "var(--transition)",
        }}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: -6, right: -6,
            background: "var(--color-danger)",
            color: "#fff", borderRadius: "50%",
            width: 18, height: 18, fontSize: "0.65rem",
            fontWeight: 700, display: "flex",
            alignItems: "center", justifyContent: "center",
            border: "2px solid var(--nav-bg)",
            animation: unreadCount > 0 ? "bellPulse 2s infinite" : "none",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0,
          width: 360, maxHeight: 480,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-xl)",
          zIndex: 500,
          animation: "slideDown 0.2s ease",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}>
          {/* Header */}
          <div style={{
            padding: "14px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                Notifications
              </p>
              {unreadCount > 0 && (
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {unreadCount} unread
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: "0.78rem", color: "var(--green-600)", fontWeight: 600,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <p style={{ fontSize: "1.8rem", marginBottom: 8 }}>🔕</p>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border)",
                    background: notif.read ? "transparent" : "var(--green-50)",
                    cursor: "pointer",
                    display: "flex", gap: 12, alignItems: "flex-start",
                    transition: "var(--transition)",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                  onMouseLeave={e => e.currentTarget.style.background = notif.read ? "transparent" : "var(--green-50)"}
                >
                  {/* Icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: `${TYPE_COLORS[notif.type]}18`,
                    border: `1px solid ${TYPE_COLORS[notif.type]}33`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1rem",
                  }}>
                    {TYPE_ICONS[notif.type] || "📌"}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontWeight: notif.read ? 500 : 700,
                      fontSize: "0.85rem",
                      color: "var(--text-primary)",
                      marginBottom: 2,
                    }}>
                      {notif.title}
                    </p>
                    <p style={{
                      fontSize: "0.78rem", color: "var(--text-secondary)",
                      lineHeight: 1.4, marginBottom: 4,
                    }}>
                      {notif.message}
                    </p>
                    <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      {timeAgo(notif.createdAt)}
                    </p>
                  </div>

                  {/* Unread dot + delete */}
                  <div style={{ display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {!notif.read && (
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: "var(--green-400)", marginTop: 4,
                      }} />
                    )}
                    <button
                      onClick={e => handleDelete(e, notif._id)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "var(--text-muted)", fontSize: "0.75rem",
                        padding: "2px 4px", borderRadius: "var(--radius-sm)",
                        lineHeight: 1,
                      }}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;