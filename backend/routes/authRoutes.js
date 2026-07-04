const express  = require("express");
const router   = express.Router();
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const User     = require("../models/User");
const { verifyToken, verifyAdmin }  = require("../middleware/authMiddleware");
const { createAuditLog }            = require("../utils/audit");
const {
  sendVerificationOTP,
  sendPasswordResetOTP,
} = require("../utils/mailer");

// ── OTP generator ─────────────────────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required." });
    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters." });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already registered." });

    const otp       = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    const hashed    = await bcrypt.hash(password, 10);

    await new User({
      name, email, password: hashed,
      role: "student",
      isVerified: false,
      otp, otpExpiry,
    }).save();

    await sendVerificationOTP({ to: email, name, otp });

    res.status(201).json({ message: "Registration successful. Please check your email for the OTP." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/verify-email
router.post("/verify-email", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required." });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "No account found with this email." });
    if (user.isVerified)
      return res.status(400).json({ message: "Email already verified. Please log in." });
    if (!user.otp || user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP." });
    if (new Date() > new Date(user.otpExpiry))
      return res.status(400).json({ message: "OTP has expired. Please register again." });

    user.isVerified = true;
    user.otp        = null;
    user.otpExpiry  = null;
    await user.save();

    res.json({ message: "Email verified successfully! You can now log in." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/resend-otp
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "No account found with this email." });
    if (user.isVerified)
      return res.status(400).json({ message: "Email already verified." });

    const otp       = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.otp        = otp;
    user.otpExpiry  = otpExpiry;
    await user.save();

    await sendVerificationOTP({ to: email, name: user.name, otp });
    res.json({ message: "OTP resent to your email." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required." });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "No account found with this email." });

    // Check email verified (skip for admin/librarian)
    if (user.role === "student" && !user.isVerified)
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        needsVerification: true,
        email,
      });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid password." });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, role: user.role, name: user.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email });
    // Always return success to prevent email enumeration
    if (!user)
      return res.json({ message: "If an account exists, an OTP has been sent." });

    const otp       = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.otp        = otp;
    user.otpExpiry  = otpExpiry;
    await user.save();

    await sendPasswordResetOTP({ to: email, name: user.name, otp });
    res.json({ message: "If an account exists, an OTP has been sent." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: "All fields are required." });
    if (newPassword.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters." });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "No account found." });
    if (!user.otp || user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP." });
    if (new Date() > new Date(user.otpExpiry))
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });

    user.password  = await bcrypt.hash(newPassword, 10);
    user.otp       = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -otp -otpExpiry");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/profile
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim())
      return res.status(400).json({ message: "Name cannot be empty." });
    await User.findByIdAndUpdate(req.user.id, { name: name.trim() });
    res.json({ message: "Profile updated." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/users — admin
router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password -otp -otpExpiry").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/create-staff — admin only
router.post("/create-staff", verifyAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ message: "All fields are required." });
    if (!["admin", "librarian"].includes(role))
      return res.status(400).json({ message: "Role must be admin or librarian." });
    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters." });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already registered." });

    const hashed   = await bcrypt.hash(password, 10);
    const newStaff = await new User({
      name, email, password: hashed, role,
      isVerified: true, // Staff don't need email verification
    }).save();

    const creator = await User.findById(req.user.id);
    await createAuditLog({
      userId:   req.user.id,
      userName: creator?.name || "Admin",
      userRole: "admin",
      action:   "CREATE_STAFF",
      entity:   name,
      entityId: newStaff._id,
      details:  `Created ${role} account for "${name}" (${email})`,
    });

    res.status(201).json({ message: `${role} account created successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;