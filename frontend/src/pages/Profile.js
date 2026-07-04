import { useState, useEffect } from "react";
import api from "../api";
import { useToast } from "../context/ToastContext";

// ── CSV Export utility ────────────────────────────────────────
function exportUsersToCSV(users) {
  const headers = ["Name", "Email", "Role", "Verified", "Joined"];

  const rows = users.map(u => [
    u.name || "Unknown",
    u.email || "Unknown",
    u.role || "—",
    u.isVerified ? "Yes" : "No",
    u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—",
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const dateStr = new Date().toISOString().split("T")[0];
  link.href     = url;
  link.download = `users-${dateStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function Profile() {
  const role   = localStorage.getItem("role");
  const name   = localStorage.getItem("name");
  const userId = localStorage.getItem("userId");

  const [profileData, setProfileData] = useState(null);
  const [editName, setEditName]       = useState("");
  const [savingName, setSavingName]   = useState(false);
  const [loading, setLoading]         = useState(true);
  const [allUsers, setAllUsers]       = useState([]);
  const [userSearch, setUserSearch]   = useState("");
  const [exporting, setExporting]     = useState(false);
  const toast = useToast();

  const prefKey = `prefs_${userId}`;
  const loadPrefs = () => {
    const saved = JSON.parse(localStorage.getItem(prefKey) || "{}");
    return {
      emailAlerts: saved.emailAlerts  ?? true,
      compactView: saved.compactView  ?? false,
      darkMode:    localStorage.getItem("theme") === "dark",
    };
  };
  const [prefs, setPrefs] = useState(loadPrefs);

  const initials = name
    ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  useEffect(() => {
    api.get("/api/auth/profile")
      .then(res => { setProfileData(res.data); setEditName(res.data.name); })
      .catch(() => { setProfileData({ name: name || "", email: "—" }); setEditName(name || ""); })
      .finally(() => setLoading(false));

    if (role === "admin") {
      api.get("/api/auth/users").then(res => setAllUsers(res.data)).catch(() => {});
    }
  }, []); // eslint-disable-line

  const saveName = async () => {
    if (!editName.trim() || editName === profileData?.name) return;
    setSavingName(true);
    try {
      await api.put("/api/auth/profile", { name: editName.trim() });
      localStorage.setItem("name", editName.trim());
      setProfileData(prev => ({ ...prev, name: editName.trim() }));
      toast.success("Name updated!", "Your display name has been changed.");
    } catch {
      toast.error("Update failed", "Could not update your name.");
    } finally {
      setSavingName(false);
    }
  };

  const savePrefs = () => {
    const toSave = { emailAlerts: prefs.emailAlerts, compactView: prefs.compactView };
    localStorage.setItem(prefKey, JSON.stringify(toSave));

    // Apply dark mode immediately and visibly
    document.body.classList.toggle("dark", prefs.darkMode);
    localStorage.setItem("theme", prefs.darkMode ? "dark" : "light");

    toast.success("Preferences saved!", "Your settings are now active.");
  };

  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="page-wrapper--narrow">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-avatar-lg">{initials}</div>
        <div>
          <p className="profile-meta-name">{profileData?.name || name}</p>
          <div className="profile-meta-role">
            <span className="badge badge-success">{role}</span>
            <span className="text-muted">{profileData?.email || "—"}</span>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="profile-section">
        <p className="profile-section-title">Account Details</p>
        <div className="card card-sm">
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Display Name</label>
            <div className="flex gap-8">
              <input className="form-input" value={editName}
                onChange={e => setEditName(e.target.value)} placeholder="Your name" />
              <button className="btn btn-primary btn-sm" onClick={saveName}
                disabled={savingName || !editName.trim()} style={{ flexShrink: 0 }}>
                {savingName ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email address</label>
            <input className="form-input" value={profileData?.email || "—"} disabled
              style={{ opacity: 0.7, cursor: "not-allowed" }} />
            <span className="form-hint">Email cannot be changed.</span>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="profile-section">
        <p className="profile-section-title">Preferences</p>
        <div className="card card-sm" style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Dark mode */}
          <label className="flex gap-12" style={{ alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={prefs.darkMode}
              onChange={e => setPrefs(p => ({ ...p, darkMode: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: "var(--green-600)" }} />
            <div>
              <p className="font-600" style={{ fontSize: "0.9rem" }}>Dark mode</p>
              <p className="text-muted" style={{ fontSize: "0.8rem" }}>Switch between light and dark interface</p>
            </div>
          </label>

          {/* Email alerts */}
          <label className="flex gap-12" style={{ alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={prefs.emailAlerts}
              onChange={e => setPrefs(p => ({ ...p, emailAlerts: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: "var(--green-600)" }} />
            <div>
              <p className="font-600" style={{ fontSize: "0.9rem" }}>Email reminders</p>
              <p className="text-muted" style={{ fontSize: "0.8rem" }}>Receive due date reminders before a book is overdue</p>
            </div>
          </label>

          {/* Compact view */}
          <label className="flex gap-12" style={{ alignItems: "center", cursor: "pointer" }}>
            <input type="checkbox" checked={prefs.compactView}
              onChange={e => setPrefs(p => ({ ...p, compactView: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: "var(--green-600)" }} />
            <div>
              <p className="font-600" style={{ fontSize: "0.9rem" }}>Compact view</p>
              <p className="text-muted" style={{ fontSize: "0.8rem" }}>Show books as a list instead of cards</p>
            </div>
          </label>

          <button className="btn btn-primary btn-sm" style={{ alignSelf: "flex-start" }}
            onClick={savePrefs}>
            Save preferences
          </button>
        </div>
      </div>

      {/* Admin — user table */}
      {role === "admin" && (
        <div className="profile-section">
          <div className="flex-between" style={{ marginBottom: 4, alignItems: "center" }}>
            <p className="profile-section-title" style={{ marginBottom: 0 }}>
              Registered Students ({allUsers.filter(u => u.role === "student").length})
            </p>
            <button
              className="btn btn-secondary btn-sm"
              disabled={exporting || allUsers.length === 0}
              onClick={() => {
                setExporting(true);
                try {
                  exportUsersToCSV(allUsers);
                } finally {
                  setTimeout(() => setExporting(false), 1000);
                }
              }}
            >
              {exporting ? "Exporting…" : "⬇ Export CSV"}
            </button>
          </div>
          <div className="filter-bar" style={{ marginBottom: 12 }}>
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input className="form-input" placeholder="Search students…"
                value={userSearch} onChange={e => setUserSearch(e.target.value)} />
            </div>
          </div>
          {loading ? (
            <div className="spinner-wrapper" style={{ padding: 24 }}>
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>No users found</td></tr>
                  ) : filteredUsers.map((u, i) => (
                    <tr key={u._id}>
                      <td className="text-muted">{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td className="text-muted">{u.email}</td>
                      <td><span className={`badge ${u.role === "admin" ? "badge-warning" : "badge-success"}`}>{u.role}</span></td>
                      <td className="text-muted">{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Profile;