const jwt = require("jsonwebtoken");

const STAFF_ROLES = ["admin", "librarian"];

// Verify any logged-in user
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    // 401 (not 403) so the frontend knows to send the user back to login
    return res.status(401).json({ message: "Session expired. Please log in again." });
  }
};

// Verify admin role
const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required." });
    }
    next();
  });
};

// Verify admin OR librarian
const verifyStaff = (req, res, next) => {
  verifyToken(req, res, () => {
    if (!STAFF_ROLES.includes(req.user.role)) {
      return res.status(403).json({ message: "Staff access required." });
    }
    next();
  });
};

const isStaff = (req) => STAFF_ROLES.includes(req.user?.role);

// For routes like /something/:userId — a student may only access their own
// data; staff may access anyone's. Must run after verifyToken.
const selfOrStaff = (param = "userId") => (req, res, next) => {
  const target = req.params[param];
  if (isStaff(req) || String(target) === String(req.user.id)) return next();
  return res.status(403).json({ message: "You can only access your own data." });
};

module.exports = { verifyToken, verifyAdmin, verifyStaff, selfOrStaff, isStaff, STAFF_ROLES };
