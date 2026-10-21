import { Navigate } from "react-router-dom";
import { homeFor } from "../auth";

// "/" just forwards each role to its own home page
function Dashboard() {
  const role = localStorage.getItem("role");
  return <Navigate to={role ? homeFor(role) : "/public"} replace />;
}

export default Dashboard;
