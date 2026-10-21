const express  = require("express");
const router   = express.Router();
const Request  = require("../models/Request");
const Book     = require("../models/Book");
const { verifyToken, verifyStaff, selfOrStaff } = require("../middleware/authMiddleware");

// GET /api/requests/all-queues — admin: all books with active waitlists
router.get("/all-queues", verifyStaff, async (req, res) => {
  try {
    // One query (was: an aggregate + one extra query per book)
    const active = await Request.find({ status: { $in: ["waiting", "notified"] } })
      .populate("userId", "name email")
      .populate("bookId", "title author availableCopies")
      .sort({ position: 1 });

    const byBook = new Map();
    for (const r of active) {
      if (!r.bookId) continue; // book deleted
      const key = String(r.bookId._id);
      if (!byBook.has(key)) byBook.set(key, {
        bookId: r.bookId._id, bookTitle: r.bookId.title, bookAuthor: r.bookId.author,
        availableCopies: r.bookId.availableCopies, students: [],
      });
      const q = byBook.get(key);
      q.students.push({
        _id: r._id, name: r.userId?.name || "Unknown", email: r.userId?.email || "",
        position: q.students.length + 1, status: r.status, joinedAt: r.createdAt,
      });
    }
    const queues = [...byBook.values()]
      .map(q => ({ ...q, waitingCount: q.students.length }))
      .sort((a, b) => b.waitingCount - a.waitingCount);

    res.json(queues);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/requests/book/:bookId — waitlist for a book (staff only: it contains student emails)
router.get("/book/:bookId", verifyStaff, async (req, res) => {
  try {
    const requests = await Request.find({
      bookId: req.params.bookId,
      status: "waiting",
    })
      .populate("userId", "name email")
      .sort({ position: 1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/requests/user/:userId
router.get("/user/:userId", verifyToken, selfOrStaff(), async (req, res) => {
  try {
    const requests = await Request.find({
      userId: req.params.userId,
      status: { $in: ["waiting", "notified"] },
    })
      .populate("bookId", "title author category")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/requests/check/:bookId/:userId
router.get("/check/:bookId/:userId", verifyToken, selfOrStaff(), async (req, res) => {
  try {
    const request = await Request.findOne({
      bookId: req.params.bookId,
      userId: req.params.userId,
      status: { $in: ["waiting", "notified"] },
    });
    // Live position = how many people are ahead + 1 (stored position never shrinks)
    let livePosition = null;
    if (request?.status === "waiting") {
      livePosition = 1 + await Request.countDocuments({
        bookId: req.params.bookId, status: "waiting", position: { $lt: request.position },
      });
    }
    res.json({
      onWaitlist: !!request,
      request: request ? { ...request.toObject(), position: livePosition ?? request.position } : null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/requests/join
router.post("/join", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;           // never trust userId from the body
    const { bookId } = req.body;
    if (!bookId)
      return res.status(400).json({ message: "bookId is required." });
    if (req.user.role !== "student")
      return res.status(403).json({ message: "Only students can join a waitlist." });

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Book not found." });
    if (book.availableCopies > 0)
      return res.status(400).json({ message: "This book is available — you can borrow it directly!" });

    const existing = await Request.findOne({
      userId, bookId, status: { $in: ["waiting", "notified"] }
    });
    if (existing)
      return res.status(400).json({ message: "You are already on the waitlist for this book." });

    const lastInQueue = await Request.findOne({ bookId }).sort({ position: -1 });
    const position    = lastInQueue ? lastInQueue.position + 1 : 1;

    // The unique (userId, bookId) index means an old cancelled/fulfilled entry
    // used to make re-joining crash with a duplicate-key error. Reuse it instead.
    await Request.findOneAndUpdate(
      { userId, bookId },
      { status: "waiting", position, notifiedAt: null },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    const ahead = await Request.countDocuments({ bookId, status: "waiting", position: { $lt: position } });
    res.json({ message: `You've joined the waitlist at position ${ahead + 1}.`, position: ahead + 1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/requests/leave/:bookId
router.delete("/leave/:bookId", verifyToken, async (req, res) => {
  try {
    await Request.findOneAndUpdate(
      { userId: req.user.id, bookId: req.params.bookId, status: { $in: ["waiting", "notified"] } },
      { status: "cancelled" }
    );
    res.json({ message: "Removed from waitlist." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;