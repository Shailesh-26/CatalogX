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
  high:   { bg: "var(--color-danger-bg)",  border: "var(--color-danger)",  text: "var(--color-danger)",  icon: "🚨" },
  normal: { bg: "var(--green-50)",         border: "var(--green-200)",     text: "var(--green-800)",     icon: "📢" },
  low:    { bg: "var(--surface-2)",        border: "var(--border)",        text: "var(--text-secondary)", icon: "ℹ" },
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
      display: "flex", alignItems: "center", gap: 12,
      background: style.bg, borderBottom: `1px solid ${style.border}`,
      padding: "10px 20px", fontSize: "0.85rem",
    }}>
      <span style={{ fontSize: "1rem", flexShrink: 0 }}>{style.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ color: style.text }}>{announcement.title}</strong>
        <span style={{ color: "var(--text-secondary)", marginLeft: 8 }}>
          {announcement.message}
        </span>
      </div>
      <button
        onClick={() => {
          sessionStorage.setItem("dismissedAnnouncementId", announcement._id);
          setDismissed(true);
        }}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: style.text, fontSize: "0.9rem", flexShrink: 0, padding: 0,
        }}
      >✕</button>
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