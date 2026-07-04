const express  = require("express");
const router   = express.Router();
const Borrow   = require("../models/Borrow");
const Book     = require("../models/Book");
const User     = require("../models/User");
const Request  = require("../models/Request");
const Favourite = require("../models/Favourite");
const { verifyToken, verifyAdmin }  = require("../middleware/authMiddleware");
const { sendBorrowConfirmation }    = require("../utils/mailer");
const { createAuditLog }            = require("../utils/audit");
const { createNotification }        = require("../utils/notify");
const { BORROW_DAYS, MAX_BORROWS }  = require("../config/constants");

// POST /api/borrow/borrow
router.post("/borrow", verifyToken, async (req, res) => {
  try {
    const { userId, bookId } = req.body;
    if (!userId || !bookId)
      return res.status(400).json({ message: "userId and bookId are required." });

    const activeBorrows = await Borrow.countDocuments({ userId, returned: false });
    if (activeBorrows >= MAX_BORROWS)
      return res.status(400).json({
        message: `Borrow limit reached. You can only borrow ${MAX_BORROWS} books at a time.`
      });

    const alreadyBorrowed = await Borrow.findOne({ userId, bookId, returned: false });
    if (alreadyBorrowed)
      return res.status(400).json({ message: "You already borrowed this book." });

    const book = await Book.findById(bookId);
    if (!book || book.availableCopies <= 0)
      return res.status(400).json({ message: "This book is not available right now." });

    const dueDate = new Date(Date.now() + BORROW_DAYS * 24 * 60 * 60 * 1000);
    const borrow  = await new Borrow({ userId, bookId, dueDate }).save();

    book.availableCopies -= 1;
    book.totalBorrows    += 1;
    book.lastBorrowed     = new Date();
    await book.save();

    const user = await User.findById(userId);

    await createNotification({
      userId, type: "BORROW_CONFIRMED",
      title: "Book Borrowed!",
      message: `You borrowed "${book.title}". Due by ${dueDate.toLocaleDateString("en-IN")}.`,
      bookId: book._id,
    });

    await createAuditLog({
      userId, userName: user?.name || "Unknown", userRole: user?.role || "student",
      action: "BORROW_BOOK", entity: book.title, entityId: book._id,
      details: `Borrowed "${book.title}" — due ${dueDate.toLocaleDateString("en-IN")}`,
    });

    try {
      if (user?.email) {
        await sendBorrowConfirmation({
          to: user.email, studentName: user.name,
          book: { title: book.title, author: book.author, category: book.category, isbn: book.isbn },
          borrowDate: borrow.borrowDate, dueDate,
        });
      }
    } catch (emailErr) {
      console.error("⚠ Email failed:", emailErr.message);
    }

    res.json({ message: "Book borrowed successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/borrow/return
router.post("/return", verifyToken, async (req, res) => {
  try {
    const { borrowId } = req.body;
    if (!borrowId)
      return res.status(400).json({ message: "borrowId is required." });

    const record = await Borrow.findById(borrowId)
      .populate("bookId")
      .populate("userId", "name role");

    if (!record || record.returned)
      return res.status(400).json({ message: "Invalid borrow record." });

    record.returned   = true;
    record.returnDate = new Date();
    await record.save();

    const book = await Book.findById(record.bookId);
    if (book) {
      book.availableCopies += 1;
      await book.save();

      // Waitlist — notify next in queue
      const nextInQueue = await Request.findOne({
        bookId: book._id, status: "waiting",
      }).sort({ position: 1 }).populate("userId", "name email");

      if (nextInQueue) {
        nextInQueue.status     = "notified";
        nextInQueue.notifiedAt = new Date();
        await nextInQueue.save();
        await createNotification({
          userId: nextInQueue.userId._id, type: "BOOK_AVAILABLE",
          title: "Book Available!", bookId: book._id,
          message: `"${book.title}" is now available. Borrow it before someone else does!`,
        });
      }

      // ── Wishlist alerts ───────────────────────────────────
      const wishlisted = await Favourite.find({ bookId: book._id })
        .populate("userId", "_id name");

      for (const fav of wishlisted) {
        if (fav.userId._id.toString() === record.userId._id.toString()) continue;
        await createNotification({
          userId: fav.userId._id, type: "BOOK_AVAILABLE",
          title: "Wishlist Book Available! ❤️", bookId: book._id,
          message: `"${book.title}" from your wishlist is now available to borrow!`,
        });
      }
    }

    await createNotification({
      userId: record.userId._id, type: "RETURN_CONFIRMED",
      title: "Return Confirmed", bookId: record.bookId._id,
      message: `You returned "${record.bookId.title}" successfully.`,
    });

    await createAuditLog({
      userId: record.userId._id, userName: record.userId.name,
      userRole: record.userId.role, action: "RETURN_BOOK",
      entity: record.bookId.title, entityId: record.bookId._id,
      details: `Returned "${record.bookId.title}"`,
    });

    res.json({ message: "Book returned successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/borrow/renew
router.post("/renew", verifyToken, async (req, res) => {
  try {
    const { borrowId } = req.body;
    if (!borrowId)
      return res.status(400).json({ message: "borrowId is required." });

    const record = await Borrow.findById(borrowId)
      .populate("bookId")
      .populate("userId", "name role");

    if (!record || record.returned)
      return res.status(400).json({ message: "Invalid borrow record." });
    if (record.renewed)
      return res.status(400).json({ message: "This book has already been renewed once." });
    if (new Date(record.dueDate) < new Date())
      return res.status(400).json({ message: "Overdue books cannot be renewed." });

    const newDueDate = new Date(record.dueDate);
    newDueDate.setDate(newDueDate.getDate() + BORROW_DAYS);
    record.dueDate = newDueDate;
    record.renewed = true;
    await record.save();

    await createNotification({
      userId: record.userId._id, type: "RENEWAL_CONFIRMED",
      title: "Renewal Confirmed", bookId: record.bookId._id,
      message: `"${record.bookId.title}" renewed. New due date: ${newDueDate.toLocaleDateString("en-IN")}.`,
    });

    await createAuditLog({
      userId: record.userId._id, userName: record.userId.name,
      userRole: record.userId.role, action: "RENEW_BOOK",
      entity: record.bookId.title, entityId: record.bookId._id,
      details: `Renewed "${record.bookId.title}" — new due ${newDueDate.toLocaleDateString("en-IN")}`,
    });

    res.json({
      message: `Book renewed! New due date: ${newDueDate.toLocaleDateString("en-IN")}`,
      newDueDate,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/borrow/mybooks/:userId
router.get("/mybooks/:userId", verifyToken, async (req, res) => {
  try {
    const records = await Borrow.find({ userId: req.params.userId, returned: false })
      .populate("bookId");
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/borrow/history/:userId
router.get("/history/:userId", verifyToken, async (req, res) => {
  try {
    const records = await Borrow.find({ userId: req.params.userId, returned: true })
      .populate("bookId")
      .sort({ returnDate: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/borrow/all — admin
router.get("/all", verifyAdmin, async (req, res) => {
  try {
    const records = await Borrow.find()
      .populate("bookId")
      .populate("userId", "name email")
      .sort({ borrowDate: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;