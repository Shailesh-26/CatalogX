import { Link } from "react-router-dom";

function Footer() {
  const year = new Date().getFullYear();
  const role = localStorage.getItem("role");

  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        {/* Brand */}
        <div className="footer-brand">
          <div className="footer-brand-icon">📚</div>
          <span>© {year} Smart Library. All rights reserved.</span>
        </div>

        {/* Links */}
        <nav className="footer-links">
          <Link to="/public"  className="footer-link">Browse Catalogue</Link>
          {!role && (
            <>
              <Link to="/login"  className="footer-link">Log in</Link>
              <Link to="/signup" className="footer-link">Register</Link>
            </>
          )}
          {role === "student" && (
            <>
              <Link to="/books"   className="footer-link">Books</Link>
              <Link to="/mybooks" className="footer-link">My Books</Link>
              <Link to="/profile" className="footer-link">Profile</Link>
            </>
          )}
          {role === "admin" && (
            <>
              <Link to="/books"  className="footer-link">Books</Link>
              <Link to="/admin"  className="footer-link">Logs</Link>
              <Link to="/audit"  className="footer-link">Audit</Link>
              <Link to="/profile" className="footer-link">Settings</Link>
            </>
          )}
        </nav>

        {/* Right */}
        <div className="footer-right">
          Built with MERN Stack · React · Node · MongoDB
        </div>
      </div>
    </footer>
  );
}

export default Footer;