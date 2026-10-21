import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../api";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { homeFor } from "../auth";

function Login() {
  const [form,    setForm]    = useState({ email: "", password: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const toast     = useToast();

  const justRegistered = location.state?.registered;
  const justVerified   = location.state?.verified;
  const sessionExpired = new URLSearchParams(location.search).get("expired") === "1";
  const redirectTo     = location.state?.from;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, form);

      localStorage.setItem("token",  res.data.token);
      localStorage.setItem("role",   res.data.role);
      localStorage.setItem("name",   res.data.name);

      localStorage.setItem("userId", res.data.id);

      toast.success("Login successful!", `Welcome back, ${res.data.name} 👋`);
      // Go back to the page they originally wanted, otherwise their dashboard
      navigate(redirectTo || homeFor(res.data.role), { replace: true });
    } catch (err) {
      // If email not verified, redirect to OTP page
      if (err.response?.data?.needsVerification) {
        navigate("/verify-email", { state: { email: form.email } });
        return;
      }
      setError(err.response?.data?.message
        || (!err.response ? "Can't reach the server. Is the backend running on port 5000?" : "Invalid email or password."));
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
          <span className="auth-panel-logo">📚</span>
          <h1 className="auth-panel-title">CatalogX - Smart Library</h1>
          <p className="auth-panel-subtitle">
            Your digital gateway to knowledge. Borrow, track, and return books with ease.
          </p>
          <ul className="auth-features">
            <li><span>📖</span><span>Browse thousands of books instantly</span></li>
            <li><span>⏰</span><span>Track due dates and avoid fines</span></li>
            <li><span>📊</span><span>Admin analytics at a glance</span></li>
          </ul>
        </div>
      </div>

      <div className="auth-panel-right">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Welcome back 👋</h1>
            <p className="auth-subtitle">Log in to your library account to continue.</p>
          </div>

          {justVerified && (
            <div className="alert alert-success" style={{ marginBottom: 20 }}>
              <span>🎉</span>
              <div>
                <strong>Email verified!</strong><br/>
                <span style={{ fontSize: "0.82rem" }}>You can now log in to your account.</span>
              </div>
            </div>
          )}

          {justRegistered && (
            <div className="alert alert-success" style={{ marginBottom: 20 }}>
              <span>🎉</span>
              <div>
                <strong>Registration successful!</strong><br/>
                <span style={{ fontSize: "0.82rem" }}>Please log in to continue.</span>
              </div>
            </div>
          )}

          {sessionExpired && !error && (
            <div className="alert alert-warning" style={{ marginBottom: 20 }}>
              <span>⏰</span> Your session expired. Please log in again.
            </div>
          )}

          {error && <div className="alert alert-danger" role="alert"><span>⚠</span> {error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input className="form-input" name="email" type="email" autoComplete="email" autoFocus
                placeholder="you@example.com" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <input className="form-input" name="password" type={showPw ? "text" : "password"}
                  autoComplete="current-password" style={{ paddingRight: 64 }}
                  placeholder="Enter your password" value={form.password} onChange={handleChange} required />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", fontSize: "0.78rem",
                    fontWeight: 600, color: "var(--text-muted)", padding: "4px 6px" }}>
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
              <div style={{ textAlign: "right", marginTop: 6 }}>
                <Link to="/forgot-password" style={{ fontSize: "0.8rem",
                  color: "var(--green-600)", textDecoration: "none" }}>
                  Forgot password?
                </Link>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full mt-8"
              style={{ justifyContent: "center" }} disabled={loading}>
              {loading ? "Logging in…" : "Log in →"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.875rem",
            color: "var(--text-secondary)" }}>
            New student?{" "}
            <Link to="/signup" style={{ color: "var(--green-600)", fontWeight: 600,
              textDecoration: "none" }}>Create an account</Link>
          </p>
          <p style={{ textAlign: "center", marginTop: 8, fontSize: "0.99rem" }}>
            <Link to="/public" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
              Browse books without logging in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;