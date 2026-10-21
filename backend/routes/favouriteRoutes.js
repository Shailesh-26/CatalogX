const express   = require("express");
const router    = express.Router();
const Favourite = require("../models/Favourite");
const Book      = require("../models/Book");
const { verifyToken, selfOrStaff } = require("../middleware/authMiddleware");

// GET /api/favourites/ids — just the bookIds the logged-in user has wishlisted.
// Lets the catalogue render all hearts with ONE request instead of one per card.
router.get("/ids", verifyToken, async (req, res) => {
  try {
    const ids = await Favourite.find({ userId: req.user.id }).distinct("bookId");
    res.json(ids.map(String));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/favourites/:userId
router.get("/:userId", verifyToken, selfOrStaff(), async (req, res) => {
  try {
    const favs = await Favourite.find({ userId: req.params.userId })
      .populate("bookId")
      .sort({ createdAt: -1 });
    res.json(favs.filter(f => f.bookId)); // drop favourites of deleted books
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/favourites/check/:userId/:bookId
router.get("/check/:userId/:bookId", verifyToken, selfOrStaff(), async (req, res) => {
  try {
    const fav = await Favourite.findOne({
      userId: req.params.userId,
      bookId: req.params.bookId,
    });
    res.json({ isFavourite: !!fav });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/favourites/toggle
router.post("/toggle", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.body;
    if (!bookId)
      return res.status(400).json({ message: "bookId required." });
    if (!(await Book.exists({ _id: bookId })))
      return res.status(404).json({ message: "Book not found." });

    const existing = await Favourite.findOne({ userId, bookId });
    if (existing) {
      await existing.deleteOne();
      return res.json({ isFavourite: false, message: "Removed from wishlist." });
    }

    await new Favourite({ userId, bookId }).save();
    res.json({ isFavourite: true, message: "Added to wishlist." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;