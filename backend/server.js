require("dotenv").config();
const express     = require("express");
const mongoose    = require("mongoose");
const cors        = require("cors");
const helmet      = require("helmet");
const rateLimit   = require("express-rate-limit");

// ── Fail fast if required config is missing ───────────────────
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET"];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`❌ Missing required env vars: ${missing.join(", ")}. Copy backend/.env.example to backend/.env and fill them in.`);
  process.exit(1);
}

const bookRoutes             = require("./routes/bookRoutes");
const authRoutes             = require("./routes/authRoutes");
const borrowRoutes           = require("./routes/borrowRoutes");
const analyticsRoutes        = require("./routes/analyticsRoutes");
const auditRoutes            = require("./routes/auditRoutes");
const noteRoutes             = require("./routes/noteRoutes");
const reviewRoutes           = require("./routes/reviewRoutes");
const notificationRoutes     = require("./routes/notificationRoutes");
const requestRoutes          = require("./routes/requestRoutes");
const publicRoutes           = require("./routes/publicRoutes");
const aiRoutes               = require("./routes/aiRoutes");
const favouriteRoutes        = require("./routes/favouriteRoutes");
const achievementRoutes      = require("./routes/achievementRoutes");
const studentAnalyticsRoutes = require("./routes/studentAnalyticsRoutes");
const announcementRoutes     = require("./routes/announcementRoutes");

const { startReminderJob } = require("./utils/reminderJob");

const app = express();

// ── Security ──────────────────────────────────────────────────
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// ── CORS — only allow the configured frontend origin(s) ───────
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",").map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    // allow same-origin / curl / Postman (no Origin header)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
}));

app.use(express.json({ limit: "1mb" }));

// ── Rate Limiting ─────────────────────────────────────────────
// The general limit was 200/15min which a single student could hit just by
// paging the catalogue (each page fires several requests + 30s polling).
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 1000,
  standardHeaders: true, legacyHeaders: false,
  message: { message: "Too many requests. Please try again in 15 minutes." },
});
// Only the sensitive auth endpoints get the strict limit — not /profile.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  standardHeaders: true, legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in 15 minutes." },
});
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { message: "Too many AI requests. Please slow down." },
});

app.use(generalLimiter);
app.use(
  ["/api/auth/login", "/api/auth/register", "/api/auth/verify-email",
   "/api/auth/resend-otp", "/api/auth/forgot-password", "/api/auth/reset-password"],
  authLimiter
);

// ── Routes ────────────────────────────────────────────────────
app.use("/api/auth",              authRoutes);
app.use("/api/ai",                aiLimiter, aiRoutes);
app.use("/api/books",             bookRoutes);
app.use("/api/borrow",            borrowRoutes);
app.use("/api/analytics",         analyticsRoutes);
app.use("/api/audit",             auditRoutes);
app.use("/api/notes",             noteRoutes);
app.use("/api/reviews",           reviewRoutes);
app.use("/api/notifications",     notificationRoutes);
app.use("/api/requests",          requestRoutes);
app.use("/api/public",            publicRoutes);
app.use("/api/favourites",        favouriteRoutes);
app.use("/api/achievements",      achievementRoutes);
app.use("/api/student-analytics", studentAnalyticsRoutes);
app.use("/api/announcements",     announcementRoutes);

app.get("/", (req, res) => res.json({ status: "CatalogX API running." }));
app.get("/api/health", (req, res) => res.json({
  status: "ok",
  db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
}));

// ── 404 + central error handler ───────────────────────────────
app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.name === "CastError")       return res.status(400).json({ message: "Invalid ID." });
  if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ message: "Image must be under 5 MB." });
  if (err.message?.includes("not allowed by CORS")) return res.status(403).json({ message: err.message });
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({ message: err.message || "Something went wrong." });
});

// ── Start: connect to DB first, then listen ───────────────────
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    if (process.env.DISABLE_CRON !== "true") startReminderJob();
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error("❌ MongoDB connection failed:", err.message);
    console.error("   Is MongoDB running? On Windows: open Services and start 'MongoDB Server', or run `net start MongoDB` as admin.");
    process.exit(1);
  });

module.exports = app;
