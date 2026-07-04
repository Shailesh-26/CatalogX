const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bookId:   { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  rating:   { type: Number, required: true, min: 1, max: 5 },
  comment:  { type: String, trim: true, maxlength: 500, default: "" },
}, { timestamps: true });

// One review per student per book
reviewSchema.index({ userId: 1, bookId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);