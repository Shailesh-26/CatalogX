// Creates (or promotes) an admin account — needed because only an admin can
// create staff, so the very first admin has to come from somewhere.
//
// Usage (from the backend folder):
//   npm run seed:admin -- "Admin Name" admin@example.com StrongPass123
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const User     = require("../models/User");

(async () => {
  const [name, emailArg, password] = process.argv.slice(2);
  if (!name || !emailArg || !password) {
    console.log('Usage: npm run seed:admin -- "Admin Name" admin@example.com StrongPass123');
    process.exit(1);
  }
  if (password.length < 6) {
    console.log("Password must be at least 6 characters.");
    process.exit(1);
  }
  const email = emailArg.trim().toLowerCase();

  await mongoose.connect(process.env.MONGO_URI);
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.findOneAndUpdate(
    { email },
    { name, email, password: hashed, role: "admin", isVerified: true, otp: null, otpExpiry: null },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );
  console.log(`✅ Admin ready: ${user.email} — log in at http://localhost:3000/login`);
  await mongoose.disconnect();
})().catch(err => {
  console.error("❌", err.message);
  process.exit(1);
});
