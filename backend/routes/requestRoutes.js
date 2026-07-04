const express  = require("express");
const router   = express.Router();
const Request  = require("../models/Request");
const Book     = require("../models/Book");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// GET /api/requests/all-queues — admin: all books with active waitlists
router.get("/all-queues", verifyAdmin, async (req, res) => {
  try {
    // Get all waiting/notified requests grouped by book
    const pipeline = [
      { $match: { status: { $in: ["waiting", "notified"] } } },
      {
        $group: {
          _id: "$bookId",
          waitingCount: { $sum: 1 },
          requests: { $push: "$$ROOT" }
        }
      },
      { $sort: { waitingCount: -1 } },
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "book"
        }
      },
      { $unwind: "$book" },
      {
        $lookup: {
          from: "users",
          localField: "requests.userId",
          foreignField: "_id",
          as: "users"
        }
      }
    ];

    const raw = await Request.aggregate(pipeline);

    // Shape the response cleanly
    const queues = await Promise.all(raw.map(async (item) => {
      const requests = await Request.find({
        bookId: item._id,
        status: { $in: ["waiting", "notified"] }
      })
        .populate("userId", "name email")
        .sort({ position: 1 });

      return {
        bookId:     item._id,
        bookTitle:  item.book.title,
        bookAuthor: item.book.author,
        waitingCount: requests.length,
        students: requests.map(r => ({
          _id:      r._id,
          name:     r.userId?.name || "Unknown",
          email:    r.userId?.email || "",
          position: r.position,
          status:   r.status,
          joinedAt: r.createdAt,
        }))
      };
    }));

    res.json(queues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/requests/book/:bookId — get waitlist for a book
router.get("/book/:bookId", verifyToken, async (req, res) => {
  try {
    const requests = await Request.find({
      bookId: req.params.bookId,
      status: "waiting",
    })
      .populate("userId", "name email")
      .sort({ position: 1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/requests/user/:userId
router.get("/user/:userId", verifyToken, async (req, res) => {
  try {
    const requests = await Request.find({
      userId: req.params.userId,
      status: { $in: ["waiting", "notified"] },
    })
      .populate("bookId", "title author category")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/requests/check/:bookId/:userId
router.get("/check/:bookId/:userId", verifyToken, async (req, res) => {
  try {
    const request = await Request.findOne({
      bookId: req.params.bookId,
      userId: req.params.userId,
      status: { $in: ["waiting", "notified"] },
    });
    res.json({ onWaitlist: !!request, request: request || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/requests/join
router.post("/join", verifyToken, async (req, res) => {
  try {
    const { userId, bookId } = req.body;
    if (!userId || !bookId)
      return res.status(400).json({ message: "userId and bookId are required." });

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Book not found." });
    if (book.availableCopies > 0)
      return res.status(400).json({ message: "This book is available — you can borrow it directly!" });

    const existing = await Request.findOne({
      userId, bookId, status: { $in: ["waiting", "notified"] }
    });
    if (existing)
      return res.status(400).json({ message: "You are already on the waitlist for this book." });

    const lastInQueue = await Request.findOne({ bookId, status: "waiting" }).sort({ position: -1 });
    const position    = lastInQueue ? lastInQueue.position + 1 : 1;
    await new Request({ userId, bookId, position }).save();

    res.json({ message: `You've joined the waitlist at position ${position}.`, position });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/requests/leave/:bookId
router.delete("/leave/:bookId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.body;
    await Request.findOneAndUpdate(
      { userId, bookId: req.params.bookId, status: "waiting" },
      { status: "cancelled" }
    );
    res.json({ message: "Removed from waitlist." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;