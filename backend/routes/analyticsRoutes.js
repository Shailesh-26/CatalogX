const express = require("express");
const router  = express.Router();
const Book    = require("../models/Book");
const Borrow  = require("../models/Borrow");
const User    = require("../models/User");
const { verifyAdmin } = require("../middleware/authMiddleware");

// GET /api/analytics/stats
router.get("/stats", verifyAdmin, async (req, res) => {
  try {
    const totalBooks     = await Book.countDocuments();
    const totalBorrowed  = await Borrow.countDocuments();
    const activeBorrowed = await Borrow.countDocuments({ returned: false });
    const overdue        = await Borrow.countDocuments({
      returned: false, dueDate: { $lt: new Date() }
    });
    const totalUsers = await User.countDocuments({ role: "student" });
    res.json({ totalBooks, totalBorrowed, activeBorrowed, overdue, totalUsers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/monthly?months=6
router.get("/monthly", verifyAdmin, async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const since  = new Date();
    since.setMonth(since.getMonth() - months);

    const pipeline = [
      { $match: { borrowDate: { $gte: since } } },
      {
        $group: {
          _id: { year: { $year: "$borrowDate" }, month: { $month: "$borrowDate" } },
          borrows: { $sum: 1 },
          returns: { $sum: { $cond: ["$returned", 1, 0] } }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ];

    const raw = await Borrow.aggregate(pipeline);

    const result = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year  = d.getFullYear();
      const month = d.getMonth() + 1;
      const label = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
      const found = raw.find(r => r._id.year === year && r._id.month === month);
      result.push({ month: label, borrows: found?.borrows || 0, returns: found?.returns || 0 });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/active-users?limit=5
router.get("/active-users", verifyAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const pipeline = [
      { $group: { _id: "$userId", borrows: { $sum: 1 } } },
      { $sort: { borrows: -1 } },
      { $limit: limit },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $project: { name: "$user.name", borrows: 1 } }
    ];
    const result = await Borrow.aggregate(pipeline);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/inventory-alerts
// Books with low stock or out of stock
router.get("/inventory-alerts", verifyAdmin, async (req, res) => {
  try {
    const outOfStock = await Book.find({ availableCopies: 0 })
      .select("title author availableCopies totalBorrows")
      .sort({ totalBorrows: -1 });

    const lowStock = await Book.find({ availableCopies: { $gt: 0, $lte: 2 } })
      .select("title author availableCopies totalBorrows")
      .sort({ availableCopies: 1 });

    res.json({ outOfStock, lowStock });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/book-stats
// Books never borrowed + full catalogue stats
router.get("/book-stats", verifyAdmin, async (req, res) => {
  try {
    const totalBooks    = await Book.countDocuments();
    const neverBorrowed = await Book.find({ totalBorrows: 0 })
      .select("title author category createdAt")
      .sort({ createdAt: -1 });

    const topBorrowed = await Book.find({ totalBorrows: { $gt: 0 } })
      .select("title author category totalBorrows lastBorrowed")
      .sort({ totalBorrows: -1 })
      .limit(5);

    const avgBorrows = totalBooks > 0
      ? (await Book.aggregate([{ $group: { _id: null, avg: { $avg: "$totalBorrows" } } }]))[0]?.avg?.toFixed(1) || 0
      : 0;

    res.json({ totalBooks, neverBorrowed, topBorrowed, avgBorrows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;