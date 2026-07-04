const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
  title:     { type: String, required: true, trim: true },
  message:   { type: String, required: true, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  priority:  { type: String, enum: ["low", "normal", "high"], default: "normal" },
}, { timestamps: true });

module.exports = mongoose.model("Announcement", announcementSchema);