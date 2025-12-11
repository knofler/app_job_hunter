"use client";

import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from "react";

import { fetchFromApi } from "@/lib/api";

interface UserWithRoles {
  [key: string]: unknown;
  'https://ai-job-hunter/roles'?: string[];
}

interface Prompt {
  id: string;
  name: string;
  category: string;
  content: string;
  variables: Record<string, string>;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  metadata: Record<string, unknown>;
}

interface PromptFormData {
  name: string;
  category: string;
  content: string;
  variables: Record<string, string>;
  metadata: Record<string, unknown>;
}

const CATEGORIES = [
  "candidate_analysis",
  "job_matching",
  "recruiter_assistance",
  "resume_health",
  "skill_gap_analysis"
];

async function fetchPrompts(): Promise<{ prompts: Prompt[] }> {
  return fetchFromApi<{ prompts: Prompt[] }>('/api/admin/prompts');
}

async function createPrompt(data: PromptFormData): Promise<{ prompt_id: string }> {
  return fetchFromApi<{ prompt_id: string }>('/api/admin/prompts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async function updatePrompt(id: string, data: Partial<PromptFormData>): Promise<{ message: string }> {
  console.log('Updating prompt:', id, 'with data:', data);
  return fetchFromApi<{ message: string }>(`/api/admin/prompts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

async function deletePrompt(id: string): Promise<{ message: string }> {
  return fetchFromApi<{ message: string }>(`/api/admin/prompts/${id}`, {
    method: 'DELETE',
  });
}

export default function AdminPromptsPage() {
  const { user, isLoading: authLoading } = useUser();
  const router = useRouter();

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<PromptFormData>({
    name: '',
    category: 'candidate_analysis',
    content: '',
    variables: {},
    metadata: {},
  });

  // Auth check
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/api/auth/login?returnTo=/admin/prompts');
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

  // Load prompts on component mount
  useEffect(() => {
    if (authLoading || !user) return;
    loadPrompts();
  }, [authLoading, user]);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      const data = await fetchPrompts();
      setPrompts(data.prompts);
      setError(null);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Failed to load prompts");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    try {
      await createPrompt(formData);
      setSuccessMessage("Prompt created successfully.");
      setShowCreateForm(false);
      setFormData({
        name: '',
        category: 'candidate_analysis',
        content: '',
        variables: {},
        metadata: {},
      });
      await loadPrompts();
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Failed to create prompt");
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingPrompt) return;

    setError(null);
    setSuccessMessage(null);

    try {
      await updatePrompt(editingPrompt.id, formData);
      setSuccessMessage("Prompt updated successfully.");
      setEditingPrompt(null);
      setFormData({
        name: '',
        category: 'candidate_analysis',
        content: '',
        variables: {},
        metadata: {},
      });
      await loadPrompts();
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Failed to update prompt");
    }
  };

  const handleDelete = async (promptId: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    try {
      await deletePrompt(promptId);
      setSuccessMessage("Prompt deleted successfully.");
      await loadPrompts();
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Failed to delete prompt");
    }
  };

  const startEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormData({
      name: prompt.name,
      category: prompt.category,
      content: prompt.content,
      variables: prompt.variables,
      metadata: prompt.metadata,
    });
  };

  const cancelEdit = () => {
    setEditingPrompt(null);
    setShowCreateForm(false);
    setFormData({
      name: '',
      category: 'candidate_analysis',
      content: '',
      variables: {},
      metadata: {},
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">AI Prompts Management</h1>
        <p className="text-sm text-gray-600 max-w-3xl">
          Manage AI prompts used throughout the application. Changes take effect immediately for new AI operations.
        </p>
      </header>

      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {successMessage && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </p>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Prompts</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Create New Prompt
        </button>
      </div>

      {showCreateForm && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Prompt</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm text-gray-700">
                Name
                <input
                  type="text"
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="core_skill_analysis"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-gray-700">
                Category
                <select
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm text-gray-700">
              Content
              <textarea
                required
                rows={12}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter the AI prompt content..."
              />
            </label>
            <div className="flex gap-3">
              <button
                type="submit"
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create Prompt
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {prompts.map(prompt => (
          <div key={prompt.id} className={`rounded-2xl border bg-white p-6 shadow-sm transition-all ${
            editingPrompt?.id === prompt.id ? 'ring-2 ring-blue-500 border-blue-300' : 'border-gray-200'
          }`}>
            {editingPrompt?.id === prompt.id ? (
              // Inline edit form
              <div className="space-y-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Edit Prompt: {prompt.name}</h3>
                  <button
                    onClick={cancelEdit}
                    className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm text-gray-700">
                      Name
                      <input
                        type="text"
                        required
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="core_skill_analysis"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-gray-700">
                      Category
                      <select
                        required
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      >
                        {CATEGORIES.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="flex flex-col gap-1 text-sm text-gray-700">
                    Content
                    <textarea
                      required
                      rows={8}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Enter the AI prompt content..."
                    />
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Update Prompt
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              // Display mode
              <>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{prompt.name}</h3>
                    <p className="text-sm text-gray-600">Category: {prompt.category}</p>
                    <p className="text-xs text-gray-500">Version: {prompt.version} | Updated: {new Date(prompt.updated_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(prompt)}
                      className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(prompt.id)}
                      className="inline-flex items-center rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">{prompt.content}</pre>
                </div>
                {Object.keys(prompt.variables).length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Variables:</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(prompt.variables).map(([key, value]) => (
                        <span key={key} className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          {key}: {value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}