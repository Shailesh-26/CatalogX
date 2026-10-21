// Small helpers so every component reads auth state the same way.
export const STAFF_ROLES = ["admin", "librarian"];

export const getRole   = () => localStorage.getItem("role");
export const getUserId = () => localStorage.getItem("userId");
export const isStaffRole = (role = getRole()) => STAFF_ROLES.includes(role);

export const homeFor = (role = getRole()) =>
  role === "admin" ? "/admin-home"
  : role === "librarian" ? "/librarian-home"
  : role === "student" ? "/student-home"
  : "/login";

// Only remove auth keys — localStorage.clear() also wiped the dark-mode
// preference, so the theme flipped back to light on every logout.
export function clearAuth() {
  ["token", "role", "name", "userId"].forEach(k => localStorage.removeItem(k));
  sessionStorage.removeItem("dismissedAnnouncementId");
}
