const express     = require("express");
const mongoose    = require("mongoose");
const cors        = require("cors");
const helmet      = require("helmet");
const rateLimit   = require("express-rate-limit");
require("dotenv").config();

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

// ── Rate Limiting ─────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  standardHeaders: true, legacyHeaders: false,
  message: { message: "Too many requests. Please try again in 15 minutes." },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  standardHeaders: true, legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again in 15 minutes." },
});
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { message: "Too many AI requests. Please slow down." },
});

app.use(cors());
app.use(express.json());
app.use(generalLimiter);

// ── Database ──────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => { console.log("✅ MongoDB Connected"); startReminderJob(); })
  .catch(err => console.error("❌ MongoDB error:", err));

// ── Routes ────────────────────────────────────────────────────
app.use("/api/auth",              authLimiter, authRoutes);
app.use("/api/ai",                aiLimiter,   aiRoutes);
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));