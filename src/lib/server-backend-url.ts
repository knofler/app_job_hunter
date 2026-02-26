/**
 * Resolves the backend API base URL for server-side proxy routes.
 *
 * Priority:
 * 1. NEXT_PUBLIC_API_URL_INTERNAL — Docker internal network URL (e.g. http://backend:8000)
 * 2. NEXT_PUBLIC_API_URL          — Public remote URL (e.g. https://api.onrender.com/api)
 * 3. Localhost fallback           — for local non-Docker development
 */
export const SERVER_BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL_INTERNAL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8010/api";
