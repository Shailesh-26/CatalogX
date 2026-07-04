import { useState } from "react";
import api from "../api";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";

function CreateStaff() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "admin" });
  const [loading, setLoading] = useState(false);
  const toast    = useToast();
  const navigate = useNavigate();

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/auth/create-staff", form);
      toast.success("Staff created!", `${form.role} account for "${form.name}" created successfully.`);
      setForm({ name: "", email: "", password: "", role: "admin" });
      setTimeout(() => navigate("/profile"), 1000);
    } catch (err) {
      toast.error("Failed", err.response?.data?.message || "Could not create staff account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper--narrow">
      <h1 className="page-title">Create Staff Account</h1>
      <p className="page-subtitle">Add a new admin or librarian to the system.</p>

      <div className="card">
        {/* Role info cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          <div style={{
            padding: "14px 16px",
            background: form.role === "admin" ? "var(--green-50)" : "var(--surface-2)",
            border: `2px solid ${form.role === "admin" ? "var(--green-400)" : "var(--border)"}`,
            borderRadius: "var(--radius-md)", cursor: "pointer", transition: "var(--transition)"
          }} onClick={() => setForm(p => ({ ...p, role: "admin" }))}>
            <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: 4 }}>
              👑 Admin
            </p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Full access. Can manage books, view all logs, create staff accounts.
            </p>
          </div>
          <div style={{
            padding: "14px 16px",
            background: form.role === "librarian" ? "var(--color-info-bg)" : "var(--surface-2)",
            border: `2px solid ${form.role === "librarian" ? "var(--color-info)" : "var(--border)"}`,
            borderRadius: "var(--radius-md)", cursor: "pointer", transition: "var(--transition)"
          }} onClick={() => setForm(p => ({ ...p, role: "librarian" }))}>
            <p style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: 4 }}>
              📚 Librarian
            </p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Can manage books and view borrow records. Cannot create staff accounts.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" name="name" placeholder="e.g. Rahul Sharma"
                value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" name="email" type="email"
                placeholder="staff@library.com"
                value={form.email} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Temporary Password</label>
            <input className="form-input" name="password" type="password"
              placeholder="Min. 6 characters"
              value={form.password} onChange={handleChange} required />
            <span className="form-hint">
              Share this password with the staff member. They should change it after first login.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" name="role"
              value={form.role} onChange={handleChange}>
              <option value="admin">Admin</option>
              <option value="librarian">Librarian</option>
            </select>
          </div>

          <div className="flex gap-12 mt-16">
            <button type="button" className="btn btn-secondary"
              onClick={() => navigate("/profile")}>Cancel</button>
            <button type="submit" className="btn btn-primary"
              disabled={loading} style={{ flex: 1, justifyContent: "center" }}>
              {loading ? "Creating…" : "Create Staff Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateStaff;