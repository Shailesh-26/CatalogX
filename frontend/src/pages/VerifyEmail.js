import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation, Link } from "react-router-dom";

function VerifyEmail() {
  const [otp,       setOtp]       = useState(["", "", "", "", "", ""]);
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [resent,    setResent]    = useState(false);
  const [countdown, setCountdown] = useState(0);

  const navigate  = useNavigate();
  const location  = useLocation();
  const email     = location.state?.email || "";
  const name      = location.state?.name  || "";

  // Countdown for resend
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");
    // Auto-focus next box
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    pasted.split("").forEach((char, i) => { if (i < 6) newOtp[i] = char; });
    setOtp(newOtp);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter the complete 6-digit OTP."); return; }
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/auth/verify-email", { email, otp: code });
      navigate("/login", { state: { verified: true } });
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed.");
      setOtp(["", "", "", "", "", ""]);
      document.getElementById("otp-0")?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await axios.post("http://localhost:5000/api/auth/resend-otp", { email });
      setResent(true);
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      document.getElementById("otp-0")?.focus();
    } catch (err) {
      setError(err.response?.data?.message || "Could not resend OTP.");
    } finally {
      setResending(false);
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
            }}>{b}</span>
          ))}
        </div>
        <div className="auth-panel-left-inner">
          <span className="auth-panel-logo">🔐</span>
          <h1 className="auth-panel-title">Verify Your Email</h1>
          <p className="auth-panel-subtitle">
            One more step! Enter the OTP we sent to confirm your account.
          </p>
          <ul className="auth-features">
            <li><span>📧</span><span>Check your inbox and spam folder</span></li>
            <li><span>⏰</span><span>OTP expires in 10 minutes</span></li>
            <li><span>🔁</span><span>Can resend if not received</span></li>
          </ul>
        </div>
      </div>

      <div className="auth-panel-right">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Check your email</h1>
            <p className="auth-subtitle">
              We sent a 6-digit OTP to <strong>{email || "your email"}</strong>
            </p>
          </div>

          {resent && (
            <div className="alert alert-success">
              <span>✓</span> OTP resent successfully!
            </div>
          )}
          {error && (
            <div className="alert alert-danger"><span>⚠</span> {error}</div>
          )}

          <form onSubmit={handleVerify}>
            {/* OTP input boxes */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center",
              marginBottom: 24 }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  style={{
                    width: 48, height: 56,
                    textAlign: "center",
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    border: `2px solid ${digit ? "var(--green-400)" : "var(--border)"}`,
                    borderRadius: "var(--radius-md)",
                    background: "var(--surface)",
                    color: "var(--text-primary)",
                    outline: "none",
                    transition: "var(--transition)",
                    caretColor: "var(--green-400)",
                  }}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <button type="submit" className="btn btn-primary w-full"
              style={{ justifyContent: "center" }} disabled={loading}>
              {loading ? "Verifying…" : "Verify Email →"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 8 }}>
              Didn't receive the OTP?
            </p>
            {countdown > 0 ? (
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                Resend in {countdown}s
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                style={{ background: "none", border: "none", cursor: "pointer",
                  color: "var(--green-600)", fontWeight: 600, fontSize: "0.875rem" }}>
                {resending ? "Resending…" : "Resend OTP"}
              </button>
            )}
          </div>

          <p style={{ textAlign: "center", marginTop: 16, fontSize: "0.82rem",
            color: "var(--text-muted)" }}>
            Wrong email?{" "}
            <Link to="/signup" style={{ color: "var(--green-600)", fontWeight: 600,
              textDecoration: "none" }}>Go back</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;