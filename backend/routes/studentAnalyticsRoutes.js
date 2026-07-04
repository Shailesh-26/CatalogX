const express = require("express");
const router  = express.Router();
const Borrow  = require("../models/Borrow");
const Review  = require("../models/Review");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/:userId", verifyToken, async (req, res) => {
  try {
    const userId   = req.params.userId;
    const borrows  = await Borrow.find({ userId }).populate("bookId");
    const reviews  = await Review.find({ userId });
    const returned = borrows.filter(b => b.returned);

    const catCounts = borrows.reduce((acc, b) => {
      const cat = b.bookId?.category;
      if (cat) acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    const favouriteCategory = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const avgRating = reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    const lateReturns = returned.filter(b =>
      b.returnDate && b.dueDate && new Date(b.returnDate) > new Date(b.dueDate)
    ).length;

    const totalFines = returned.reduce((sum, b) => {
      if (!b.returnDate || !b.dueDate) return sum;
      const ret = new Date(b.returnDate);
      const due = new Date(b.dueDate);
      if (ret <= due) return sum;
      return sum + Math.ceil((ret - due) / (1000 * 60 * 60 * 24)) * 5;
    }, 0);

    const streak   = calcStreak(borrows);
    const heatmap  = buildHeatmap(borrows);

    const categoriesRead = Object.entries(catCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      totalBorrowed:     borrows.length,
      totalReturned:     returned.length,
      currentlyBorrowed: borrows.filter(b => !b.returned).length,
      favouriteCategory,
      categoriesRead,
      avgRating,
      reviewsWritten:    reviews.length,
      lateReturns,
      totalFines,
      streak,
      heatmap,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function calcStreak(borrows) {
  if (!borrows.length) return { current: 0, longest: 0, lastActivity: null };

  const fmt = (d) =>
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

  const daySet = new Set(borrows.map(b => fmt(new Date(b.borrowDate))));
  const sorted = [...daySet].sort().reverse();
  if (!sorted.length) return { current: 0, longest: 0, lastActivity: null };

  const now  = new Date();
  const todayStr     = fmt(now);
  const yd = new Date(now); yd.setDate(now.getDate() - 1);
  const yesterdayStr = fmt(yd);

  const isActive = sorted[0] === todayStr || sorted[0] === yesterdayStr;

  let temp = 1, longest = 0;
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round(
      (new Date(sorted[i-1]) - new Date(sorted[i])) / (1000*60*60*24)
    );
    if (diff === 1) { temp++; }
    else { longest = Math.max(longest, temp); temp = 1; }
  }
  longest = Math.max(longest, temp);

  return {
    current:      isActive ? temp : 0,
    longest,
    lastActivity: sorted[0],
  };
}

function buildHeatmap(borrows) {
  // ── 1. Count borrows per day ──────────────────────────────
  const fmt = (d) =>
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

  const counts = {};
  borrows.forEach(b => {
    const key = fmt(new Date(b.borrowDate));
    counts[key] = (counts[key] || 0) + 1;
  });

  // ── 2. Anchor to today; grid ends at Saturday of current week ──
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Saturday of this week
  const gridEnd = new Date(today);
  gridEnd.setDate(today.getDate() + (6 - today.getDay()));

  // Sunday 52 weeks before gridEnd = start of grid
  const gridStart = new Date(gridEnd);
  gridStart.setDate(gridEnd.getDate() - 52 * 7 - 6); // exactly 53 weeks back (Sunday)
  // make sure it's a Sunday
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  // ── 3. Build week columns ─────────────────────────────────
  const weeks = [];
  const cur   = new Date(gridStart);

  while (cur <= gridEnd) {
    const week = [];
    for (let dow = 0; dow < 7; dow++) {
      const day = new Date(cur);
      day.setDate(cur.getDate() + dow);

      if (day > today) {
        week.push(null); // future
      } else {
        const key = fmt(day);
        week.push({ date: key, count: counts[key] || 0 });
      }
    }
    weeks.push(week);
    cur.setDate(cur.getDate() + 7);
  }

  // ── 4. Build monthInfo AFTER weeks are built ──────────────
  // Walk every week; look at Sunday (index 0) of that week to decide month label.
  // A new label appears when the month changes relative to the previous label.
  const monthInfo = [];
  let lastMonth   = -1;

  weeks.forEach((week, wi) => {
    // Use the first non-null day of the week to determine the month
    const firstDay = week.find(d => d !== null);
    if (!firstDay) return;

    const d     = new Date(firstDay.date);
    const month = d.getMonth();

    // Also check if month-1 crosses into this week (1st of month falls mid-week)
    // We want the label at the column where the 1st of a month appears.
    // Find if any day in this week is the 1st of a month.
    let labelDay = null;
    for (const cell of week) {
      if (!cell) continue;
      const cd = new Date(cell.date);
      if (cd.getDate() === 1) { labelDay = cd; break; }
    }

    if (labelDay) {
      const lm = labelDay.getMonth();
      if (lm !== lastMonth) {
        monthInfo.push({
          label:     labelDay.toLocaleString("en-US", { month: "short" }),
          weekIndex: wi,
        });
        lastMonth = lm;
      }
    } else if (wi === 0) {
      // First week — always add a label
      monthInfo.push({
        label:     d.toLocaleString("en-US", { month: "short" }),
        weekIndex: 0,
      });
      lastMonth = month;
    }
  });

  return { weeks, counts, monthInfo };
}

module.exports = router;