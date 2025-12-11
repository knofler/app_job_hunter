"use client";

import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  LLMProviderConfigInput,
  LLMProviderSummary,
  LLMSettingsPayload,
  fetchProviders,
  fetchSettings,
  updateSettings,
  fetchProviderDefaults,
} from "@/lib/admin-llm";

interface UserWithRoles {
  [key: string]: unknown;
  'https://ai-job-hunter/roles'?: string[];
}

const WORKFLOW_STEPS: { id: string; label: string }[] = [
  { id: "core_skills", label: "3. Core must-have skills" },
  { id: "ai_analysis", label: "4. AI-powered analysis" },
  { id: "ranked_shortlist", label: "5. Ranked shortlist" },
  { id: "detailed_readout", label: "6. Detailed readout" },
  { id: "engagement_plan", label: "Engagement plan" },
  { id: "fairness_guidance", label: "Fairness & panel guidance" },
  { id: "interview_preparation", label: "Interview preparation pack" },
];

const EMPTY_CONFIG: LLMProviderConfigInput = {
  provider: "openai",
  model: "",
  api_key: null,
  base_url: null,
  temperature: null,
  max_tokens: null,
};

function toFormConfig(config?: LLMProviderConfigInput): ConfigFormState {
  return {
    provider: config?.provider ?? "openai",
    model: config?.model ?? "",
    api_key: config?.api_key ?? "",
    base_url: config?.base_url ?? "",
    temperature: config?.temperature?.toString() ?? "",
    max_tokens: config?.max_tokens?.toString() ?? "",
  };
}

type ConfigFormState = {
  provider: string;
  model: string;
  api_key: string;
  base_url: string;
  temperature: string;
  max_tokens: string;
};

type StepFormState = {
  useCustom: boolean;
  config: ConfigFormState;
};

export default function AdminLLMSettingsPage() {
  const { user, isLoading: authLoading } = useUser();
  const router = useRouter();
  const [providers, setProviders] = useState<LLMProviderSummary[]>([]);
  const [defaultConfig, setDefaultConfig] = useState<ConfigFormState>(() => toFormConfig());
  const [stepConfigs, setStepConfigs] = useState<Record<string, StepFormState>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/api/auth/login?returnTo=/admin/llm');
      return;
    }

    const roles = ((user as UserWithRoles)?.['https://ai-job-hunter/roles'] || []) as string[];
    
    // Temporary fallback: allow admin access for specific email domains or users
    const isAdmin = roles.includes('admin') || 
                   roles.includes('power_user') || 
                   roles.includes('recruiter') ||
                   user.email?.endsWith('@yourdomain.com') || // Replace with your admin domain
                   user.sub === 'auth0|your-user-id'; // Replace with specific user ID
    
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    
    let isMounted = true;
    async function load() {
      try {
        const [providerResponse, settings] = await Promise.all([fetchProviders(), fetchSettings()]);
        if (!isMounted) {
          return;
        }
        setProviders(providerResponse.providers);
        setDefaultConfig(toFormConfig(settings.default));

        const configuredSteps: Record<string, StepFormState> = {};
        for (const step of WORKFLOW_STEPS) {
          const config = settings.steps[step.id];
          if (config) {
            configuredSteps[step.id] = {
              useCustom: true,
              config: toFormConfig(config),
            };
          } else {
            configuredSteps[step.id] = {
              useCustom: false,
              config: toFormConfig({ ...EMPTY_CONFIG, provider: settings.default.provider }),
            };
          }
        }
        setStepConfigs(configuredSteps);
        setError(null);
      } catch (err) {
        console.error(err);
        setError((err as Error).message || "Failed to load LLM settings");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [authLoading, user]);

  const handleDefaultChange = async (key: keyof ConfigFormState, value: string) => {
    setDefaultConfig(current => {
      const updated = { ...current, [key]: value };
      
      // Auto-populate model and settings when provider changes
      if (key === "provider") {
        // Fetch provider defaults from backend
        fetchProviderDefaults(value).then((defaults: Partial<LLMProviderConfigInput>) => {
          setDefaultConfig(current => ({
            ...current,
            model: defaults.model || "",
            temperature: defaults.temperature?.toString() || "",
            max_tokens: defaults.max_tokens?.toString() || "",
            base_url: defaults.base_url || "",
          }));
        }).catch((err: Error) => {
          console.error("Failed to fetch provider defaults:", err);
        });
      }
      
      return updated;
    });
  };

  const handleStepChange = (stepId: string, key: keyof ConfigFormState, value: string) => {
    setStepConfigs(current => {
      const currentStep = current[stepId] || { useCustom: false, config: toFormConfig() };
      const updatedConfig = { ...currentStep.config, [key]: value };
      
      // Auto-populate model and settings when provider changes
      if (key === "provider") {
        // Fetch provider defaults from backend
        fetchProviderDefaults(value).then((defaults: Partial<LLMProviderConfigInput>) => {
          setStepConfigs(current => ({
            ...current,
            [stepId]: {
              ...current[stepId],
              config: {
                ...current[stepId].config,
                model: defaults.model || "",
                temperature: defaults.temperature?.toString() || "",
                max_tokens: defaults.max_tokens?.toString() || "",
                base_url: defaults.base_url || "",
              },
            },
          }));
        }).catch((err: Error) => {
          console.error("Failed to fetch provider defaults:", err);
        });
      }
      
      return {
        ...current,
        [stepId]: {
          ...currentStep,
          config: updatedConfig,
        },
      };
    });
  };

  const toggleStepCustom = (stepId: string, useCustom: boolean) => {
    setStepConfigs(current => ({
      ...current,
      [stepId]: {
        useCustom,
        config: useCustom
          ? current[stepId]?.config ?? toFormConfig()
          : toFormConfig({ ...EMPTY_CONFIG, provider: defaultConfig.provider }),
      },
    }));
  };

  const providerOptions = useMemo(() => providers.map(provider => (
    <option key={provider.id} value={provider.id}>
      {provider.label}
    </option>
  )), [providers]);

  const convertToPayload = (): LLMSettingsPayload => {
    const mapConfig = (config: ConfigFormState): LLMProviderConfigInput & {
      extra_headers: Record<string, string>;
      extra_payload: Record<string, unknown>;
    } => ({
      provider: config.provider,
      model: config.model,
      api_key: config.api_key?.trim() ? config.api_key.trim() : null,
      base_url: config.base_url?.trim() ? config.base_url.trim() : null,
      temperature: config.temperature ? Number(config.temperature) : null,
      max_tokens: config.max_tokens ? Number(config.max_tokens) : null,
      extra_headers: {},
      extra_payload: {},
    });

    const stepsPayload: LLMSettingsPayload["steps"] = {};
    for (const step of WORKFLOW_STEPS) {
      const state = stepConfigs[step.id];
      if (state?.useCustom) {
        stepsPayload[step.id] = mapConfig(state.config);
      }
    }

    return {
      default: mapConfig(defaultConfig),
      steps: stepsPayload,
    };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const payload = convertToPayload();
      const response = await updateSettings(payload);
      setDefaultConfig(toFormConfig(response.default));

      const refreshedSteps: Record<string, StepFormState> = {};
      for (const step of WORKFLOW_STEPS) {
        const config = response.steps[step.id];
        if (config) {
          refreshedSteps[step.id] = {
            useCustom: true,
            config: toFormConfig(config),
          };
        } else {
          refreshedSteps[step.id] = {
            useCustom: false,
            config: toFormConfig({ ...EMPTY_CONFIG, provider: response.default.provider }),
          };
        }
      }
      setStepConfigs(refreshedSteps);
      setSuccessMessage("Settings saved successfully.");
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">LLM Provider Settings</h1>
        <p className="text-sm text-gray-600 max-w-3xl">
          Configure the default LLM provider and assign custom models to each recruiter workflow step. API keys are
          encrypted at rest on the backend. Leaving a key blank retains the existing stored secret.
        </p>
      </header>

      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {successMessage && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-10">
        <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Default provider</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Provider
              <select
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={defaultConfig.provider}
                onChange={event => handleDefaultChange("provider", event.target.value)}
              >
                {providerOptions}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Model
              <input
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={defaultConfig.model}
                onChange={event => handleDefaultChange("model", event.target.value)}
                placeholder="gpt-4o-mini"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              API key (leave blank to keep existing)
              <input
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={defaultConfig.api_key}
                onChange={event => handleDefaultChange("api_key", event.target.value)}
                placeholder="sk-..."
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Base URL (optional)
              <input
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={defaultConfig.base_url}
                onChange={event => handleDefaultChange("base_url", event.target.value)}
                placeholder="https://api.openai.com/v1"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Temperature
              <input
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={defaultConfig.temperature}
                onChange={event => handleDefaultChange("temperature", event.target.value)}
                placeholder="0.2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Max tokens
              <input
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={defaultConfig.max_tokens}
                onChange={event => handleDefaultChange("max_tokens", event.target.value)}
                placeholder="2048"
              />
            </label>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Workflow step overrides</h2>
          <p className="text-sm text-gray-600">
            Enable a custom provider/model per step when you need more control. Disabling a step reverts it to the
            default provider.
          </p>
          <div className="space-y-4">
            {WORKFLOW_STEPS.map(step => {
              const state = stepConfigs[step.id] ?? { useCustom: false, config: toFormConfig() };
              return (
                <div key={step.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{step.label}</h3>
                      <p className="text-xs text-gray-500">Step ID: {step.id}</p>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={state.useCustom}
                        onChange={event => toggleStepCustom(step.id, event.target.checked)}
                      />
                      Use custom provider
                    </label>
                  </div>
                  {state.useCustom && (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="flex flex-col gap-1 text-sm text-gray-700">
                        Provider
                        <select
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          value={state.config.provider}
                          onChange={event => handleStepChange(step.id, "provider", event.target.value)}
                        >
                          {providerOptions}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-sm text-gray-700">
                        Model
                        <input
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          value={state.config.model}
                          onChange={event => handleStepChange(step.id, "model", event.target.value)}
                          placeholder="custom-model"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm text-gray-700">
                        API key (leave blank to keep existing)
                        <input
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          value={state.config.api_key}
                          onChange={event => handleStepChange(step.id, "api_key", event.target.value)}
                          placeholder="sk-..."
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm text-gray-700">
                        Base URL (optional)
                        <input
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          value={state.config.base_url}
                          onChange={event => handleStepChange(step.id, "base_url", event.target.value)}
                          placeholder="https://api.example.com"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm text-gray-700">
                        Temperature
                        <input
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          value={state.config.temperature}
                          onChange={event => handleStepChange(step.id, "temperature", event.target.value)}
                          placeholder="0.2"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm text-gray-700">
                        Max tokens
                        <input
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          value={state.config.max_tokens}
                          onChange={event => handleStepChange(step.id, "max_tokens", event.target.value)}
                          placeholder="2048"
                        />
                      </label>
                    </div>
                  )}
                  {!state.useCustom && (
                    <p className="mt-3 text-xs text-gray-500">Using default provider configuration.</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
          <span className="text-xs text-gray-500">Changes take effect immediately for new recruiter workflow runs.</span>
        </div>
      </form>
    </div>
  );
}
