const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

export async function api(path, options = {}) {
  const headers = { Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers };
  let response;
  try {
    // credentials: "include" is what makes the browser attach the
    // httpOnly access-token cookie to every request (and store it on
    // login/signup's Set-Cookie response) — without this, cross-origin
    // requests (e.g. the Vite dev server on :5173 talking to the API on
    // :8000) simply won't carry the cookie at all.
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, credentials: "include" });
  } catch {
    throw new Error(`Cannot reach the API at ${API_BASE_URL}. Check that the backend is running and VITE_API_BASE_URL is correct.`);
  }
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const detail = data?.detail;
    throw new Error(Array.isArray(detail) ? detail.map((item) => item.msg).join("; ") : detail || `Request failed (${response.status})`);
  }
  return data;
}

// The token itself is never touched here — it's set/cleared by the
// backend as an httpOnly cookie the browser manages on its own. "user" is
// just cached profile data for the UI (name, role) so pages don't need to
// hit /profile on every render; it isn't a credential and holds no auth
// weight (see App.jsx's route guards).
export const saveSession = (result) => {
  localStorage.setItem("user", JSON.stringify(result.user));
};

export const clearSession = async () => {
  try {
    // Revokes the token server-side (bumps token_version) and clears the
    // cookie, rather than just forgetting about it client-side — a
    // logout that only did the latter would leave a copied-out token
    // (e.g. from browser dev tools, a proxy log, a compromised device)
    // valid until it naturally expired.
    await api("/auth/logout", { method: "POST" });
  } catch {
    // Already logged out / token already invalid / API unreachable —
    // either way there's nothing more the client can do about the
    // server-side session, so fall through and clear local state.
  }
  localStorage.removeItem("user");
};

export const money = (amount) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(Number(amount || 0));
