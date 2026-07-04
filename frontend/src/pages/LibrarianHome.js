import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

function LibrarianHome() {
  const [books, setBooks] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
  api.get("/api/books/all"),
  api.get("/api/borrow/all")
])
  .then(([booksRes, borrowRes]) => {

    if (booksRes.status === "fulfilled") {
      setBooks(booksRes.value.data);
    }

    if (borrowRes.status === "fulfilled") {
      setRecords(borrowRes.value.data);
    }

  })
  .finally(() => setLoading(false));
  }, []);

  const totalBooks = books.length;

  const availableBooks = books.reduce(
    (sum, b) => sum + b.availableCopies,
    0
  );

  const activeBorrows = records.filter(
    r => !r.returned
  ).length;

  const overdueBooks = records.filter(
    r => !r.returned && new Date(r.dueDate) < new Date()
  ).length;

  const recentBooks = [...books]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="page-wrapper">
      <h1 className="page-title">Librarian Dashboard</h1>
      <p className="page-subtitle">
        Manage books, monitor borrowing activity and keep the library organized.
      </p>

      <div className="stat-grid">
        <div className="stat-card stat-card--info">
          <span className="stat-label">Total Books</span>
          <span className="stat-value">{totalBooks}</span>
        </div>

        <div className="stat-card stat-card--green">
          <span className="stat-label">Available Copies</span>
          <span className="stat-value">{availableBooks}</span>
        </div>

        <div className="stat-card stat-card--warning">
          <span className="stat-label">Active Borrows</span>
          <span className="stat-value">{activeBorrows}</span>
        </div>

        <div className="stat-card stat-card--danger">
          <span className="stat-label">Overdue Books</span>
          <span className="stat-value">{overdueBooks}</span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: "16px",
          marginTop: "24px"
        }}
      >
        <Link to="/books" className="card">
          <h3>📚 Browse Books</h3>
          <p>View and manage the complete catalogue.</p>
        </Link>

        <Link to="/add" className="card">
          <h3>➕ Add Book</h3>
          <p>Add a new book to the library collection.</p>
        </Link>

        <Link to="/borrow" className="card">
          <h3>📋 Borrow Records</h3>
          <p>Track all borrowing activity.</p>
        </Link>
      </div>

      <div
        className="card"
        style={{ marginTop: "24px" }}
      >
        <h3 style={{ marginBottom: "16px" }}>
          Recently Added Books
        </h3>

        {recentBooks.length === 0 ? (
          <p>No books available.</p>
        ) : (
          recentBooks.map(book => (
            <div
              key={book._id}
              style={{
                padding: "10px 0",
                borderBottom: "1px solid var(--border)"
              }}
            >
              <strong>{book.title}</strong>
              <div style={{ fontSize: "0.85rem" }}>
                {book.author}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default LibrarianHome;