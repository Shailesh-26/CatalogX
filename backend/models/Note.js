const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bookId:   { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  borrowId: { type: mongoose.Schema.Types.ObjectId, ref: "Borrow", required: true },
  content:  { type: String, required: true, trim: true, maxlength: 1000 },
}, { timestamps: true });

// One note per borrow record
noteSchema.index({ borrowId: 1 }, { unique: true });

module.exports = mongoose.model("Note", noteSchema);