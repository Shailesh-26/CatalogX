const express = require("express");
const router  = express.Router();
const Review  = require("../models/Review");
const Borrow  = require("../models/Borrow");
const { verifyToken } = require("../middleware/authMiddleware");

// GET /api/reviews/:bookId — all reviews for a book
router.get("/:bookId", verifyToken, async (req, res) => {
  try {
    const reviews = await Review.find({ bookId: req.params.bookId })
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    const avg = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    res.json({ reviews, averageRating: avg, totalReviews: reviews.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reviews/check/:bookId/:userId — check if user already reviewed
router.get("/check/:bookId/:userId", verifyToken, async (req, res) => {
  try {
    const review = await Review.findOne({
      bookId: req.params.bookId,
      userId: req.params.userId
    });
    res.json({ reviewed: !!review, review: review || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reviews — submit a review
router.post("/", verifyToken, async (req, res) => {
  try {
    const { userId, bookId, rating, comment } = req.body;

    if (!userId || !bookId || !rating)
      return res.status(400).json({ message: "userId, bookId and rating are required." });
    if (rating < 1 || rating > 5)
      return res.status(400).json({ message: "Rating must be between 1 and 5." });

    // Verify student has actually returned this book
    const hasBorrowed = await Borrow.findOne({ userId, bookId, returned: true });
    if (!hasBorrowed)
      return res.status(403).json({ message: "You can only review books you have returned." });

    // Upsert — update if already reviewed
    const review = await Review.findOneAndUpdate(
      { userId, bookId },
      { rating, comment: comment?.trim() || "" },
      { upsert: true, returnDocument: "after" }
    );

    res.json({ message: "Review submitted.", review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reviews/:bookId — student deletes their own review
router.delete("/:bookId", verifyToken, async (req, res) => {
  try {
    await Review.findOneAndDelete({ bookId: req.params.bookId, userId: req.user.id });
    res.json({ message: "Review deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;