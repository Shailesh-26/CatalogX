const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function wrapHTML(content) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
             background: #f5f7f5; color: #0f1f14; }
      .wrapper   { max-width: 580px; margin: 32px auto; }
      .header    { background: linear-gradient(135deg, #0f4025, #1a6b3c);
                   border-radius: 12px 12px 0 0; padding: 32px 36px; text-align: center; }
      .header-logo  { font-size: 2.5rem; margin-bottom: 10px; }
      .header-title { font-size: 1.3rem; font-weight: 700; color: #fff; }
      .header-sub   { font-size: 0.85rem; color: #91cfaa; margin-top: 4px; }
      .body      { background: #fff; padding: 32px 36px;
                   border: 1px solid #d4e0d7; border-top: none; }
      .greeting  { font-size: 1.1rem; font-weight: 600; color: #0f4025; margin-bottom: 16px; }
      .text      { font-size: 0.9rem; color: #4a6352; line-height: 1.7; margin-bottom: 16px; }
      .book-card { background: #edf7f0; border: 1px solid #c6e8d0;
                   border-left: 4px solid #1a6b3c; border-radius: 8px;
                   padding: 14px 18px; margin: 8px 0; }
      .book-title  { font-weight: 700; font-size: 0.95rem; color: #0f4025; }
      .book-detail { font-size: 0.82rem; color: #4a6352; margin-top: 4px; }
      .info-row  { display: flex; justify-content: space-between; padding: 10px 0;
                   border-bottom: 1px solid #d4e0d7; font-size: 0.875rem; }
      .info-label { color: #7a9485; font-weight: 600; }
      .info-value { color: #0f1f14; font-weight: 500; }
      .otp-box   { background: linear-gradient(135deg, #0f4025, #1a6b3c);
                   border-radius: 12px; padding: 28px; text-align: center; margin: 24px 0; }
      .otp-code  { font-size: 2.8rem; font-weight: 700; color: #fff;
                   letter-spacing: 0.2em; font-family: monospace; }
      .otp-expiry { font-size: 0.8rem; color: #91cfaa; margin-top: 8px; }
      .alert-box { background: #fdf0ef; border: 1px solid #f5c6c3;
                   border-left: 4px solid #c0392b; border-radius: 8px;
                   padding: 14px 18px; margin: 20px 0; }
      .alert-title { font-weight: 700; color: #7b241c; font-size: 0.9rem; }
      .alert-text  { font-size: 0.82rem; color: #7b241c; margin-top: 6px; line-height: 1.6; }
      .warning-box { background: #fef9ec; border: 1px solid #fde8aa;
                     border-left: 4px solid #f59e0b; border-radius: 8px;
                     padding: 14px 18px; margin: 20px 0; }
      .warning-title { font-weight: 700; color: #7a4e05; font-size: 0.9rem; }
      .warning-text  { font-size: 0.82rem; color: #7a4e05; margin-top: 6px; line-height: 1.6; }
      .rules     { background: #f5f7f5; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
      .rules-title { font-size: 0.8rem; font-weight: 700; text-transform: uppercase;
                     letter-spacing: 0.06em; color: #7a9485; margin-bottom: 10px; }
      .rule      { font-size: 0.83rem; color: #4a6352; line-height: 1.6;
                   padding: 4px 0; display: flex; gap: 8px; }
      .footer    { background: #f0f4f1; border: 1px solid #d4e0d7; border-top: none;
                   border-radius: 0 0 12px 12px; padding: 20px 36px; text-align: center; }
      .footer-text  { font-size: 0.78rem; color: #7a9485; line-height: 1.6; }
      .footer-brand { font-weight: 700; color: #1a6b3c; }
      .divider   { border: none; border-top: 1px solid #d4e0d7; margin: 20px 0; }
      .badge     { display: inline-block; padding: 3px 10px; border-radius: 20px;
                   font-size: 0.75rem; font-weight: 700; }
      .badge-danger  { background: #fdf0ef; color: #7b241c; }
      .badge-warning { background: #fef9ec; color: #7a4e05; }
      .badge-success { background: #edf7f0; color: #0f4025; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="header">
        <div class="header-logo">📚</div>
        <div class="header-title">CatalogX - Smart Library</div>
        <div class="header-sub">Your digital library management system</div>
      </div>
      <div class="body">${content}</div>
      <div class="footer">
        <p class="footer-text">
          This is an automated message from <span class="footer-brand">CatalogX - Smart Library</span>.<br/>
          Please do not reply to this email.
        </p>
      </div>
    </div>
  </body>
  </html>`;
}

// ── Email 1: Borrow Confirmation ──────────────────────────────
async function sendBorrowConfirmation({ to, studentName, book, borrowDate, dueDate }) {
  const html = wrapHTML(`
    <p class="greeting">Hello, ${studentName}! 👋</p>
    <p class="text">You have successfully borrowed a book from <strong>CatalogX - Smart Library</strong>.</p>
    <div class="book-card">
      <div class="book-title">📖 ${book.title}</div>
      <div class="book-detail">by ${book.author} · ${book.category}</div>
      <div class="book-detail" style="margin-top:6px;">ISBN: ${book.isbn}</div>
    </div>
    <hr class="divider"/>
    <div class="info-row">
      <span class="info-label">Borrowed On</span>
      <span class="info-value">${new Date(borrowDate).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Due Date</span>
      <span class="info-value" style="color:#1a6b3c;font-weight:700;">
        ${new Date(dueDate).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}
      </span>
    </div>
    <hr class="divider"/>
    <div class="rules">
      <div class="rules-title">📋 Library Rules & Regulations</div>
      <div class="rule"><span>📅</span><span>Books must be returned within <strong>3 days</strong> of borrowing.</span></div>
      <div class="rule"><span>💰</span><span>A fine of <strong>₹5 per day</strong> will be charged for overdue returns.</span></div>
      <div class="rule"><span>🔔</span><span>You will receive a reminder email <strong>1 day before</strong> your due date.</span></div>
      <div class="rule"><span>📚</span><span>You may borrow a maximum of <strong>3 books</strong> at a time.</span></div>
    </div>
    <p class="text" style="margin-top:20px;text-align:center;font-size:1rem;color:#1a6b3c;font-weight:600;">
      Happy Reading! 📚✨
    </p>
  `);
  await transporter.sendMail({
    from: process.env.EMAIL_FROM, to,
    subject: `📚 Borrow Confirmed — "${book.title}" | CatalogX - Smart Library`,
    html,
  });
}

// ── Email 2: Due Date Reminder ────────────────────────────────
async function sendDueReminder({ to, studentName, books }) {
  const bookList = books.map(b => `
    <div class="book-card">
      <div class="book-title">📖 ${b.title}</div>
      <div class="book-detail">by ${b.author}</div>
      <div class="book-detail" style="margin-top:6px;font-weight:600;color:#b47408;">
        Due: ${new Date(b.dueDate).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}
      </div>
    </div>`).join("");
  const html = wrapHTML(`
    <p class="greeting">Hello, ${studentName}! 👋</p>
    <p class="text">
      This is a friendly reminder that the following book${books.length > 1 ? "s are" : " is"}
      due <strong>tomorrow</strong>.
    </p>
    ${bookList}
    <div class="warning-box">
      <div class="warning-title">⏰ Return Reminder</div>
      <div class="warning-text">
        Please return your book${books.length > 1 ? "s" : ""} by <strong>tomorrow</strong> to avoid a fine
        of <strong>₹5 per day</strong> per book.
      </div>
    </div>
    <div class="rules">
      <div class="rules-title">📋 Quick Reminder</div>
      <div class="rule"><span>💰</span><span>Late fine: <strong>₹5 per day</strong> per book.</span></div>
      <div class="rule"><span>📱</span><span>Log in → My Books → click Return.</span></div>
    </div>
    <p class="text" style="text-align:center;margin-top:20px;color:#b47408;font-weight:600;">
      Please return on time — we're counting on you! 🙏
    </p>
  `);
  await transporter.sendMail({
    from: process.env.EMAIL_FROM, to,
    subject: `⏰ Due Tomorrow — Return your book${books.length > 1 ? "s" : ""} | CatalogX - Smart Library`,
    html,
  });
}

// ── Email 3: Overdue Alert ────────────────────────────────────
async function sendOverdueAlert({ to, studentName, books }) {
  const bookList = books.map(b => {
    const daysLate = Math.ceil((new Date() - new Date(b.dueDate)) / (1000 * 60 * 60 * 24));
    const fine     = daysLate * 5;
    return `
      <div class="book-card" style="background:#fdf0ef;border-color:#f5c6c3;border-left-color:#c0392b;">
        <div class="book-title" style="color:#7b241c;">📖 ${b.title}</div>
        <div class="book-detail" style="color:#c0392b;">by ${b.author}</div>
        <div style="display:flex;gap:12px;margin-top:8px;flex-wrap:wrap;">
          <span class="badge badge-danger">📅 Was due: ${new Date(b.dueDate).toLocaleDateString("en-IN", { day:"numeric", month:"short" })}</span>
          <span class="badge badge-danger">⏳ ${daysLate} day${daysLate > 1 ? "s" : ""} late</span>
          <span class="badge badge-danger">💰 Fine: ₹${fine}</span>
        </div>
      </div>`;
  }).join("");
  const totalFine = books.reduce((sum, b) => {
    const d = Math.ceil((new Date() - new Date(b.dueDate)) / (1000 * 60 * 60 * 24));
    return sum + d * 5;
  }, 0);
  const html = wrapHTML(`
    <p class="greeting">Hello, ${studentName},</p>
    <p class="text">Your borrowed book${books.length > 1 ? "s have" : " has"} passed the return due date.</p>
    ${bookList}
    <div class="alert-box">
      <div class="alert-title">🚨 Overdue Fine Notice</div>
      <div class="alert-text">
        Your current fine is <strong>₹${totalFine}</strong>.
        This increases by <strong>₹5 per book per day</strong> until returned.
      </div>
    </div>
    <p class="text" style="text-align:center;margin-top:20px;color:#c0392b;font-weight:600;">
      Please return your book${books.length > 1 ? "s" : ""} immediately! 🙏
    </p>
  `);
  await transporter.sendMail({
    from: process.env.EMAIL_FROM, to,
    subject: `🚨 Overdue Alert — ₹${totalFine} fine | CatalogX - Smart Library`,
    html,
  });
}

// ── Email 4: Email Verification OTP ──────────────────────────
async function sendVerificationOTP({ to, name, otp }) {
  const html = wrapHTML(`
    <p class="greeting">Hello, ${name}! 👋</p>
    <p class="text">
      Welcome to <strong>CatalogX - Smart Library</strong>! Please verify your email address
      to activate your account. Use the OTP below:
    </p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div class="otp-expiry">⏰ This OTP expires in 10 minutes</div>
    </div>
    <div class="alert-box">
      <div class="alert-title">⚠ Security Notice</div>
      <div class="alert-text">
        Never share this OTP with anyone. CatalogX - Smart Library staff will never ask for your OTP.
      </div>
    </div>
    <p class="text">If you did not create an account, please ignore this email.</p>
  `);
  await transporter.sendMail({
    from: process.env.EMAIL_FROM, to,
    subject: `🔐 Verify your email — CatalogX - Smart Library`,
    html,
  });
}

// ── Email 5: Password Reset OTP ───────────────────────────────
async function sendPasswordResetOTP({ to, name, otp }) {
  const html = wrapHTML(`
    <p class="greeting">Hello, ${name}!</p>
    <p class="text">
      We received a request to reset your CatalogX - Smart Library password.
      Use the OTP below to proceed:
    </p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
      <div class="otp-expiry">⏰ This OTP expires in 10 minutes</div>
    </div>
    <div class="alert-box">
      <div class="alert-title">⚠ Didn't request this?</div>
      <div class="alert-text">
        If you didn't request a password reset, your account may be at risk.
        Please contact the library admin immediately.
      </div>
    </div>
  `);
  await transporter.sendMail({
    from: process.env.EMAIL_FROM, to,
    subject: `🔑 Password Reset OTP — CatalogX - Smart Library`,
    html,
  });
}

module.exports = {
  sendBorrowConfirmation,
  sendDueReminder,
  sendOverdueAlert,
  sendVerificationOTP,
  sendPasswordResetOTP,
};