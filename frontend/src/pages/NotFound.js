import { Link } from "react-router-dom";
import { homeFor } from "../auth";

function NotFound() {
  const role = localStorage.getItem("role");
  return (
    <div className="page-wrapper flex-center" style={{ minHeight: "60vh", flexDirection: "column", textAlign: "center", gap: 12 }}>
      <div style={{ fontSize: "3.5rem" }}>📭</div>
      <h1 className="page-title">Page not found</h1>
      <p className="page-subtitle" style={{ maxWidth: 420 }}>
        This shelf is empty — the page you were looking for doesn't exist or was moved.
      </p>
      <div className="flex gap-8" style={{ marginTop: 8, justifyContent: "center" }}>
        <Link to={role ? homeFor(role) : "/public"} className="btn btn-primary">Go to {role ? "dashboard" : "catalogue"}</Link>
        <Link to="/books" className="btn btn-secondary">Browse books</Link>
      </div>
    </div>
  );
}

export default NotFound;
