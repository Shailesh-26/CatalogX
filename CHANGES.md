# What was changed (review pass)

## 🔴 Security fixes (backend)
1. **Anyone could act as any other user.** Borrow, waitlist join/leave, wishlist toggle, reviews,
   notes and AI recommendations all trusted a `userId` sent from the browser. A student could
   borrow books on someone else's account or post reviews as them. The server now always uses
   the logged-in user from the JWT (`req.user.id`).
2. **Anyone could read other students' data.** `/borrow/mybooks/:userId`, `/borrow/history/:userId`,
   `/favourites/:userId`, `/achievements/:userId`, `/student-analytics/:userId`, `/requests/user/:userId`
   etc. now only allow your own ID (staff can see anyone) via a new `selfOrStaff()` middleware.
3. **Any user could return/renew anyone's book**, and **mark-read / delete anyone's notification** — now checked.
4. **Waitlist with student names + emails** was visible to every student → now staff-only.
5. **Book edit accepted any field** (e.g. `totalBorrows: 9999`) → whitelisted fields only.
6. **Search crashed with special characters** (`c++`, `(`) and allowed regex abuse → input is escaped.
7. Login no longer reveals whether an email is registered ("Invalid email or password").
8. OTPs use `crypto.randomInt` instead of `Math.random`.
9. CORS restricted to `CLIENT_URL` (default `http://localhost:3000`) instead of every website.
10. Pagination `limit` is capped so `?limit=100000` can't dump the database.

## 🟠 Bugs fixed (backend)
- **`require("../middleware/authMiddleware")` vs file `authmiddleware.js`** — works on Windows
  but crashes on Linux/any deployment. File renamed to `authMiddleware.js`.
- **"People also borrowed" was always empty** — it queried `book`/`user` fields that don't exist (`bookId`/`userId`).
- **Re-joining a waitlist crashed** (duplicate key error from the unique index after leaving once).
- **Waitlist never progressed properly** — requests stayed `notified` forever. Now: when you borrow, your
  request becomes `fulfilled`; the notified student gets the copy held for 48h; stale holds expire; positions shown are live.
- **Race conditions** — two students borrowing the last copy at once could push stock below 0; double-clicking
  Return added a copy twice. Both are now atomic.
- **Emails, case** — `John@Gmail.com` could never log in (stored lowercase, looked up as typed). Normalised everywhere.
- **Stuck registrations** — if the OTP email failed, the account existed but couldn't be verified and
  re-registering said "Email already registered". Unverified accounts can now sign up again / resend.
- Fines were hardcoded `* 5` in 3 places → use `FINE_PER_DAY` from `config/constants.js`.
- Gemini model name `gemini-3.5-flash` hardcoded → configurable `GEMINI_MODEL` (default `gemini-2.5-flash`); retries on 429/500/503.
- Reminder cron crashed if a user/book had been deleted; now pinned to India time (`CRON_TZ`).
- Server started listening even when MongoDB failed to connect → now connects first, exits with a clear hint.
- Rate limit of 200 req/15 min was easy to hit by just browsing → 1000; strict limit now only on login/register/OTP routes (not `/profile`).
- New-book and announcement notifications are inserted in one `insertMany` instead of one query per student.
- Can't delete a book that is still borrowed; duplicate ISBNs are rejected.
- 500 errors now return `{ message }` (the frontend reads `.message`, so users saw "Please try again" instead of the real reason).
- Added `/api/health`, JSON 404 for unknown routes, central error handler.
- Removed `backend/routes/protectedRoute.js` (a React component sitting in the backend); moved `test.js` / `listModels.js` to `backend/scripts/`.

## 🟠 Bugs fixed (frontend)
- **Every "admin only" page was open to students.** `App.js` passed `roleRequired="admin"` but
  `ProtectedRoute` reads `roles` — the check never ran. Fixed for all routes.
- **Librarian role was completely broken** — login sent them to `/librarian-home`, which had no route
  (blank page), no sidebar links, and the backend blocked them from books/logs. Librarians now get their
  own dashboard and can add/edit books, see borrow logs, check books in and manage waitlists. Admin-only:
  analytics home, audit logs, announcements, create staff.
- Hardcoded `http://localhost:5000` in 7 files → `REACT_APP_API_URL` in `frontend/.env`.
- Expired/invalid token now sends you to login with a "session expired" message (backend returns 401, not 403).
- Logging out wiped your dark-mode setting (`localStorage.clear()`) → only auth keys are cleared.
- After login you return to the page you originally tried to open.
- `package-lock.json` was out of sync with `package.json` (`npm ci` failed).
- Fixed all ESLint warnings (the production build failed under `CI=true`).

## 🟢 UI / UX improvements
- Catalogue: wishlist hearts load with **1 request instead of 1 per book**; out-of-stock books show
  **"Join waitlist"** instead of a dead disabled button; books you already have show **"✓ Borrowed"**;
  categories like "Biography" that exist in the DB now appear in the filter.
- Borrow logs: staff **"↩ Check in"** button; fines shown for late *returned* books too; CSV opens correctly in Excel (₹ and names).
- Return shows the late fine; renew blocked when others are waiting; can't borrow while you have overdue books.
- New **404 page**; `/` goes to the public catalogue when logged out.
- Login: show/hide password, autofocus, clear "server not reachable" message.
- Mobile: login form no longer floats mid-screen, navbar "Log in" no longer wraps, icon-only theme toggle on phones.
- Announcement banner only shows announcements from the last 14 days; `ANNOUNCEMENT` notifications get an icon.
- Notifications stop polling while the tab is in the background.
- Visible keyboard focus outline; aria-labels on icon buttons; favicon + theme colour (old ones pointed at missing files).
- Removed unused `StudentHome.js`.

## New files
- `HOW-TO-RUN-WINDOWS.md` — PowerShell run guide
- `start-dev.ps1` — starts backend + frontend in two windows
- `backend/scripts/createAdmin.js` — `npm run seed:admin -- "Name" email password`
- `backend/utils/helpers.js`, `frontend/src/auth.js`, `frontend/src/pages/NotFound.js`
- `frontend/.env.example`

## Worth doing next (not done)
- The JWT lives in `localStorage`; an httpOnly cookie is safer against XSS.
- Real tests (Jest + supertest) — I verified the backend with a 44-check script, but it isn't part of the repo.
- `index.css` is 1,300 lines and many pages use large inline styles; splitting per component would help maintenance.
