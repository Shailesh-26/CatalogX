import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const STEP = { EMAIL: "email", OTP: "otp", PASSWORD: "password", DONE: "done" };

function ForgotPassword() {
  const [step,     setStep]     = useState(STEP.EMAIL);
  const [email,    setEmail]    = useState("");
  const [otp,      setOtp]      = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");
    if (value && index < 5) document.getElementById(`fp-otp-${index + 1}`)?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      document.getElementById(`fp-otp-${index - 1}`)?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => { if (i < 6) newOtp[i] = char; });
    setOtp(newOtp);
  };

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await axios.post("http://localhost:5000/api/auth/forgot-password", { email });
      setStep(STEP.OTP);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter the complete 6-digit OTP."); return; }
    // Don't verify OTP separately — just move to password step
    setStep(STEP.PASSWORD);
    setError("");
  };

  // Step 3: Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6)  { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/reset-password", {
        email, otp: otp.join(""), newPassword: password,
      });
      setStep(STEP.DONE);
    } catch (err) {
      setError(err.response?.data?.message || "Password reset failed.");
      setStep(STEP.OTP);
      setOtp(["", "", "", "", "", ""]);
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = {
    [STEP.EMAIL]:    { title: "Forgot password?", sub: "Enter your email to receive a reset OTP." },
    [STEP.OTP]:      { title: "Enter OTP",         sub: `We sent a 6-digit code to ${email}` },
    [STEP.PASSWORD]: { title: "New password",       sub: "Choose a strong new password." },
    [STEP.DONE]:     { title: "All done! 🎉",       sub: "Your password has been reset." },
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
            }}>{b}</span>
          ))}
        </div>
        <div className="auth-panel-left-inner">
          <span className="auth-panel-logo">🔑</span>
          <h1 className="auth-panel-title">Reset Password</h1>
          <p className="auth-panel-subtitle">
            We'll send you a one-time code to verify your identity.
          </p>
          <ul className="auth-features">
            <li><span>📧</span><span>OTP sent to your registered email</span></li>
            <li><span>⏰</span><span>Valid for 10 minutes only</span></li>
            <li><span>🔒</span><span>Your account stays secure</span></li>
          </ul>
        </div>
      </div>

      <div className="auth-panel-right">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">{stepTitles[step].title}</h1>
            <p className="auth-subtitle">{stepTitles[step].sub}</p>
          </div>

          {error && <div className="alert alert-danger"><span>⚠</span> {error}</div>}

          {/* Step 1 — Email */}
          {step === STEP.EMAIL && (
            <form onSubmit={handleSendOTP}>
              <div className="form-group">
                <label className="form-label">Email address</label>
                <input className="form-input" type="email"
                  placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary w-full mt-8"
                style={{ justifyContent: "center" }} disabled={loading}>
                {loading ? "Sending OTP…" : "Send OTP →"}
              </button>
            </form>
          )}

          {/* Step 2 — OTP */}
          {step === STEP.OTP && (
            <form onSubmit={handleVerifyOTP}>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
                {otp.map((digit, i) => (
                  <input key={i} id={`fp-otp-${i}`}
                    type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    style={{
                      width: 48, height: 56, textAlign: "center",
                      fontSize: "1.4rem", fontWeight: 700,
                      border: `2px solid ${digit ? "var(--green-400)" : "var(--border)"}`,
                      borderRadius: "var(--radius-md)",
                      background: "var(--surface)", color: "var(--text-primary)",
                      outline: "none", transition: "var(--transition)",
                    }}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <button type="submit" className="btn btn-primary w-full"
                style={{ justifyContent: "center" }}>
                Verify OTP →
              </button>
            </form>
          )}

          {/* Step 3 — New Password */}
          {step === STEP.PASSWORD && (
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input className="form-input" type="password"
                  placeholder="Min. 6 characters"
                  value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input className="form-input" type="password"
                  placeholder="Repeat your new password"
                  value={confirm} onChange={e => setConfirm(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary w-full mt-8"
                style={{ justifyContent: "center" }} disabled={loading}>
                {loading ? "Resetting…" : "Reset Password →"}
              </button>
            </form>
          )}

          {/* Step 4 — Done */}
          {step === STEP.DONE && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: 16 }}>🎉</div>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
                Your password has been reset successfully. You can now log in with your new password.
              </p>
              <button className="btn btn-primary w-full" style={{ justifyContent: "center" }}
                onClick={() => navigate("/login")}>
                Go to Login →
              </button>
            </div>
          )}

          <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.875rem",
            color: "var(--text-secondary)" }}>
            <Link to="/login" style={{ color: "var(--green-600)", fontWeight: 600,
              textDecoration: "none" }}>← Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;