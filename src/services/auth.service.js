/**
 * Two-factor login.
 *
 * The flow is two calls, not one:
 *
 *   1. GET  /auth         — checks the credentials and emails a 6-digit code.
 *                           Returns a short-lived `challengeToken`, NOT a
 *                           session. Nothing is stored yet.
 *   2. POST /auth/verify  — exchanges that challengeToken plus the code for
 *                           the real 30-day session token.
 *
 * The session token replaces what used to live in `auth_token`. Every service
 * in the app already reads `localStorage.auth_token` and sends it as the
 * `token` header, so storing it under the same key means no other file has to
 * change.
 *
 * One thing the new flow does NOT return is the user record. The old /auth
 * response carried `user` and `acl` inline; this one carries only the token.
 * `fetchSessionUser` below fills that gap from /App/user, which the gateway
 * serves with the same `token` header.
 */

const BASE_URL = "https://gateway.aajneetiadvertising.com";

// The gateway answers errors as { error: "..." }, while the CRM behind it uses
// { message: "..." }. Read both rather than showing "undefined" to the user.
const readError = (data, fallback) =>
  data?.error || data?.message || fallback;

/**
 * Step 1 — validate credentials and trigger the OTP email.
 *
 * `create-token` is base64 of "username:password". btoa() throws on any
 * character outside Latin-1, which a password legitimately may contain, so
 * the string is UTF-8 encoded first.
 */
export const initiateLogin = async (username, password) => {
  const credentials = utf8ToBase64(`${username}:${password}`);

  const res = await fetch(`${BASE_URL}/auth`, {
    method: "GET",
    headers: { "create-token": credentials },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(readError(data, "Invalid credentials"));
  }

  if (data?.status !== "otp_required" || !data?.challengeToken) {
    throw new Error(readError(data, "Login failed. Please try again."));
  }

  return {
    challengeToken: data.challengeToken,
    emailMasked: data.emailMasked || "",
    message: data.message || "",
  };
};

/** Step 2 — exchange the code for a session token. */
export const verifyOtp = async (otp, challengeToken) => {
  const res = await fetch(`${BASE_URL}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ otp, challengeToken }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data?.status !== "success" || !data?.token) {
    throw new Error(readError(data, "Invalid OTP code. Please try again."));
  }

  return data.token;
};

/**
 * Send a fresh code. The response carries a NEW challengeToken — the old one
 * stops working, so the caller must replace the one it is holding.
 */
export const resendOtp = async (challengeToken) => {
  const res = await fetch(`${BASE_URL}/auth/resend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challengeToken }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data?.challengeToken) {
    throw new Error(readError(data, "Could not resend the code."));
  }

  return {
    challengeToken: data.challengeToken,
    emailMasked: data.emailMasked || "",
    message: data.message || "",
  };
};

/**
 * The user record and ACL table, fetched with the verified session token.
 *
 * The app depends on this far beyond the login screen: `login_object` drives
 * the permission helpers, the theme, the sidebar and the "assigned to me"
 * defaults. Without it every "team" grant silently degrades to "own".
 */
export const fetchSessionUser = async (token) => {
  const res = await fetch(`${BASE_URL}/App/user`, {
    method: "GET",
    headers: { "Content-Type": "application/json", token },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(readError(data, "Could not load your profile."));
  }

  const user = data?.user || (data?.id ? data : null);

  if (!user?.id) {
    console.error("/App/user returned no user object:", data);
    throw new Error("Signed in, but your profile could not be loaded.");
  }

  return { user, acl: data?.acl || null };
};

// btoa() only accepts Latin-1. Percent-encode to UTF-8 bytes first so a
// password with an accent or symbol does not throw InvalidCharacterError.
function utf8ToBase64(value) {
  return btoa(
    encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    ),
  );
}
