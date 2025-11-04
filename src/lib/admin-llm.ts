export type LLMProviderSummary = {
  id: string;
  label: string;
  supports_json_mode: boolean;
  notes?: string;
};

export type LLMProviderConfigInput = {
  provider: string;
  model: string;
  api_key?: string | null;
  base_url?: string | null;
  temperature?: number | null;
  max_tokens?: number | null;
};

export type LLMSettingsResponse = {
  id: string;
  default: LLMProviderConfigInput & {
    extra_headers?: Record<string, string>;
    extra_payload?: Record<string, unknown>;
  };
  steps: Record<string, LLMProviderConfigInput & {
    extra_headers?: Record<string, string>;
    extra_payload?: Record<string, unknown>;
  }>;
  updated_at: string;
};

export type LLMSettingsPayload = {
  default: LLMProviderConfigInput & {
    extra_headers?: Record<string, string>;
    extra_payload?: Record<string, unknown>;
  };
  steps: Record<string, LLMProviderConfigInput & {
    extra_headers?: Record<string, string>;
    extra_payload?: Record<string, unknown>;
  }>;
};

import { getApiBaseUrl } from "@/lib/api";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : url;
  const response = await fetch(fullUrl, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Token": process.env.NEXT_PUBLIC_ADMIN_TOKEN || "changeme-admin-token",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request to ${url} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function fetchProviders(): Promise<{ providers: LLMProviderSummary[] }> {
  return request<{ providers: LLMProviderSummary[] }>("/api/admin/llm/providers");
}

export function fetchSettings(): Promise<LLMSettingsResponse> {
  return request<LLMSettingsResponse>("/api/admin/llm/settings");
}

export function updateSettings(payload: LLMSettingsPayload): Promise<LLMSettingsResponse> {
  return request<LLMSettingsResponse>("/api/admin/llm/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
