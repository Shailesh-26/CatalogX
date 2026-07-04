import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function Sidebar() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const role      = localStorage.getItem("role");
  const name      = localStorage.getItem("name");
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile,   setIsMobile]   = useState(window.innerWidth <= 768);
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isActive = (path) => location.pathname === path;
  const initials = name
    ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  const confirmLogout = () => { localStorage.clear(); navigate("/login"); };

  const studentMain = [
    { to: "/student-home", icon: "🏠", label: "Dashboard" },
    { to: "/books",        icon: "📚", label: "Browse Books" },
    { to: "/mybooks",      icon: "📖", label: "My Books" },
    { to: "/wishlist",     icon: "❤️", label: "Wishlist" },
    { to: "/popular",      icon: "🔥", label: "Popular" },
  ];
  const studentAccount = [
    { to: "/profile", icon: "👤", label: "Profile" },
  ];

  const adminMain = [
    { to: "/admin-home", icon: "🏠", label: "Dashboard" },
    { to: "/books",      icon: "📚", label: "Books" },
    { to: "/add",        icon: "➕", label: "Add Book" },
    { to: "/admin",      icon: "📋", label: "Borrow Logs" },
    { to: "/popular",    icon: "🔥", label: "Popular Books" },
  ];
  const adminTools = [
    { to: "/admin/queues",         icon: "📋", label: "Queue Dashboard" },
    { to: "/admin/announcements",  icon: "📢", label: "Announcements" },
    { to: "/audit",                icon: "🔍", label: "Audit Logs" },
    { to: "/create-staff",         icon: "👑", label: "Create Staff" },
    { to: "/profile",              icon: "⚙️", label: "Settings" },
  ];

  const sidebarStyle = isMobile ? {
    position: "fixed", top: "var(--navbar-height)", left: 0,
    height: "calc(100vh - var(--navbar-height))", width: "var(--sidebar-width)",
    transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
    transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)", zIndex: 150,
  } : {
    width: collapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-width)",
  };

  const showLabels = !collapsed || isMobile;

  const renderLinks = (links) => links.map(link => (
    <Link key={link.to} to={link.to}
      className={`sidebar-link ${isActive(link.to) ? "active" : ""}`}
      title={collapsed && !isMobile ? link.label : ""}>
      <span className="sidebar-icon">{link.icon}</span>
      <span className="sidebar-text">{link.label}</span>
    </Link>
  ));

  return (
    <>
      {isMobile && mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(2px)", zIndex: 149,
        }} />
      )}

      <button onClick={() => setMobileOpen(o => !o)} style={{
        display: isMobile ? "flex" : "none",
        position: "fixed", bottom: 24, right: 24,
        width: 52, height: 52, background: "var(--green-600)",
        border: "none", borderRadius: "50%",
        alignItems: "center", justifyContent: "center",
        fontSize: "1.3rem", cursor: "pointer",
        boxShadow: "var(--shadow-lg)", zIndex: 300, color: "#fff",
      }} aria-label="Menu">
        {mobileOpen ? "✕" : "☰"}
      </button>

      <aside className={`sidebar ${collapsed && !isMobile ? "collapsed" : ""}`}
        style={sidebarStyle}>
        {!isMobile && (
          <div className="sidebar-header">
            {showLabels && (
              <p style={{ fontSize: "0.7rem", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.08em",
                color: "var(--text-muted)" }}>Navigation</p>
            )}
            <button className="sidebar-collapse-btn"
              onClick={() => setCollapsed(c => !c)}
              title={collapsed ? "Expand" : "Collapse"}
              style={{ marginLeft: "auto" }}>
              {collapsed ? "›" : "‹"}
            </button>
          </div>
        )}

        <nav className="sidebar-nav">
          {role === "student" && (
            <>
              {showLabels && <p className="sidebar-section-label">Main</p>}
              {renderLinks(studentMain)}
              {showLabels && <p className="sidebar-section-label" style={{ marginTop: 8 }}>Account</p>}
              {renderLinks(studentAccount)}
            </>
          )}
          {role === "admin" && (
            <>
              {showLabels && <p className="sidebar-section-label">Main</p>}
              {renderLinks(adminMain)}
              {showLabels && <p className="sidebar-section-label" style={{ marginTop: 8 }}>Admin Tools</p>}
              {renderLinks(adminTools)}
            </>
          )}
        </nav>

        <div className="sidebar-user-card">
          {showLogout ? (
            <div style={{ padding: "12px", background: "var(--color-danger-bg)",
              border: "1px solid #f5c6c3", borderRadius: "var(--radius-md)" }}>
              <p style={{ fontSize: "0.8rem", fontWeight: 600,
                color: "var(--color-danger-text)", marginBottom: 10 }}>
                Log out of Smart Library?
              </p>
              <div className="flex gap-8">
                <button className="btn btn-danger btn-sm"
                  style={{ flex: 1, justifyContent: "center" }}
                  onClick={confirmLogout}>Yes, log out</button>
                <button className="btn btn-secondary btn-sm"
                  onClick={() => setShowLogout(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="sidebar-user-inner">
              <div className="sidebar-user-avatar">{initials}</div>
              {showLabels && (
                <>
                  <div className="sidebar-user-info">
                    <p className="sidebar-user-name">{name}</p>
                    <p className="sidebar-user-role">{role}</p>
                  </div>
                  <button className="sidebar-logout-btn"
                    onClick={() => setShowLogout(true)} title="Log out">↪</button>
                </>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;