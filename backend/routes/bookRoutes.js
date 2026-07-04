const express  = require("express");
const router   = express.Router();
const Book     = require("../models/Book");
const User     = require("../models/User");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");
const { createAuditLog }           = require("../utils/audit");
const { createNotification }       = require("../utils/notify");
const { upload, cloudinary }       = require("../utils/cloudinary");

// GET /api/books?page=1&limit=9&search=&category=&availability=
router.get("/", verifyToken, async (req, res) => {
  try {
    const page         = parseInt(req.query.page)  || 1;
    const limit        = parseInt(req.query.limit) || 9;
    const search       = req.query.search       || "";
    const category     = req.query.category     || "";
    const availability = req.query.availability || "";

    const query = {};
    if (search) {
      query.$or = [
        { title:    { $regex: search, $options: "i" } },
        { author:   { $regex: search, $options: "i" } },
        { isbn:     { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { tags:     { $regex: search, $options: "i" } },
      ];
    }
    if (category && category !== "All") query.category = category;
    if (availability === "available")   query.availableCopies = { $gt: 0 };
    if (availability === "unavailable") query.availableCopies = 0;
    if (req.query.tag) query.tags = req.query.tag;

    const total = await Book.countDocuments(query);
    const books = await Book.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      books,
      pagination: {
        total, page, limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/books/all — no pagination
router.get("/all", verifyToken, async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/books/popular — top 5 most borrowed
router.get("/popular", verifyToken, async (req, res) => {
  try {
    const books = await Book.find({ totalBorrows: { $gt: 0 } })
      .sort({ totalBorrows: -1 })
      .limit(5);
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/books/:id
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found." });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/books/:id/related
router.get("/:id/related", verifyToken, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found." });
    const related = await Book.find({ category: book.category, _id: { $ne: book._id } }).limit(4);
    res.json(related);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/books/add — with optional cover upload
router.post("/add", verifyAdmin, upload.single("cover"), async (req, res) => {
  try {
    const { title, author, isbn, availableCopies, category, tags } = req.body;
    if (!title || !author || !isbn || !availableCopies || !category)
      return res.status(400).json({ message: "All fields are required." });

    const coverImage = req.file?.path || null;
    let parsedTags = [];
    if (tags) {
      try { parsedTags = JSON.parse(tags); } catch { parsedTags = []; }
    }
    const book = await new Book({
      title, author, isbn, availableCopies, category, coverImage, tags: parsedTags
    }).save();

    const admin = await User.findById(req.user.id);
    await createAuditLog({
      userId:   req.user.id,
      userName: admin?.name || "Admin",
      userRole: "admin",
      action:   "ADD_BOOK",
      entity:   title,
      entityId: book._id,
      details:  `Added "${title}" by ${author} (${category}) — ${availableCopies} copies`,
    });

    // Notify all students
    const students = await User.find({ role: "student" }).select("_id");
    await Promise.all(students.map(s =>
      createNotification({
        userId:  s._id,
        type:    "NEW_BOOK_ADDED",
        title:   "New Book Available!",
        message: `"${title}" by ${author} has been added to the ${category} catalogue.`,
        bookId:  book._id,
      })
    ));

    res.status(201).json({ message: "Book added successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/books/:id — with optional cover update
router.put("/:id", verifyAdmin, upload.single("cover"), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file?.path) updateData.coverImage = req.file.path;

    const book  = await Book.findByIdAndUpdate(req.params.id, updateData, { returnDocument: "after" });
    const admin = await User.findById(req.user.id);
    await createAuditLog({
      userId:   req.user.id,
      userName: admin?.name || "Admin",
      userRole: "admin",
      action:   "EDIT_BOOK",
      entity:   book?.title || req.params.id,
      entityId: req.params.id,
      details:  `Edited book "${book?.title}"`,
    });

    res.json({ message: "Book updated." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/books/:id
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    // Delete from Cloudinary too if cover exists
    if (book?.coverImage) {
      const publicId = book.coverImage.split("/").slice(-1)[0].split(".")[0];
      await cloudinary.uploader.destroy(`smart-library/covers/${publicId}`).catch(() => {});
    }

    const admin = await User.findById(req.user.id);
    await createAuditLog({
      userId:   req.user.id,
      userName: admin?.name || "Admin",
      userRole: "admin",
      action:   "DELETE_BOOK",
      entity:   book?.title || req.params.id,
      entityId: req.params.id,
      details:  `Deleted book "${book?.title}"`,
    });

    res.json({ message: "Book deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/books/:id/also-borrowed
router.get('/:id/also-borrowed', verifyToken, async (req, res) => {
  try {
    const Borrow = require('../models/Borrow');
    // Find users who borrowed this book
    const borrows = await Borrow.find({ book: req.params.id }).distinct('user');
    if (!borrows.length) return res.json({ books: [] });

    // Find other books those users borrowed (excluding this book)
    const otherBorrows = await Borrow.find({
      user: { $in: borrows },
      book: { $ne: req.params.id }
    }).distinct('book');

    // Get top 4 books by totalBorrows
    const books = await Book.find({ _id: { $in: otherBorrows } })
      .sort({ totalBorrows: -1 })
      .limit(4)
      .select('title author category tags coverImage totalBorrows availableCopies');

    res.json({ books });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;