const jwt = require("jsonwebtoken");

// Verify any logged-in user
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token." });
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

const verifyStaff = (req, res, next) => {
  verifyToken(req, res, () => {

    if (
      req.user.role !== "admin" &&
      req.user.role !== "librarian"
    ) {
      return res.status(403).json({
        message: "Staff access required."
      });
    }

    next();
  });
};

module.exports = { verifyToken, verifyAdmin, verifyStaff };