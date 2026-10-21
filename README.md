# 📚 CatalogX

A full-stack Smart Library Management System built with the MERN stack (MongoDB, Express, React, Node.js). CatalogX handles the complete lifecycle of a library — book cataloguing, borrowing/returns, waitlists, fines, AI-powered recommendations, and rich analytics for both students and administrators.

---

## ✨ Features

**Core**
- JWT authentication with role-based access (student / admin / librarian)
- Email verification via OTP + forgot-password flow (Nodemailer)
- Book CRUD with cover image uploads (Cloudinary)
- Borrow / return / renew workflow with fine calculation
- Waitlist queue system with position tracking and auto-notification

**Student Experience**
- Personal reading dashboard with streaks, GitHub-style reading heatmap, and category breakdown
- Achievement system (7 auto-awarded badges)
- Wishlist / favourites with return-alerts
- AI-powered book summaries and recommendations (Gemini API)
- Global navbar search across the catalogue
- "People Also Borrowed" recommendations on book pages

**Admin Tools**
- Analytics dashboard (borrow trends, active users, inventory alerts, book performance)
- CSV export (borrow logs, registered users)
- Audit logs for all major actions
- Broadcast announcements with priority levels + site-wide banner
- Staff account creation (admin/librarian)

**Platform**
- Dark mode
- Rate limiting (tiered) + Helmet.js security headers
- Public catalogue (no login required) for browsing

---

## 🛠️ Tech Stack

**Frontend:** React (Hooks), React Router DOM, Axios, Recharts, CSS Variables (no UI framework)
**Backend:** Node.js, Express, MongoDB + Mongoose, JWT, bcryptjs
**Integrations:** Cloudinary (image storage), Nodemailer (Gmail), Google Gemini API (AI features), node-cron (scheduled reminders)

---

## 📂 Project Structure

```
CatalogX/
├── backend/
│   ├── config/          # App constants (borrow limits, fines, etc.)
│   ├── middleware/       # Auth guards
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express route handlers
│   ├── utils/            # Mailer, Cloudinary, Gemini, audit/notify helpers
│   └── server.js
├── frontend/
│   └── src/
│       ├── components/   # Navbar, Sidebar, Footer, shared UI
│       ├── context/      # Toast notifications
│       ├── pages/         # Route-level views
│       ├── api.js         # Axios instance
│       └── App.js
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)
- Gmail account with an App Password (for email sending)
- Gemini API key (free, from [aistudio.google.com](https://aistudio.google.com))

### 1. Clone the repo
```bash
git clone https://github.com/<your-username>/CatalogX.git
cd CatalogX
```

### 2. Backend setup
```bash
cd backend
npm install
```
Create a `.env` file in `backend/` using `.env.example` as a template:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=your_gmail_address
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
CLIENT_URL=http://localhost:3000
```
Run the backend:
```bash
npm run dev        # or: npm start
```
Create the first admin account:
```bash
npm run seed:admin -- "Admin Name" admin@example.com StrongPass123
```

### 3. Frontend setup
Optionally create `frontend/.env` from `frontend/.env.example` (`REACT_APP_API_URL`, defaults to `http://localhost:5000`).
```bash
cd ../frontend
npm install
npm start
```

The app will be available at `http://localhost:3000`, with the API running on `http://localhost:5000`.

---

> **On Windows / VS Code?** See [HOW-TO-RUN-WINDOWS.md](HOW-TO-RUN-WINDOWS.md), or just run
> `powershell -ExecutionPolicy Bypass -File .\start-dev.ps1`. Recent fixes are listed in [CHANGES.md](CHANGES.md).

---

## 🔑 Key Business Rules

| Rule | Value |
|---|---|
| Borrow period | 3 days |
| Fine | ₹5/day overdue |
| Max active borrows | 3 books per student |
| Renewals | 1 per borrow (not allowed if overdue or if others are waiting) |
| Waitlist hold | Next student in queue gets the copy held for 48 hours |
| Overdue books | Must be returned before borrowing another |
| OTP expiry | 10 minutes |
| JWT expiry | 7 days |
| AI summary cache | 30 days |

---

## 📄 License

This project is for educational purposes as part of a final-year academic project.

---

## 🙋 Author

Built by Shailesh.