const express  = require("express");
const router   = express.Router();
const Borrow   = require("../models/Borrow");
const Book     = require("../models/Book");
const User     = require("../models/User");
const Request  = require("../models/Request");
const Favourite = require("../models/Favourite");
const { verifyToken, verifyStaff, selfOrStaff, isStaff } = require("../middleware/authMiddleware");
const { sendBorrowConfirmation }    = require("../utils/mailer");
const { createAuditLog }            = require("../utils/audit");
const { createNotification }        = require("../utils/notify");
const { BORROW_DAYS, MAX_BORROWS, FINE_PER_DAY } = require("../config/constants");

const DAY = 24 * 60 * 60 * 1000;
const fineFor = (rec, asOf = new Date()) => {
  const end = rec.returnDate ? new Date(rec.returnDate) : asOf;
  const late = Math.ceil((end - new Date(rec.dueDate)) / DAY);
  return late > 0 ? late * FINE_PER_DAY : 0;
};

// POST /api/borrow/borrow
// The borrower is ALWAYS the logged-in user (req.user.id). Previously the
// server trusted `userId` from the request body, so anyone could borrow on
// someone else's account.
router.post("/borrow", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookId } = req.body;
    if (!bookId)
      return res.status(400).json({ message: "bookId is required." });
    if (req.user.role !== "student")
      return res.status(403).json({ message: "Only student accounts can borrow books." });

    const activeBorrows = await Borrow.countDocuments({ userId, returned: false });
    if (activeBorrows >= MAX_BORROWS)
      return res.status(400).json({
        message: `Borrow limit reached. You can only borrow ${MAX_BORROWS} books at a time.`
      });

    const overdue = await Borrow.countDocuments({ userId, returned: false, dueDate: { $lt: new Date() } });
    if (overdue > 0)
      return res.status(400).json({ message: "Please return your overdue book(s) before borrowing another." });

    const alreadyBorrowed = await Borrow.findOne({ userId, bookId, returned: false });
    if (alreadyBorrowed)
      return res.status(400).json({ message: "You already borrowed this book." });

    // If someone else was notified from the waitlist, give them priority
    const reserved = await Request.findOne({ bookId, status: "notified", userId: { $ne: userId } });
    const current  = await Book.findById(bookId).select("availableCopies");
    if (!current) return res.status(404).json({ message: "Book not found." });
    if (reserved && current.availableCopies <= 1) {
      const fresh = reserved.notifiedAt && (Date.now() - new Date(reserved.notifiedAt)) < 2 * DAY;
      if (fresh) return res.status(400).json({ message: "This copy is reserved for the next student on the waitlist. Join the waitlist to get notified." });
    }

    // Atomic decrement — two students clicking "Borrow" on the last copy at the
    // same time can no longer push availableCopies below zero.
    const book = await Book.findOneAndUpdate(
      { _id: bookId, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1, totalBorrows: 1 }, $set: { lastBorrowed: new Date() } },
      { returnDocument: "after" }
    );
    if (!book)
      return res.status(400).json({ message: "This book is not available right now." });

    const dueDate = new Date(Date.now() + BORROW_DAYS * DAY);
    const borrow  = await new Borrow({ userId, bookId, dueDate }).save();

    // Close this student's waitlist entry, and expire a stale reservation
    await Request.updateMany(
      { userId, bookId, status: { $in: ["waiting", "notified"] } },
      { status: "fulfilled" }
    );

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

    // Don't make the student wait for Gmail — send in the background
    if (user?.email) {
      sendBorrowConfirmation({
        to: user.email, studentName: user.name,
        book: { title: book.title, author: book.author, category: book.category, isbn: book.isbn },
        borrowDate: borrow.borrowDate, dueDate,
      }).catch(emailErr => console.error("⚠ Email failed:", emailErr.message));
    }

    res.json({ message: "Book borrowed successfully.", dueDate });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/borrow/return — the borrower, or staff on their behalf
router.post("/return", verifyToken, async (req, res) => {
  try {
    const { borrowId } = req.body;
    if (!borrowId)
      return res.status(400).json({ message: "borrowId is required." });

    const existing = await Borrow.findById(borrowId);
    if (!existing || existing.returned)
      return res.status(400).json({ message: "Invalid borrow record." });
    if (!isStaff(req) && String(existing.userId) !== String(req.user.id))
      return res.status(403).json({ message: "You can only return your own books." });

    // Atomic flip so a double-click can't return (and increment stock) twice
    const record = await Borrow.findOneAndUpdate(
      { _id: borrowId, returned: false },
      { returned: true, returnDate: new Date() },
      { returnDocument: "after" }
    ).populate("bookId").populate("userId", "name role");
    if (!record) return res.status(400).json({ message: "This book was already returned." });

    const fine = fineFor(record);

    const book = record.bookId
      ? await Book.findByIdAndUpdate(record.bookId._id, { $inc: { availableCopies: 1 } }, { returnDocument: "after" })
      : null;

    if (book) {
      // Expire reservations older than 2 days so the queue keeps moving
      await Request.updateMany(
        { bookId: book._id, status: "notified", notifiedAt: { $lt: new Date(Date.now() - 2 * DAY) } },
        { status: "cancelled" }
      );

      // Waitlist — notify next in queue
      const nextInQueue = await Request.findOne({
        bookId: book._id, status: "waiting",
      }).sort({ position: 1 }).populate("userId", "name email");

      if (nextInQueue?.userId) {
        nextInQueue.status     = "notified";
        nextInQueue.notifiedAt = new Date();
        await nextInQueue.save();
        await createNotification({
          userId: nextInQueue.userId._id, type: "BOOK_AVAILABLE",
          title: "Your waitlisted book is ready!", bookId: book._id,
          message: `"${book.title}" is now available and held for you for 48 hours.`,
        });
      }

      // ── Wishlist alerts ───────────────────────────────────
      const wishlisted = await Favourite.find({ bookId: book._id }).select("userId");
      for (const fav of wishlisted) {
        if (!fav.userId) continue;
        if (String(fav.userId) === String(record.userId?._id)) continue;
        if (nextInQueue && String(fav.userId) === String(nextInQueue.userId?._id)) continue;
        await createNotification({
          userId: fav.userId, type: "BOOK_AVAILABLE",
          title: "Wishlist Book Available! ❤️", bookId: book._id,
          message: `"${book.title}" from your wishlist is now available to borrow!`,
        });
      }
    }

    const title = record.bookId?.title || "the book";
    await createNotification({
      userId: record.userId._id, type: "RETURN_CONFIRMED",
      title: "Return Confirmed", bookId: record.bookId?._id || null,
      message: fine > 0
        ? `You returned "${title}". Late fine: ₹${fine}.`
        : `You returned "${title}" on time. Thanks!`,
    });

    await createAuditLog({
      userId: record.userId._id, userName: record.userId.name,
      userRole: record.userId.role, action: "RETURN_BOOK",
      entity: title, entityId: record.bookId?._id,
      details: `Returned "${title}"${fine > 0 ? ` — fine ₹${fine}` : ""}`,
    });

    res.json({ message: fine > 0 ? `Book returned. Late fine: ₹${fine}.` : "Book returned successfully.", fine });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    if (!isStaff(req) && String(record.userId?._id) !== String(req.user.id))
      return res.status(403).json({ message: "You can only renew your own books." });
    if (record.renewed)
      return res.status(400).json({ message: "This book has already been renewed once." });
    if (new Date(record.dueDate) < new Date())
      return res.status(400).json({ message: "Overdue books cannot be renewed." });

    const waiting = await Request.countDocuments({ bookId: record.bookId?._id, status: "waiting" });
    if (waiting > 0)
      return res.status(400).json({ message: `Can't renew — ${waiting} student${waiting === 1 ? " is" : "s are"} waiting for this book.` });

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
    res.status(500).json({ message: err.message });
  }
});

// GET /api/borrow/mybooks/:userId — own records only (staff can view anyone)
router.get("/mybooks/:userId", verifyToken, selfOrStaff(), async (req, res) => {
  try {
    const records = await Borrow.find({ userId: req.params.userId, returned: false })
      .populate("bookId")
      .sort({ dueDate: 1 });
    res.json(records.filter(r => r.bookId)); // skip records whose book was deleted
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/borrow/history/:userId
router.get("/history/:userId", verifyToken, selfOrStaff(), async (req, res) => {
  try {
    const records = await Borrow.find({ userId: req.params.userId, returned: true })
      .populate("bookId")
      .sort({ returnDate: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/borrow/all — staff (admin + librarian)
router.get("/all", verifyStaff, async (req, res) => {
  try {
    const records = await Borrow.find()
      .populate("bookId")
      .populate("userId", "name email")
      .sort({ borrowDate: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
