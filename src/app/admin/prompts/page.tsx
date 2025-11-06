"use client";

import { FormEvent, useEffect, useState } from "react";

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
  const response = await fetch('/api/admin/prompts');
  if (!response.ok) {
    throw new Error('Failed to fetch prompts');
  }
  return response.json();
}

async function createPrompt(data: PromptFormData): Promise<{ prompt_id: string }> {
  const response = await fetch('/api/admin/prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create prompt');
  }
  return response.json();
}

async function updatePrompt(id: string, data: Partial<PromptFormData>): Promise<{ message: string }> {
  const response = await fetch(`/api/admin/prompts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update prompt');
  }
  return response.json();
}

async function deletePrompt(id: string): Promise<{ message: string }> {
  const response = await fetch(`/api/admin/prompts/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete prompt');
  }
  return response.json();
}

export default function AdminPromptsPage() {
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

  // Load prompts on component mount
  useEffect(() => {
    loadPrompts();
  }, []);

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

      {(showCreateForm || editingPrompt) && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}
          </h3>
          <form onSubmit={editingPrompt ? handleUpdate : handleCreate} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm text-gray-700">
                Name
                <input
                  type="text"
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="core_skill_analysis"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-gray-700">
                Category
                <select
                  required
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
                rows={10}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter the AI prompt content..."
              />
            </label>
            <div className="flex gap-3">
              <button
                type="submit"
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                {editingPrompt ? 'Update Prompt' : 'Create Prompt'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {prompts.map(prompt => (
          <div key={prompt.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
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
          </div>
        ))}
      </div>
    </div>
  );
}