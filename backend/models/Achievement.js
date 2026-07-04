const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    required: true,
    enum: [
      "FIRST_BORROW",
      "BOOKWORM",
      "EXPLORER",
      "REVIEWER",
      "SPEED_READER",
      "LOYAL_READER",
      "NO_FINES",
    ],
  },
  unlockedAt: { type: Date, default: Date.now },
}, { timestamps: true });

achievementSchema.index({ userId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("Achievement", achievementSchema);