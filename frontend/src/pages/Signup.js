import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Signup() {
  const [form,    setForm]    = useState({ name: "", email: "", password: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/register", form);
      // Redirect to OTP verification with email in state
      navigate("/verify-email", { state: { email: form.email, name: form.name } });
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel-left">
        <div className="auth-floating-books">
          {["📗","📘","📙","📕","📚"].map((b, i) => (
            <span key={i} style={{
              left: `${10 + i * 18}%`,
              animationDuration: `${8 + i * 3}s`,
              animationDelay: `${i * 1.5}s`,
              fontSize: `${1.2 + (i % 3) * 0.4}rem`
            }}>{b}</span>
          ))}
        </div>
        <div className="auth-panel-left-inner">
          <span className="auth-panel-logo">🎓</span>
          <h1 className="auth-panel-title">Join CatalogX - Smart Library</h1>
          <p className="auth-panel-subtitle">
            Register to start borrowing from our digital catalogue.
          </p>
          <ul className="auth-features">
            <li><span>✓</span><span>Free to register</span></li>
            <li><span>📅</span><span>3-day borrow period per book</span></li>
            <li><span>🔔</span><span>Due date reminders via email</span></li>
          </ul>
        </div>
      </div>

      <div className="auth-panel-right">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Create account</h1>
            <p className="auth-subtitle">Register to start borrowing books today.</p>
          </div>

          {error && (
            <div className="alert alert-danger"><span>⚠</span> {error}</div>
          )}

          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input className="form-input" name="name" placeholder="John Doe"
                onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input className="form-input" name="email" type="email"
                placeholder="you@example.com" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" name="password" type="password"
                placeholder="Min. 6 characters" onChange={handleChange} required />
              <span className="form-hint">At least 6 characters</span>
            </div>
            <button type="submit" className="btn btn-primary w-full mt-8"
              style={{ justifyContent: "center" }} disabled={loading}>
              {loading ? "Creating account…" : "Create account →"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.875rem",
            color: "var(--text-secondary)" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "var(--green-600)", fontWeight: 600,
              textDecoration: "none" }}>Log in</Link>
          </p>

          <p style={{ textAlign: "center", marginTop: 12, fontSize: "0.82rem",
            color: "var(--text-muted)" }}>
            <Link to="/public" style={{ color: "var(--text-muted)" }}>
              Browse books without logging in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;