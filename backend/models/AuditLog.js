const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName:   { type: String, required: true },
  userRole:   { type: String, required: true },
  action:     {
    type: String,
    required: true,
    enum: [
      "BORROW_BOOK",
      "RETURN_BOOK",
      "RENEW_BOOK",
      "ADD_BOOK",
      "EDIT_BOOK",
      "DELETE_BOOK",
      "CREATE_STAFF",
      "LOGIN",
      "SEND_ANNOUNCEMENT",
    ]
  },
  entity:     { type: String },  // e.g. book title or staff name
  entityId:   { type: mongoose.Schema.Types.ObjectId },
  details:    { type: String },  // human-readable description
}, { timestamps: true });

module.exports = mongoose.model("AuditLog", auditLogSchema);