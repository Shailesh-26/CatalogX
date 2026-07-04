import { Link } from "react-router-dom";

/**
 * PageHeader — consistent top section for every page
 *
 * Props:
 *   eyebrow     string  — small label above title (e.g. "Admin · Books")
 *   title       string  — main page title (required)
 *   subtitle    string  — description below title
 *   breadcrumbs array   — [{ label, to }] — shown above eyebrow if provided
 *   actions     node    — buttons / elements aligned to the right
 */
function PageHeader({ eyebrow, title, subtitle, breadcrumbs, actions }) {
  return (
    <div className="page-header">
      {/* Breadcrumb */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="breadcrumb" aria-label="breadcrumb">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {i > 0 && <span className="breadcrumb-sep">›</span>}
              {crumb.to ? (
                <Link to={crumb.to}>{crumb.label}</Link>
              ) : (
                <span style={{ color: "var(--text-secondary)" }}>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="page-header-inner">
        <div className="page-header-left">
          {eyebrow && (
            <p className="page-header-eyebrow">
              <span style={{ opacity: 0.6 }}>◆</span> {eyebrow}
            </p>
          )}
          <h1 className="page-header-title">{title}</h1>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
        {actions && (
          <div className="page-header-actions">{actions}</div>
        )}
      </div>
    </div>
  );
}

export default PageHeader;