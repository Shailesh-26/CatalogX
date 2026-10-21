import { Navigate, useLocation } from "react-router-dom";
import { homeFor } from "../auth";

// <ProtectedRoute roles={["admin"]}> … </ProtectedRoute>
// - not logged in  → /login (remembers where they were going)
// - wrong role     → their own dashboard
function ProtectedRoute({ children, roles }) {
  const role     = localStorage.getItem("role");
  const token    = localStorage.getItem("token");
  const location = useLocation();

  if (!role || !token) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to={homeFor(role)} replace />;
  }

  return children;
}

export default ProtectedRoute;
