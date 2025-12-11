"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type MouseEvent } from "react";

import { useCandidateScope } from "@/context/PersonaContext";
import { fetchFromApi, USE_DUMMY_DATA } from "@/lib/api";
import { fallbackResumes } from "@/lib/fallback-data";

const PAGE_SIZE = 5;

type Resume = {
	id: string;
	slug: string;
	name: string;
	type: string;
	summary: string;
	preview: string;
	skills: string[];
	lastUpdated: string;
};

type ResumeApiResponse = {
	id: string;
	slug?: string;
	name?: string;
	type?: string;
	summary?: string;
	preview?: string;
	skills?: string[];
	last_updated?: string;
	lastUpdated?: string;
};

const RESUME_TYPES = ["Technical", "Business", "Creative", "General"] as const;

function mapResume(apiResume: ResumeApiResponse): Resume {
	return {
		id: apiResume.id,
		slug: apiResume.slug ?? apiResume.id,
		name: apiResume.name ?? "Untitled Resume",
		type: apiResume.type ?? "Technical",
		summary: apiResume.summary ?? "",
		preview: apiResume.preview ?? "",
		skills: apiResume.skills ?? [],
		lastUpdated: apiResume.last_updated ?? apiResume.lastUpdated ?? new Date().toISOString().slice(0, 10),
	};
}

function formatDate(value?: string): string {
	if (!value) {
		return "";
	}
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}
	return new Intl.DateTimeFormat("en-AU", {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(date);
}

export default function CandidatesPage() {
	const { candidateId } = useCandidateScope();
	const [page, setPage] = useState(1);
	const [resumes, setResumes] = useState<Resume[]>(fallbackResumes.slice(0, PAGE_SIZE));
	const [selectedResume, setSelectedResume] = useState<Resume | null>(fallbackResumes[0] || null);
	const [total, setTotal] = useState<number>(fallbackResumes.length);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [usingFallback, setUsingFallback] = useState<boolean>(true);
	
	// Additional state for upload and edit functionality
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState("");
	const [uploadName, setUploadName] = useState("");
	const [uploadType, setUploadType] = useState<string>(RESUME_TYPES[0]);
	const [uploadSummary, setUploadSummary] = useState("");
	const [uploadSkills, setUploadSkills] = useState("");
	const [uploadFile, setUploadFile] = useState<File | null>(null);
	const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
	const [bulkUploadMode, setBulkUploadMode] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load(): Promise<void> {
      if (!candidateId) {
        if (isMounted) {
          if (USE_DUMMY_DATA) {
            setLoading(false);
            setUsingFallback(true);
            setResumes(fallbackResumes.slice(0, PAGE_SIZE));
            setTotal(fallbackResumes.length);
            setSelectedResume(fallbackResumes[0] || null);
          } else {
            setLoading(false);
            setUsingFallback(false);
            setResumes([]);
            setTotal(0);
            setSelectedResume(null);
          }
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetchFromApi<{ resumes: ResumeApiResponse[] }>(
          `/candidates/${candidateId}/resumes`
        );
        if (!isMounted) {
          return;
        }

        const mapped = response.resumes.map(mapResume);
        const sorted = mapped.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
        const paginated = sorted.slice(0, PAGE_SIZE);
        
        setResumes(paginated);
        setTotal(sorted.length);
        setSelectedResume(paginated[0] || null);
        setUsingFallback(false);
      } catch (err) {
        console.error("Failed to load resumes", err);
        if (!isMounted) {
          return;
        }
        if (USE_DUMMY_DATA) {
          setResumes(fallbackResumes.slice(0, PAGE_SIZE));
          setTotal(fallbackResumes.length);
          setSelectedResume(fallbackResumes[0] || null);
          setUsingFallback(true);
          setError("Unable to reach the API. Showing demo resumes.");
        } else {
          setResumes([]);
          setTotal(0);
          setSelectedResume(null);
          setUsingFallback(false);
          setError("Unable to load resumes. Please check your connection.");
        }
        if (page !== 1) {
          setPage(1);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      isMounted = false;
    };
	}, [candidateId, page]);

	// Utility functions for edit/upload functionality
	function startEdit(id: string, name: string) {
		setEditingId(id);
		setEditName(name);
	}

	async function saveEdit(id: string) {
		const trimmedName = editName.trim();
		if (!trimmedName) {
			setEditingId(null);
			setEditName("");
			return;
		}

		setResumes(prev => prev.map(resume => (resume.id === id ? { ...resume, name: trimmedName } : resume)));
		setEditingId(null);
		setEditName("");

		if (usingFallback || id.startsWith("fallback-")) {
			return;
		}

		try {
			await fetchFromApi(`/resumes/${id}`, {
				method: "PATCH",
				body: JSON.stringify({ name: trimmedName }),
			});
		} catch (error) {
			console.error("Failed to update resume name", error);
			setError("Could not sync the change to the server. Showing local copy.");
			setUsingFallback(true);
		}
	}

	function cancelEdit() {
		setEditingId(null);
		setEditName("");
	}

	function resetUploadForm() {
		setUploadName("");
		setUploadType(RESUME_TYPES[0]);
		setUploadSummary("");
		setUploadSkills("");
		setUploadFile(null);
		setUploadFiles(null);
	}

	function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
		const files = event.target.files;
		if (!files || files.length === 0) {
			setUploadFile(null);
			setUploadFiles(null);
			return;
		}

		if (bulkUploadMode) {
			// Bulk upload mode - validate all files
			const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
			const allowedExtensions = ['.pdf', '.docx', '.doc'];
			
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const fileName = file.name.toLowerCase();
				
				const isValidType = allowedTypes.includes(file.type);
				const isValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
				
				if (!isValidType && !isValidExtension) {
					setError(`File "${file.name}" is not allowed. Only PDF and Word documents (.pdf, .docx, .doc) are allowed.`);
					setUploadFile(null);
					setUploadFiles(null);
					event.target.value = '';
					return;
				}
			}
			
			setError(null);
			setUploadFiles(files);
			setUploadFile(null);
		} else {
			// Single upload mode - validate single file
			const file = files[0];
			const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
			const allowedExtensions = ['.pdf', '.docx', '.doc'];
			const fileName = file.name.toLowerCase();
			
			const isValidType = allowedTypes.includes(file.type);
			const isValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
			
			if (!isValidType && !isValidExtension) {
				setError("Only PDF and Word documents (.pdf, .docx, .doc) are allowed.");
				setUploadFile(null);
				setUploadFiles(null);
				event.target.value = '';
				return;
			}
			
			setError(null);
			setUploadFile(file);
			setUploadFiles(null);
		}
	}

	async function handleUpload(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		
		if (!candidateId) {
			setError("No candidate ID available. Please log in.");
			return;
		}
		
		setUploading(true);
		setStatusMessage(null);
		
		try {
			if (bulkUploadMode && uploadFiles) {
				// Bulk upload
				const uploadPromises = Array.from(uploadFiles).map(async (file) => {
					const formData = new FormData();
					formData.append('file', file);
					formData.append('name', uploadName || file.name.replace(/\.(pdf|docx|doc)$/i, ''));
					formData.append('type', uploadType);
					formData.append('summary', uploadSummary);
					formData.append('skills', uploadSkills);
					formData.append('candidate_id', candidateId);
					
					return fetchFromApi('/resumes', {
						method: 'POST',
						body: formData,
					});
				});
				
				await Promise.all(uploadPromises);
				setStatusMessage(`Successfully uploaded ${uploadFiles.length} resume${uploadFiles.length > 1 ? 's' : ''}.`);
			} else if (!bulkUploadMode && uploadFile) {
				// Single upload
				const formData = new FormData();
				formData.append('file', uploadFile);
				formData.append('name', uploadName || uploadFile.name.replace(/\.(pdf|docx|doc)$/i, ''));
				formData.append('type', uploadType);
				formData.append('summary', uploadSummary);
				formData.append('skills', uploadSkills);
				formData.append('candidate_id', candidateId);
				
				await fetchFromApi('/resumes', {
					method: 'POST',
					body: formData,
				});
				setStatusMessage("Resume uploaded successfully.");
			}
			
			resetUploadForm();
			
			// Reload resumes
			const response = await fetchFromApi<{ resumes: ResumeApiResponse[] }>(
				`/candidates/${candidateId}/resumes`
			);
			const mapped = response.resumes.map(mapResume);
			const sorted = mapped.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
			const paginated = sorted.slice(0, PAGE_SIZE);
			
			setResumes(paginated);
			setTotal(sorted.length);
			setSelectedResume(paginated[0] || null);
			
		} catch (err) {
			console.error("Upload failed", err);
			setError("Failed to upload resume. Please try again.");
		} finally {
			setUploading(false);
		}
	}

	async function handleDelete(event: MouseEvent<HTMLButtonElement>, resumeId: string) {
		event.stopPropagation();
		if (!resumeId) return;
		if (typeof window !== "undefined" && !window.confirm("Delete this resume?")) {
			return;
		}

		setDeletingId(resumeId);
		setStatusMessage(null);
		setError(null);

		setResumes(prev => {
			const updated = prev.filter(resume => resume.id !== resumeId);
			if (selectedResume?.id === resumeId) {
				setSelectedResume(updated[0] || null);
			}
			return updated;
		});

		if (usingFallback || resumeId.startsWith("fallback-")) {
			setDeletingId(null);
			setStatusMessage("Removed resume from the local list.");
			setError(null);
			return;
		}

		try {
			await fetchFromApi(`/resumes/${resumeId}`, {
				method: "DELETE",
			});
			setStatusMessage("Resume deleted successfully.");
		} catch (err) {
			console.error("Delete failed", err);
			setError("Failed to delete resume. Please try again.");
		} finally {
			setDeletingId(null);
		}
	}

	const availableTypes = useMemo(() => {
		const existingTypes = new Set(resumes.map(r => r.type));
		return [...new Set([...RESUME_TYPES, ...existingTypes])].sort();
	}, [resumes]);

  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Resume Management</h1>
              <p className="text-gray-600 mt-1">Upload, organize, and optimize your resumes</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">
                {loading ? "Loading..." : usingFallback ? "Demo data" : "Live data"}
              </div>
              <div className="text-sm text-gray-500">
                {total} resume{total !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {statusMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {statusMessage}
          </div>
        )}

        {/* Upload Form - Compact */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Resumes
              </h2>
              <label className="flex items-center gap-2 text-sm bg-gray-100 px-3 py-1 rounded-full">
                <input
                  type="checkbox"
                  checked={bulkUploadMode}
                  onChange={event => {
                    setBulkUploadMode(event.target.checked);
                    resetUploadForm();
                  }}
                  className="rounded"
                />
                <span className="font-medium">Bulk Upload</span>
              </label>
            </div>

            <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {!bulkUploadMode && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resume Name</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    value={uploadName}
                    onChange={event => setUploadName(event.target.value)}
                    placeholder="e.g., Senior Developer Resume"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={uploadType}
                  onChange={event => setUploadType(event.target.value)}
                >
                  {availableTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className={bulkUploadMode ? "md:col-span-2" : ""}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File{bulkUploadMode ? 's' : ''} (PDF, DOCX only)
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                  type="file"
                  accept=".pdf,.docx,.doc"
                  multiple={bulkUploadMode}
                  onChange={handleFileChange}
                />
                {uploadFile && <p className="text-xs text-gray-500 mt-1">{uploadFile.name}</p>}
                {uploadFiles && uploadFiles.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">{uploadFiles.length} files selected</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Summary (optional)</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={2}
                  value={uploadSummary}
                  onChange={event => setUploadSummary(event.target.value)}
                  placeholder="Brief description of this resume..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={uploadSkills}
                  onChange={event => setUploadSkills(event.target.value)}
                  placeholder="React, TypeScript, Node.js, Python..."
                />
              </div>

              <div className="md:col-span-4 flex justify-end">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  type="submit"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      {bulkUploadMode ? "Upload Resumes" : "Upload Resume"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Main Content - 3 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Resume Library */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Resume Library
                </h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {resumes.length === 0 && !loading && (
                  <div className="p-6 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm">No resumes yet</p>
                    <p className="text-xs text-gray-400 mt-1">Upload your first resume above</p>
                  </div>
                )}
                {resumes.map(resume => (
                  <div
                    key={resume.id}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-all duration-200 ${
                      selectedResume?.id === resume.id
                        ? 'bg-blue-100 border-blue-200 shadow-sm'
                        : ''
                    }`}
                    onClick={() => setSelectedResume(resume)}
                  >
                    {editingId === resume.id ? (
                      <div className="space-y-2" onClick={e => e.stopPropagation()}>
                        <input
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveEdit(resume.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                            onClick={() => saveEdit(resume.id)}
                          >
                            Save
                          </button>
                          <button
                            className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                            onClick={cancelEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 text-sm leading-tight flex-1 pr-2">
                            {resume.name}
                          </h4>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                startEdit(resume.id, resume.name);
                              }}
                              className="text-gray-400 hover:text-blue-600 p-1"
                              title="Edit name"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={e => {
                                void handleDelete(e, resume.id);
                              }}
                              disabled={deletingId === resume.id}
                              className="text-gray-400 hover:text-red-600 p-1 disabled:opacity-50"
                              title="Delete resume"
                            >
                              {deletingId === resume.id ? (
                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            resume.type === 'Technical' ? 'bg-blue-100 text-blue-800' :
                            resume.type === 'Business' ? 'bg-green-100 text-green-800' :
                            resume.type === 'Creative' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {resume.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(resume.lastUpdated)}
                          </span>
                        </div>
                        {resume.summary && (
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                            {resume.summary}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Resume Preview */}
          <div className="lg:col-span-6">
            {selectedResume ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Resume Preview
                    </h3>
                    <div className="flex items-center gap-2 text-white/80 text-sm">
                      <span>{selectedResume.type}</span>
                      <span>•</span>
                      <span>{formatDate(selectedResume.lastUpdated)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Professional Summary
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 leading-relaxed">
                        {selectedResume.summary || "No summary provided"}
                      </p>
                    </div>
                  </div>

                  {selectedResume.skills.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Skills & Expertise
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedResume.skills.map(skill => (
                          <span
                            key={skill}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium border border-blue-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedResume.preview && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Resume Content
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                          {selectedResume.preview}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Resume</h3>
                  <p className="text-gray-500">Choose a resume from the library to view its details</p>
                </div>
              </div>
            )}
          </div>

          {/* Column 3: Quick Actions & Stats */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Resume Stats */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Resume Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Resumes</span>
                    <span className="font-semibold text-gray-900">{total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">This Page</span>
                    <span className="font-semibold text-gray-900">{resumes.length}</span>
                  </div>
                  {selectedResume && (
                    <>
                      <div className="border-t pt-3 mt-3">
                        <div className="text-sm font-medium text-gray-900 mb-2">Selected Resume</div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Skills</span>
                          <span className="font-semibold text-gray-900">{selectedResume.skills.length}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-1">
                          <span className="text-gray-600">Type</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            selectedResume.type === 'Technical' ? 'bg-blue-100 text-blue-800' :
                            selectedResume.type === 'Business' ? 'bg-green-100 text-green-800' :
                            selectedResume.type === 'Creative' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedResume.type}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setBulkUploadMode(!bulkUploadMode)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {bulkUploadMode ? 'Single Upload' : 'Bulk Upload'}
                  </button>

                  <button
                    onClick={() => {/* TODO: Implement export */}}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Selected
                  </button>

                  <button
                    onClick={() => {/* TODO: Implement duplicate */}}
                    disabled={!selectedResume}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Duplicate Resume
                  </button>
                </div>
              </div>

              {/* Resume Types Breakdown */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Resume Types
                </h3>
                <div className="space-y-2">
                  {availableTypes.map(type => {
                    const count = resumes.filter(r => r.type === type).length;
                    return (
                      <div key={type} className="flex justify-between items-center text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          type === 'Technical' ? 'bg-blue-100 text-blue-800' :
                          type === 'Business' ? 'bg-green-100 text-green-800' :
                          type === 'Creative' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {type}
                        </span>
                        <span className="font-semibold text-gray-900">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-sm text-gray-600">
              Showing {start}-{end} of {total} resumes
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page <= 1 || loading}
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-900 bg-gray-100 rounded-lg">
                Page {page}
              </span>
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={() => setPage(prev => prev + 1)}
                disabled={resumes.length < PAGE_SIZE || loading}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
