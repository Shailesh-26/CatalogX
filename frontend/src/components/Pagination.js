function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  // Build page number array with ellipsis logic
  const getPages = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3)         pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 6, marginTop: 32, flexWrap: "wrap"
    }}>
      {/* Prev */}
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        style={{ minWidth: 36 }}
      >
        ‹
      </button>

      {/* Page numbers */}
      {getPages().map((p, i) =>
        p === "..." ? (
          <span key={`dot-${i}`} style={{
            padding: "4px 6px", color: "var(--text-muted)", fontSize: "0.85rem"
          }}>
            …
          </span>
        ) : (
          <button
            key={p}
            className={`btn btn-sm ${p === page ? "btn-primary" : "btn-secondary"}`}
            onClick={() => onPageChange(p)}
            style={{ minWidth: 36 }}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        style={{ minWidth: 36 }}
      >
        ›
      </button>

      {/* Page info */}
      <span className="text-muted" style={{ fontSize: "0.78rem", marginLeft: 8 }}>
        Page {page} of {totalPages}
      </span>
    </div>
  );
}

export default Pagination;