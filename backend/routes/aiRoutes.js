const express        = require("express");
const router         = express.Router();
const Book           = require("../models/Book");
const Borrow         = require("../models/Borrow");
const { verifyToken } = require("../middleware/authMiddleware");
const { generateContent } = require("../utils/gemini");

// POST /api/ai/summary/:bookId
router.post("/summary/:bookId", verifyToken, async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);
    if (!book) return res.status(404).json({ message: "Book not found." });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (book.aiSummary && book.aiSummarizedAt > thirtyDaysAgo) {
      return res.json({ summary: book.aiSummary, cached: true });
    }

    const prompt = `
You are a helpful library assistant. Generate a structured summary for the book titled "${book.title}" by ${book.author} in the ${book.category} genre.

Respond ONLY with a valid JSON object in this exact format (no markdown, no backticks, no extra text):
{
  "overview": "2-3 sentence overview of what the book is about",
  "themes": "1-2 sentences about the main themes or ideas explored",
  "bestFor": "1 sentence describing who would enjoy this book most",
  "mood": ["tag1", "tag2", "tag3"],
  "readingTime": "estimated reading time e.g. 6-8 hours",
  "difficulty": "Easy / Moderate / Advanced"
}

Mood tags should be 2-4 short descriptive words from this list: Thought-provoking, Inspiring, Fast read, Dense, Emotional, Adventurous, Educational, Relaxing, Intense, Humorous, Dark, Uplifting.
    `.trim();

    const raw = await generateContent(prompt);
    let summary;
    try {
      summary = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      summary = {
        overview: raw.slice(0, 300),
        themes: "Could not parse themes.",
        bestFor: "All readers.",
        mood: ["Informative"],
        readingTime: "Unknown",
        difficulty: "Moderate",
      };
    }

    book.aiSummary      = summary;
    book.aiSummarizedAt = new Date();
    await book.save();

    res.json({ summary, cached: false });
  } catch (err) {
    console.error("AI summary error:", err.message);
    res.status(500).json({ message: "AI summary failed. Please try again." });
  }
});

// POST /api/ai/recommendations
router.post("/recommendations", verifyToken, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId required." });

    const history = await Borrow.find({ userId })
      .populate("bookId", "title author category")
      .sort({ createdAt: -1 })
      .limit(10);

    const borrowedIds = history.map(r => r.bookId?._id?.toString()).filter(Boolean);
    const allBooks    = await Book.find({}, "title author category availableCopies totalBorrows coverImage");

    // ── DB-driven recommendations (no AI) ────────────────────
    if (history.length === 0) {
      const popular = await Book.find({ availableCopies: { $gt: 0 } })
        .sort({ totalBorrows: -1 }).limit(4);
      return res.json({ recommendations: popular, basis: "popular", message: "Borrow some books first!" });
    }

    // Get favourite categories from history
    const catCounts = history.reduce((acc, r) => {
      const cat = r.bookId?.category;
      if (cat) acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    const topCats = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([cat]) => cat);

    // DB-driven: books from favourite categories not yet borrowed
    const dbRecs = await Book.find({
      category:        { $in: topCats },
      _id:             { $nin: borrowedIds },
      availableCopies: { $gt: 0 },
    })
      .sort({ totalBorrows: -1 })
      .limit(4);

    // If enough DB recs found, skip AI
    if (dbRecs.length >= 3) {
      return res.json({
        recommendations: dbRecs,
        basis:   "db",
        basedOn: history.slice(0, 3).map(r => r.bookId?.title).filter(Boolean),
      });
    }

    // ── AI recommendations (when DB isn't enough) ─────────────
    const catalogueTitles = allBooks.map(b => `"${b.title}" by ${b.author}`).join(", ");
    const borrowedTitles  = history.filter(r => r.bookId)
      .map(r => `"${r.bookId.title}" by ${r.bookId.author} (${r.bookId.category})`).join(", ");

    const prompt = `
You are a library recommendation engine.
A student has read: ${borrowedTitles}
From this catalogue, recommend exactly 4 books: ${catalogueTitles}
Rules: Only recommend books from the catalogue. Do not recommend already-read books.
Respond ONLY with a JSON array of exactly 4 titles: ["Title One", "Title Two", "Title Three", "Title Four"]
    `.trim();

    const raw = await generateContent(prompt);
    let recommendedTitles;
    try {
      recommendedTitles = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      const popular = await Book.find({ availableCopies: { $gt: 0 }, _id: { $nin: borrowedIds } })
        .sort({ totalBorrows: -1 }).limit(4);
      return res.json({ recommendations: popular, basis: "popular" });
    }

    const aiRecs = allBooks.filter(book =>
      recommendedTitles.some(t =>
        book.title.toLowerCase().includes(t.toLowerCase()) ||
        t.toLowerCase().includes(book.title.toLowerCase())
      ) && !borrowedIds.includes(book._id.toString())
    ).slice(0, 4);

    if (aiRecs.length < 2) {
      const popular = await Book.find({ availableCopies: { $gt: 0 }, _id: { $nin: borrowedIds } })
        .sort({ totalBorrows: -1 }).limit(4);
      return res.json({ recommendations: popular, basis: "popular" });
    }

    res.json({
      recommendations: aiRecs,
      basis:   "ai",
      basedOn: history.slice(0, 3).map(r => r.bookId?.title).filter(Boolean),
    });
  } catch (err) {
    console.error("Recommendations error:", err.message);
    res.status(500).json({ message: "Recommendations failed." });
  }
});

module.exports = router;