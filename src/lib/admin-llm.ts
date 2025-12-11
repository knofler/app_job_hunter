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

// Default configurations for each provider
export const PROVIDER_DEFAULTS: Record<string, Partial<LLMProviderConfigInput>> = {
  openai: {
    model: "gpt-4o-mini",
    temperature: 0.7,
    max_tokens: 4000,
  },
  anthropic: {
    model: "claude-3-haiku-20240307",
    temperature: 0.7,
    max_tokens: 4000,
  },
  google: {
    model: "gemini-1.5-flash",
    temperature: 0.7,
    max_tokens: 4000,
  },
  deepseek: {
    model: "deepseek-chat",
    temperature: 0.7,
    max_tokens: 4000,
  },
  bedrock: {
    model: "anthropic.claude-3-haiku-20240307-v1:0",
    temperature: 0.7,
    max_tokens: 4000,
  },
};

// Function to get default config for a provider
export function getProviderDefaults(provider: string): Partial<LLMProviderConfigInput> {
  return PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.openai;
}
