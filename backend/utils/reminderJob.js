const cron   = require("node-cron");
const Borrow = require("../models/Borrow");
const { sendDueReminder, sendOverdueAlert } = require("./mailer");
const { createNotification }               = require("./notify");

function startReminderJob() {
  cron.schedule("0 9 * * *", async () => {
    console.log("⏰ Running daily reminder job:", new Date().toLocaleString());
    await processDueReminders();
    await processOverdueAlerts();
  });
  console.log("✅ Daily reminder cron job scheduled (runs at 9:00 AM)");
}

async function processDueReminders() {
  try {
    const tomorrow        = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfTomorrow = new Date(tomorrow);
    startOfTomorrow.setHours(0, 0, 0, 0);
    const endOfTomorrow   = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    const records = await Borrow.find({
      returned: false,
      dueDate: { $gte: startOfTomorrow, $lte: endOfTomorrow }
    })
      .populate("userId",  "name email")
      .populate("bookId",  "title author category isbn");

    if (!records.length) { console.log("📭 No due-tomorrow reminders."); return; }

    // Group by user
    const byUser = records.reduce((acc, r) => {
      const uid = r.userId._id.toString();
      if (!acc[uid]) acc[uid] = { user: r.userId, books: [], ids: [] };
      acc[uid].books.push({ ...r.bookId._doc, dueDate: r.dueDate });
      acc[uid].ids.push(r.bookId._id);
      return acc;
    }, {});

    for (const { user, books, ids } of Object.values(byUser)) {
      // Email
      try {
        await sendDueReminder({ to: user.email, studentName: user.name, books });
        console.log(`📧 Due reminder sent to: ${user.email}`);
      } catch (err) {
        console.error(`❌ Email failed for ${user.email}:`, err.message);
      }
      // In-app notification (one per book)
      for (let i = 0; i < books.length; i++) {
        await createNotification({
          userId:  user._id,
          type:    "BOOK_OVERDUE",
          title:   "Due Tomorrow!",
          message: `"${books[i].title}" is due tomorrow. Please return it on time.`,
          bookId:  ids[i],
        });
      }
    }
  } catch (err) {
    console.error("❌ processDueReminders error:", err.message);
  }
}

async function processOverdueAlerts() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const records = await Borrow.find({ returned: false, dueDate: { $lt: today } })
      .populate("userId", "name email")
      .populate("bookId", "title author category isbn");

    if (!records.length) { console.log("📭 No overdue alerts."); return; }

    const byUser = records.reduce((acc, r) => {
      const uid = r.userId._id.toString();
      if (!acc[uid]) acc[uid] = { user: r.userId, books: [], ids: [] };
      acc[uid].books.push({ ...r.bookId._doc, dueDate: r.dueDate });
      acc[uid].ids.push(r.bookId._id);
      return acc;
    }, {});

    for (const { user, books, ids } of Object.values(byUser)) {
      // Email
      try {
        await sendOverdueAlert({ to: user.email, studentName: user.name, books });
        console.log(`📧 Overdue alert sent to: ${user.email}`);
      } catch (err) {
        console.error(`❌ Email failed for ${user.email}:`, err.message);
      }
      // In-app notification
      for (let i = 0; i < books.length; i++) {
        const daysLate = Math.ceil((new Date() - new Date(books[i].dueDate)) / (1000 * 60 * 60 * 24));
        const fine     = daysLate * 5;
        await createNotification({
          userId:  user._id,
          type:    "BOOK_OVERDUE",
          title:   "Book Overdue!",
          message: `"${books[i].title}" is ${daysLate} day${daysLate !== 1 ? "s" : ""} overdue. Fine so far: ₹${fine}.`,
          bookId:  ids[i],
        });
      }
    }
  } catch (err) {
    console.error("❌ processOverdueAlerts error:", err.message);
  }
}

module.exports = { startReminderJob, processDueReminders, processOverdueAlerts };