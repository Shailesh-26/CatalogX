const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bookId:    { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  status: {
    type: String,
    enum: ["waiting", "notified", "fulfilled", "cancelled"],
    default: "waiting",
  },
  position:  { type: Number, required: true },
  notifiedAt: { type: Date, default: null },
}, { timestamps: true });

// One active request per student per book
requestSchema.index({ userId: 1, bookId: 1 }, { unique: true });

module.exports = mongoose.model("Request", requestSchema);