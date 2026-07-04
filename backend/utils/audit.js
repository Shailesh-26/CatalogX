const AuditLog = require("../models/AuditLog");

async function createAuditLog({ userId, userName, userRole, action, entity, entityId, details }) {
  try {
    await new AuditLog({ userId, userName, userRole, action, entity, entityId, details }).save();
  } catch (err) {
    // Never let audit logging crash the main request
    console.error("⚠ Audit log failed:", err.message);
  }
}

module.exports = { createAuditLog };