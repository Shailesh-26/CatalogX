const express   = require("express");
const router    = express.Router();
const Favourite = require("../models/Favourite");
const Book      = require("../models/Book");
const Notification = require("../models/Notification");
const { verifyToken } = require("../middleware/authMiddleware");

// GET /api/favourites/:userId
router.get("/:userId", verifyToken, async (req, res) => {
  try {
    const favs = await Favourite.find({ userId: req.params.userId })
      .populate("bookId")
      .sort({ createdAt: -1 });
    res.json(favs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/favourites/check/:userId/:bookId
router.get("/check/:userId/:bookId", verifyToken, async (req, res) => {
  try {
    const fav = await Favourite.findOne({
      userId: req.params.userId,
      bookId: req.params.bookId,
    });
    res.json({ isFavourite: !!fav });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/favourites/toggle
router.post("/toggle", verifyToken, async (req, res) => {
  try {
    const { userId, bookId } = req.body;
    if (!userId || !bookId)
      return res.status(400).json({ message: "userId and bookId required." });

    const existing = await Favourite.findOne({ userId, bookId });
    if (existing) {
      await existing.deleteOne();
      return res.json({ isFavourite: false, message: "Removed from wishlist." });
    }

    await new Favourite({ userId, bookId }).save();
    res.json({ isFavourite: true, message: "Added to wishlist." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;