const express   = require("express");
const router    = express.Router();
const AuditLog  = require("../models/AuditLog");
const { verifyAdmin } = require("../middleware/authMiddleware");

// GET /api/audit?page=1&limit=20&action=&search=
router.get("/", verifyAdmin, async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 20;
    const action = req.query.action || "";
    const search = req.query.search || "";

    const query = {};
    if (action && action !== "ALL") query.action = action;
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: "i" } },
        { entity:   { $regex: search, $options: "i" } },
        { details:  { $regex: search, $options: "i" } },
      ];
    }

    const total = await AuditLog.countDocuments(query);
    const logs  = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      logs,
      pagination: {
        total, page, limit,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;