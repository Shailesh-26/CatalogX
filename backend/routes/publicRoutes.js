const express = require("express");
const router  = express.Router();
const Book    = require("../models/Book");
const Borrow  = require("../models/Borrow");
const User    = require("../models/User");
const Review  = require("../models/Review");

// GET /api/public/books?page=1&limit=9&search=&category=
router.get("/books", async (req, res) => {
  try {
    const page     = parseInt(req.query.page)  || 1;
    const limit    = parseInt(req.query.limit) || 9;
    const search   = req.query.search   || "";
    const category = req.query.category || "";

    const query = {};
    if (search) {
      query.$or = [
        { title:    { $regex: search, $options: "i" } },
        { author:   { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }
    if (category && category !== "All") query.category = category;

    const total = await Book.countDocuments(query);
    const books = await Book.find(query)
      .select("title author category availableCopies coverImage totalBorrows")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      books,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/public/stats — library overview for hero section
router.get("/stats", async (req, res) => {
  try {
    const totalBooks   = await Book.countDocuments();
    const totalMembers = await User.countDocuments({ role: "student" });
    const totalBorrows = await Borrow.countDocuments();
    const available    = await Book.countDocuments({ availableCopies: { $gt: 0 } });
    res.json({ totalBooks, totalMembers, totalBorrows, available });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/public/featured — top 4 most borrowed books
router.get("/featured", async (req, res) => {
  try {
    const books = await Book.find({ totalBorrows: { $gt: 0 } })
      .select("title author category availableCopies coverImage totalBorrows")
      .sort({ totalBorrows: -1 })
      .limit(4);
    // If not enough borrowed books, pad with newest
    if (books.length < 4) {
      const ids  = books.map(b => b._id);
      const more = await Book.find({ _id: { $nin: ids } })
        .select("title author category availableCopies coverImage totalBorrows")
        .sort({ createdAt: -1 })
        .limit(4 - books.length);
      books.push(...more);
    }
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/public/categories — category breakdown with counts
router.get("/categories", async (req, res) => {
  try {
    const pipeline = [
      { $group: { _id: "$category", count: { $sum: 1 }, available: { $sum: "$availableCopies" } } },
      { $sort: { count: -1 } }
    ];
    const cats = await Book.aggregate(pipeline);
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/public/reviews — recent reviews (no auth)
router.get("/reviews", async (req, res) => {
  try {
    const reviews = await Review.find({ comment: { $ne: "" } })
      .populate("userId", "name")
      .populate("bookId", "title author")
      .sort({ createdAt: -1 })
      .limit(6);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;