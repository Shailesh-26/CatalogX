import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { ToastProvider }    from "./context/ToastContext";
import api                  from "./api";
import Navbar               from "./components/Navbar";
import Sidebar              from "./components/Sidebar";
import Footer               from "./components/Footer";
import Dashboard            from "./pages/Dashboard";
import StudentDashboard     from "./pages/StudentDashboard";
import AdminHome            from "./pages/AdminHome";
import ViewBooks            from "./pages/ViewBooks";
import AddBook              from "./pages/AddBook";
import Login                from "./pages/Login";
import Signup               from "./pages/Signup";
import VerifyEmail          from "./pages/VerifyEmail";
import ForgotPassword       from "./pages/ForgotPassword";
import MyBooks              from "./pages/MyBooks";
import AdminDashboard       from "./pages/AdminDashboard";
import Profile              from "./pages/Profile";
import BookDetail           from "./pages/BookDetail";
import AuditLogs            from "./pages/AuditLogs";
import CreateStaff          from "./pages/CreateStaff";
import PublicCatalog        from "./pages/PublicCatalog";
import PopularBooks         from "./pages/PopularBooks";
import QueueDashboard       from "./pages/QueueDashboard";
import WishlistPage         from "./pages/WishlistPage";
import AnnouncementPage     from "./pages/AnnouncementPage";
import ProtectedRoute       from "./components/ProtectedRoute";

const AUTH_ROUTES = ["/login", "/signup", "/verify-email", "/forgot-password", "/public"];

const PRIORITY_STYLES = {
  high:   { gradient: "linear-gradient(90deg, rgba(220,38,38,0.16), rgba(220,38,38,0.06))", border: "var(--color-danger)",  text: "var(--color-danger)",  iconBg: "var(--color-danger)",  icon: "🚨", pulse: true  },
  normal: { gradient: "linear-gradient(90deg, rgba(26,107,60,0.16), rgba(245,158,11,0.06))", border: "var(--green-400)",     text: "var(--green-800)",     iconBg: "var(--green-600)",     icon: "📢", pulse: false },
  low:    { gradient: "linear-gradient(90deg, var(--surface-2), var(--surface))",             border: "var(--border)",        text: "var(--text-secondary)", iconBg: "var(--text-muted)",    icon: "ℹ",  pulse: false },
};

function AnnouncementBanner() {
  const role = localStorage.getItem("role");
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed,    setDismissed]    = useState(false);

  useEffect(() => {
    if (!role) return;
    api.get("/api/announcements/latest")
      .then(res => {
        if (!res.data) return;
        const seenId = sessionStorage.getItem("dismissedAnnouncementId");
        setAnnouncement(res.data);
        setDismissed(seenId === res.data._id);
      })
      .catch(() => {});
  }, [role]);

  if (!role || !announcement || dismissed) return null;

  const style = PRIORITY_STYLES[announcement.priority] || PRIORITY_STYLES.normal;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 20,
      background: style.gradient, borderBottom: `2px solid ${style.border}`,
      padding: "22px 32px", fontSize: "0.95rem",
      animation: "slideDown 0.3s ease",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: "16px", flexShrink: 0,
        background: style.iconBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.6rem", boxShadow: "var(--shadow-md)",
        animation: style.pulse ? "pulseGlow 1.8s ease-in-out infinite" : "none",
      }}>{style.icon}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <strong style={{ color: style.text, fontSize: "1.15rem", fontFamily: "var(--font-display)" }}>
            {announcement.title}
          </strong>
          {announcement.priority === "high" && (
            <span style={{
              fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.06em",
              textTransform: "uppercase", color: "#fff", background: "var(--color-danger)",
              padding: "2px 8px", borderRadius: "20px",
            }}>Urgent</span>
          )}
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", lineHeight: 1.5 }}>
          {announcement.message}
        </p>
      </div>

      {role === "admin" && (
        <a href="/admin/announcements" style={{
          flexShrink: 0, fontSize: "0.8rem", fontWeight: 700, color: style.text,
          textDecoration: "underline", whiteSpace: "nowrap",
        }}>
          View all →
        </a>
      )}

      <button
        onClick={() => {
          sessionStorage.setItem("dismissedAnnouncementId", announcement._id);
          setDismissed(true);
        }}
        style={{
          background: "rgba(255,255,255,0.5)", border: "none", cursor: "pointer",
          color: style.text, fontSize: "1rem", flexShrink: 0,
          width: 32, height: 32, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >✕</button>

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.4); }
          50%      { box-shadow: 0 0 0 8px rgba(220,38,38,0); }
        }
      `}</style>
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const isAuth   = AUTH_ROUTES.includes(location.pathname);
  const role     = localStorage.getItem("role");

  return (
    <div className="app-shell">
      <Navbar />
      {!isAuth && <AnnouncementBanner />}
      <div className="app-body">
        {!isAuth && role && <Sidebar />}
        <div className="main-content">
          <div className="main-content-inner">
            <Routes>
              <Route path="/"               element={<Dashboard />} />
              <Route path="/login"          element={<Login />} />
              <Route path="/signup"         element={<Signup />} />
              <Route path="/verify-email"   element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/public"         element={<PublicCatalog />} />

              <Route path="/student-home" element={
                <ProtectedRoute roleRequired="student"><StudentDashboard /></ProtectedRoute>
              } />
              <Route path="/admin-home" element={
                <ProtectedRoute roleRequired="admin"><AdminHome /></ProtectedRoute>
              } />
              <Route path="/books" element={
                <ProtectedRoute><ViewBooks /></ProtectedRoute>
              } />
              <Route path="/books/:id" element={
                <ProtectedRoute><BookDetail /></ProtectedRoute>
              } />
              <Route path="/add" element={
                <ProtectedRoute roleRequired="admin"><AddBook /></ProtectedRoute>
              } />
              <Route path="/mybooks" element={
                <ProtectedRoute roleRequired="student"><MyBooks /></ProtectedRoute>
              } />
              <Route path="/wishlist" element={
                <ProtectedRoute roleRequired="student"><WishlistPage /></ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute roleRequired="admin"><AdminDashboard /></ProtectedRoute>
              } />
              <Route path="/admin/queues" element={
                <ProtectedRoute roleRequired="admin"><QueueDashboard /></ProtectedRoute>
              } />
              <Route path="/admin/announcements" element={
                <ProtectedRoute roleRequired="admin"><AnnouncementPage /></ProtectedRoute>
              } />
              <Route path="/popular" element={
                <ProtectedRoute><PopularBooks /></ProtectedRoute>
              } />
              <Route path="/audit" element={
                <ProtectedRoute roleRequired="admin"><AuditLogs /></ProtectedRoute>
              } />
              <Route path="/create-staff" element={
                <ProtectedRoute roleRequired="admin"><CreateStaff /></ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute><Profile /></ProtectedRoute>
              } />
            </Routes>
          </div>
          {!isAuth && <Footer />}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </Router>
  );
}

export default App;