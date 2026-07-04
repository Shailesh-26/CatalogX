const Notification = require("../models/Notification");

async function createNotification({ userId, type, title, message, bookId = null }) {
  try {
    await new Notification({ userId, type, title, message, bookId }).save();
  } catch (err) {
    console.error("⚠ Notification creation failed:", err.message);
  }
}

module.exports = { createNotification };