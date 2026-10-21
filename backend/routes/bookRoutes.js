const express  = require("express");
const router   = express.Router();
const Book     = require("../models/Book");
const Borrow   = require("../models/Borrow");
const User     = require("../models/User");
const { verifyToken, verifyStaff } = require("../middleware/authMiddleware");
const { createAuditLog }           = require("../utils/audit");
const { upload, cloudinary }       = require("../utils/cloudinary");
const { escapeRegex, getPaging, parseTags, isValidId } = require("../utils/helpers");

// Fields staff are allowed to edit — prevents someone from PUTting
// { totalBorrows: 9999 } or overwriting the cached AI summary.
const EDITABLE = ["title", "author", "isbn", "availableCopies", "category"];

async function actorOf(req) {
  const u = await User.findById(req.user.id).select("name role");
  return { userId: req.user.id, userName: u?.name || "Staff", userRole: u?.role || req.user.role };
}

// GET /api/books?page=1&limit=9&search=&category=&availability=&tag=
router.get("/", verifyToken, async (req, res) => {
  try {
    const { page, limit, skip } = getPaging(req.query, 9, 50);
    const search       = (req.query.search || "").trim();
    const category     = req.query.category     || "";
    const availability = req.query.availability || "";

    const query = {};
    if (search) {
      const rx = { $regex: escapeRegex(search), $options: "i" };
      query.$or = [{ title: rx }, { author: rx }, { isbn: rx }, { category: rx }, { tags: rx }];
    }
    if (category && category !== "All") query.category = category;
    if (availability === "available")   query.availableCopies = { $gt: 0 };
    if (availability === "unavailable") query.availableCopies = 0;
    if (req.query.tag) query.tags = String(req.query.tag).toLowerCase();

    const [total, books] = await Promise.all([
      Book.countDocuments(query),
      Book.find(query).select("-aiSummary").sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);
    const totalPages = Math.ceil(total / limit);

    res.json({
      books,
      pagination: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/books/all — no pagination
router.get("/all", verifyToken, async (req, res) => {
  try {
    const books = await Book.find().select("-aiSummary").sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/books/tags — distinct tags (used for filter chips; avoids downloading every book)
router.get("/tags", verifyToken, async (req, res) => {
  try {
    const tags = await Book.distinct("tags");
    res.json(tags.filter(Boolean).sort());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/books/categories — distinct categories
router.get("/categories", verifyToken, async (req, res) => {
  try {
    const cats = await Book.distinct("category");
    res.json(cats.filter(Boolean).sort());
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    res.status(500).json({ message: err.message });
  }
});

// GET /api/books/:id
router.get("/:id", verifyToken, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(404).json({ message: "Book not found." });
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found." });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/books/:id/related
router.get("/:id/related", verifyToken, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.json([]);
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found." });
    const related = await Book.find({ category: book.category, _id: { $ne: book._id } })
      .select("-aiSummary").limit(4);
    res.json(related);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/books/:id/also-borrowed — "People also borrowed"
// (Previously queried fields `book` / `user` which don't exist on Borrow,
//  so this section was always empty.)
router.get("/:id/also-borrowed", verifyToken, async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.json({ books: [] });
    const readers = await Borrow.find({ bookId: req.params.id }).distinct("userId");
    if (!readers.length) return res.json({ books: [] });

    const otherBookIds = await Borrow.find({
      userId: { $in: readers },
      bookId: { $ne: req.params.id },
    }).distinct("bookId");

    const books = await Book.find({ _id: { $in: otherBookIds } })
      .sort({ totalBorrows: -1 })
      .limit(4)
      .select("title author category tags coverImage totalBorrows availableCopies");

    res.json({ books });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/books/add — staff (admin or librarian), optional cover upload
router.post("/add", verifyStaff, upload.single("cover"), async (req, res) => {
  try {
    const { title, author, isbn, category, tags } = req.body;
    const availableCopies = Number(req.body.availableCopies);
    if (!title?.trim() || !author?.trim() || !isbn?.trim() || !category?.trim())
      return res.status(400).json({ message: "Title, author, ISBN and category are required." });
    if (!Number.isInteger(availableCopies) || availableCopies < 0)
      return res.status(400).json({ message: "Copies must be a whole number (0 or more)." });

    const dupe = await Book.findOne({ isbn: isbn.trim() });
    if (dupe)
      return res.status(400).json({ message: `A book with ISBN ${isbn} already exists ("${dupe.title}"). Edit its copies instead.` });

    const book = await new Book({
      title, author, isbn, availableCopies, category,
      coverImage: req.file?.path || null,
      tags: parseTags(tags),
    }).save();

    await createAuditLog({
      ...(await actorOf(req)),
      action: "ADD_BOOK", entity: book.title, entityId: book._id,
      details: `Added "${book.title}" by ${book.author} (${book.category}) — ${availableCopies} copies`,
    });

    // Notify all students in one DB round-trip instead of one insert per student
    const Notification = require("../models/Notification");
    const students = await User.find({ role: "student" }).select("_id");
    if (students.length) {
      await Notification.insertMany(students.map(s => ({
        userId: s._id, type: "NEW_BOOK_ADDED", title: "New Book Available!",
        message: `"${book.title}" by ${book.author} has been added to the ${book.category} catalogue.`,
        bookId: book._id,
      }))).catch(e => console.error("⚠ Notify failed:", e.message));
    }

    res.status(201).json({ message: "Book added successfully.", book });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/books/:id — staff, optional cover update
router.put("/:id", verifyStaff, upload.single("cover"), async (req, res) => {
  try {
    const updateData = {};
    for (const k of EDITABLE) if (req.body[k] !== undefined && req.body[k] !== "") updateData[k] = req.body[k];
    if (req.body.tags !== undefined) updateData.tags = parseTags(req.body.tags);
    if (req.file?.path) updateData.coverImage = req.file.path;

    if (updateData.availableCopies !== undefined) {
      const n = Number(updateData.availableCopies);
      if (!Number.isInteger(n) || n < 0)
        return res.status(400).json({ message: "Copies must be a whole number (0 or more)." });
      updateData.availableCopies = n;
    }

    const book = await Book.findByIdAndUpdate(req.params.id, updateData, {
      returnDocument: "after", runValidators: true,
    });
    if (!book) return res.status(404).json({ message: "Book not found." });

    await createAuditLog({
      ...(await actorOf(req)),
      action: "EDIT_BOOK", entity: book.title, entityId: book._id,
      details: `Edited book "${book.title}"`,
    });

    res.json({ message: "Book updated.", book });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/books/:id — staff
router.delete("/:id", verifyStaff, async (req, res) => {
  try {
    // Don't delete a book that students still have — it would orphan their borrow records
    const active = await Borrow.countDocuments({ bookId: req.params.id, returned: false });
    if (active > 0)
      return res.status(400).json({ message: `Can't delete: ${active} cop${active === 1 ? "y is" : "ies are"} still borrowed. Wait for returns first.` });

    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found." });

    if (book.coverImage) {
      const publicId = book.coverImage.split("/").slice(-1)[0].split(".")[0];
      await cloudinary.uploader.destroy(`smart-library/covers/${publicId}`).catch(() => {});
    }

    await createAuditLog({
      ...(await actorOf(req)),
      action: "DELETE_BOOK", entity: book.title, entityId: book._id,
      details: `Deleted book "${book.title}"`,
    });

    res.json({ message: "Book deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
