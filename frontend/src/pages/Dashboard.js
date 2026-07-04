import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  useEffect(() => {
  if (!role) {
    navigate("/login");
  } else if (role === "admin") {
    navigate("/admin-home");
  } else if (role === "librarian") {
    navigate("/librarian-home");
  } else {
    navigate("/student-home");
  }
}, [role, navigate]);

  return (
    <div className="flex-center" style={{ minHeight: "60vh" }}>
      <div className="spinner-wrapper">
        <div className="spinner"></div>
      </div>
    </div>
  );
}

export default Dashboard;