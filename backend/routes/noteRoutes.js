const express = require("express");
const router  = express.Router();
const Note    = require("../models/Note");
const { verifyToken } = require("../middleware/authMiddleware");

// GET /api/notes/:borrowId — get note for a specific borrow
router.get("/:borrowId", verifyToken, async (req, res) => {
  try {
    const note = await Note.findOne({
      borrowId: req.params.borrowId,
      userId: req.user.id
    });

    res.json(note || null); } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notes — create or update note
router.post("/", verifyToken, async (req, res) => {
  try {
    const { userId, bookId, borrowId, content } = req.body;
    if (!userId || !bookId || !borrowId || !content?.trim())
      return res.status(400).json({ message: "All fields are required." });

    const note = await Note.findOneAndUpdate(
      { borrowId },
      { userId, bookId, borrowId, content: content.trim() },
      { upsert: true, returnDocument: "after" }
    );
    res.json({ message: "Note saved.", note });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notes/:borrowId — delete note
router.delete("/:borrowId", verifyToken, async (req, res) => {
  try {
    await Note.findOneAndDelete({ borrowId: req.params.borrowId, userId: req.user.id });
    res.json({ message: "Note deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;