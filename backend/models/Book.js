const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title:           { type: String, required: true, trim: true },
  author:          { type: String, required: true, trim: true },
  isbn:            { type: String, required: true, trim: true },
  availableCopies: { type: Number, required: true, min: 0 },
  category: {
    type: String,
    required: true,
    trim: true
  },
  tags:            { type: [String], default: [] },
  coverImage:      { type: String,  default: null },
  totalBorrows:    { type: Number,  default: 0 },
  lastBorrowed:    { type: Date,    default: null },
  aiSummary:       { type: Object,  default: null }, // cached AI summary
  aiSummarizedAt:  { type: Date,    default: null }, // when it was cached
}, { timestamps: true });

module.exports = mongoose.model("Book", bookSchema);