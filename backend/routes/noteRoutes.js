const express = require("express");
const router  = express.Router();
const Note    = require("../models/Note");
const Borrow  = require("../models/Borrow");
const { verifyToken } = require("../middleware/authMiddleware");

// GET /api/notes/:borrowId — get note for a specific borrow
router.get("/:borrowId", verifyToken, async (req, res) => {
  try {
    const note = await Note.findOne({
      borrowId: req.params.borrowId,
      userId: req.user.id
    });

    res.json(note || null); } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/notes — create or update note
router.post("/", verifyToken, async (req, res) => {
  try {
    const { borrowId, content } = req.body;
    if (!borrowId || !content?.trim())
      return res.status(400).json({ message: "All fields are required." });
    if (content.trim().length > 1000)
      return res.status(400).json({ message: "Notes can be at most 1000 characters." });

    // Make sure the borrow belongs to the logged-in user
    const borrow = await Borrow.findById(borrowId);
    if (!borrow || String(borrow.userId) !== String(req.user.id))
      return res.status(403).json({ message: "You can only add notes to your own borrows." });

    const note = await Note.findOneAndUpdate(
      { borrowId },
      { userId: req.user.id, bookId: borrow.bookId, borrowId, content: content.trim() },
      { upsert: true, returnDocument: "after" }
    );
    res.json({ message: "Note saved.", note });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/notes/:borrowId — delete note
router.delete("/:borrowId", verifyToken, async (req, res) => {
  try {
    await Note.findOneAndDelete({ borrowId: req.params.borrowId, userId: req.user.id });
    res.json({ message: "Note deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;