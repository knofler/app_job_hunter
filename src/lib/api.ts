const DEFAULT_LOCAL_API_URL = process.env.NEXT_PUBLIC_API_URL_LOCAL ?? "http://localhost:8010";
const INTERNAL_API_URL = process.env.NEXT_PUBLIC_API_URL_INTERNAL;
const FORCE_REMOTE = process.env.NEXT_PUBLIC_API_FORCE_REMOTE === "1" || process.env.NEXT_PUBLIC_API_FORCE_REMOTE === "true";

function resolveBaseUrl(): string {
  const remoteBase = process.env.NEXT_PUBLIC_API_URL;

  if (FORCE_REMOTE) {
    return remoteBase ?? INTERNAL_API_URL ?? DEFAULT_LOCAL_API_URL;
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isLocalHost = host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
    if (isLocalHost) {
      return DEFAULT_LOCAL_API_URL;
    }
  } else {
    const runningOnVercel = process.env.VERCEL === "1" || process.env.NEXT_PUBLIC_VERCEL === "1";
    if (INTERNAL_API_URL) {
      return INTERNAL_API_URL;
    }
    if (!runningOnVercel && process.env.NODE_ENV !== "production") {
      return DEFAULT_LOCAL_API_URL;
    }
  }

  return remoteBase ?? INTERNAL_API_URL ?? DEFAULT_LOCAL_API_URL;
}

function buildHeaders(init?: RequestInit): Headers {
  const headers = new Headers(init?.headers ?? {});
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

export async function fetchFromApi<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = resolveBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: buildHeaders(init),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request to ${path} failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(`Failed to parse response from ${path}: ${(error as Error).message}`);
  }
}

export function getApiBaseUrl(): string {
  return resolveBaseUrl();
}
