const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    required: true,
    enum: [
      "BORROW_CONFIRMED",
      "BOOK_OVERDUE",
      "BOOK_AVAILABLE",
      "NEW_BOOK_ADDED",
      "RENEWAL_CONFIRMED",
      "RETURN_CONFIRMED",
      "ANNOUNCEMENT",
    ],
  },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  bookId:  { type: mongoose.Schema.Types.ObjectId, ref: "Book", default: null },
  read:    { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);