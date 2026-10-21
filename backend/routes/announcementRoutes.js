const express      = require("express");
const router       = express.Router();
const Announcement = require("../models/Announcement");
const User         = require("../models/User");
const Notification = require("../models/Notification");
const { createAuditLog }     = require("../utils/audit");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// POST /api/announcements — admin sends announcement to all students
router.post("/", verifyAdmin, async (req, res) => {
  try {
    const { title, message, priority = "normal" } = req.body;
    if (!title?.trim() || !message?.trim())
      return res.status(400).json({ message: "Title and message are required." });
    if (!["low", "normal", "high"].includes(priority))
      return res.status(400).json({ message: "Priority must be low, normal or high." });
    if (title.length > 120 || message.length > 1000)
      return res.status(400).json({ message: "Title max 120 chars, message max 1000 chars." });

    // Save announcement record
    const announcement = await new Announcement({
      title, message, priority,
      createdBy: req.user.id,
    }).save();

    // Notify ALL students
    const students = await User.find({ role: "student" }).select("_id");
    if (students.length) {
      await Notification.insertMany(students.map(st => ({
        userId: st._id, type: "ANNOUNCEMENT", title: title.trim(), message: message.trim(), bookId: null,
      })));
    }

    // Audit log
    const admin = await User.findById(req.user.id);
    await createAuditLog({
      userId:   req.user.id,
      userName: admin?.name || "Admin",
      userRole: "admin",
      action:   "SEND_ANNOUNCEMENT",
      entity:   title,
      entityId: announcement._id,
      details:  `Sent announcement "${title}" to ${students.length} student${students.length !== 1 ? "s" : ""}`,
    });

    res.status(201).json({
      message: `Announcement sent to ${students.length} student${students.length !== 1 ? "s" : ""}.`,
      announcement,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/announcements/latest — any logged-in user, most recent announcement (for banner)
router.get("/latest", verifyToken, async (req, res) => {
  try {
    // Only show recent announcements in the banner — not one from months ago
    const since  = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const latest = await Announcement.findOne({ createdAt: { $gte: since } }).sort({ createdAt: -1 });
    res.json(latest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/announcements — admin sees all past announcements
router.get("/", verifyAdmin, async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/announcements/:id — admin deletes announcement record
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: "Announcement deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;