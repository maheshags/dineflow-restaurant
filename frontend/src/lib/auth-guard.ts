/**
 * auth-guard.ts
 *
 * Stateless helper that reads localStorage directly — safe to call
 * in TanStack Router's `beforeLoad` hooks (no React context required).
 *
 * Rules:
 *  1. `adminToken` must be present in localStorage.
 *  2. `adminData` must be valid JSON with `role === "admin"`.
 *
 * If either check fails the user is NOT considered an admin.
 */

const isBrowser = typeof window !== "undefined";

/** Returns true only when the session is a verified admin session. */
export function isAdminAuthenticated(): boolean {
  if (!isBrowser) return false;

  try {
    const token = localStorage.getItem("adminToken");
    if (!token) return false;

    const raw = localStorage.getItem("adminData");
    if (!raw) return false;

    const data = JSON.parse(raw) as { role?: string };
    return data.role === "admin";
  } catch {
    // Malformed JSON or unexpected error — treat as unauthenticated
    return false;
  }
}

/** Call this inside a TanStack Router `beforeLoad`. Throws a redirect to "/" if not admin. */
export function requireAdmin({ redirect }: { redirect: (opts: { to: string }) => never }): void {
  if (!isAdminAuthenticated()) {
    throw redirect({ to: "/" });
  }
}
