const mongoose = require("mongoose");

// Escape user input before putting it inside a MongoDB $regex.
// Without this, a search like "c++" or "(" throws a 500 error.
function escapeRegex(str = "") {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Clamp pagination params so ?limit=100000 can't dump the whole collection
function getPaging(query, defLimit = 9, maxLimit = 50) {
  const page  = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit) || defLimit, 1), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}

// Normalise tags coming from either JSON body (array) or multipart (JSON string)
function parseTags(tags) {
  if (!tags) return [];
  let arr = tags;
  if (typeof tags === "string") {
    try { arr = JSON.parse(tags); } catch { arr = tags.split(","); }
  }
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr.map(t => String(t).trim().toLowerCase()).filter(Boolean))].slice(0, 8);
}

module.exports = { escapeRegex, isValidId, getPaging, parseTags };
