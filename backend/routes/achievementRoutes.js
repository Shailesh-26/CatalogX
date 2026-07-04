const express     = require("express");
const router      = express.Router();
const Achievement = require("../models/Achievement");
const Borrow      = require("../models/Borrow");
const Review      = require("../models/Review");
const { verifyToken } = require("../middleware/authMiddleware");

const ACHIEVEMENTS = {
  FIRST_BORROW:  { icon: "📚", title: "First Borrow",   desc: "Borrowed your first book",               color: "#2471a3" },
  BOOKWORM:      { icon: "📖", title: "Bookworm",        desc: "Borrowed 10 or more books",              color: "#1a6b3c" },
  EXPLORER:      { icon: "🚀", title: "Explorer",        desc: "Borrowed books from 5 different categories", color: "#8e44ad" },
  REVIEWER:      { icon: "⭐", title: "Reviewer",        desc: "Wrote 5 or more reviews",                color: "#f59e0b" },
  SPEED_READER:  { icon: "⚡", title: "Speed Reader",    desc: "Returned a book within 1 day",           color: "#d35400" },
  LOYAL_READER:  { icon: "💚", title: "Loyal Reader",    desc: "Active for 30+ days since first borrow", color: "#1a6b3c" },
  NO_FINES:      { icon: "✅", title: "Perfect Record",  desc: "Returned 5 books with no fines",         color: "#1a6b3c" },
};

// GET /api/achievements/:userId — get unlocked + check for new ones
router.get("/:userId", verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check and award new achievements
    await checkAndAward(userId);

    const unlocked = await Achievement.find({ userId }).sort({ unlockedAt: 1 });
    const all = Object.entries(ACHIEVEMENTS).map(([type, meta]) => ({
      type,
      ...meta,
      unlocked: unlocked.some(u => u.type === type),
      unlockedAt: unlocked.find(u => u.type === type)?.unlockedAt || null,
    }));

    res.json(all);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function checkAndAward(userId) {
  const borrows  = await Borrow.find({ userId }).populate("bookId");
  const reviews  = await Review.find({ userId });
  const returned = borrows.filter(b => b.returned);

  const checks = [
    {
      type: "FIRST_BORROW",
      earned: borrows.length >= 1,
    },
    {
      type: "BOOKWORM",
      earned: borrows.length >= 10,
    },
    {
      type: "EXPLORER",
      earned: (() => {
        const cats = new Set(borrows.map(b => b.bookId?.category).filter(Boolean));
        return cats.size >= 5;
      })(),
    },
    {
      type: "REVIEWER",
      earned: reviews.length >= 5,
    },
    {
      type: "SPEED_READER",
      earned: returned.some(b => {
        if (!b.returnDate || !b.borrowDate) return false;
        const hours = (new Date(b.returnDate) - new Date(b.borrowDate)) / (1000 * 60 * 60);
        return hours <= 24;
      }),
    },
    {
      type: "LOYAL_READER",
      earned: (() => {
        if (borrows.length === 0) return false;
        const first = borrows.sort((a, b) => new Date(a.borrowDate) - new Date(b.borrowDate))[0];
        const days = (new Date() - new Date(first.borrowDate)) / (1000 * 60 * 60 * 24);
        return days >= 30;
      })(),
    },
    {
      type: "NO_FINES",
      earned: (() => {
        const noFine = returned.filter(b => {
          if (!b.returnDate || !b.dueDate) return false;
          return new Date(b.returnDate) <= new Date(b.dueDate);
        });
        return noFine.length >= 5;
      })(),
    },
  ];

  for (const check of checks) {
    if (!check.earned) continue;
    await Achievement.findOneAndUpdate(
      { userId, type: check.type },
      { userId, type: check.type },
      { upsert: true, returnDocument: "after" }
    );
  }
}

module.exports = router;