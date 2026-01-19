
"use client";

import type { ChangeEvent, FormEvent, MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useCandidateScope } from "@/context/PersonaContext";
import { useUser } from "@/context/UserContext";
import { fetchFromApi } from "@/lib/api";
import { fallbackResumes } from "@/lib/fallback-data";
import ResumeHealthCard from "@/components/ResumeHealthCard";
import SuggestedActions from "@/components/SuggestedActions";
import ApplicationPipeline from "@/components/ApplicationPipeline";

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

const SECTION_ORDER: string[] = ["Technical", "Business", "Creative"];
const RESUME_TYPES = ["Technical", "Business", "Creative", "General"] as const;

function formatPreviewText(text: string): string {
  if (!text) return "";

  return text
    // Remove excessive whitespace and normalize line breaks
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // Fix spacing around punctuation
    .replace(/\s+([.!?])/g, '$1')
    // Ensure proper spacing after punctuation
    .replace(/([.!?])([A-Z])/g, '$1\n\n$2')
    // Clean up bullet points and lists
    .replace(/•/g, '• ')
    .replace(/\*\s*/g, '• ')
    .replace(/-\s*/g, '• ')
    // Remove excessive spaces
    .replace(/ {2,}/g, ' ')
    .trim();
}

interface ResumePreviewModalProps {
  resume: Resume | null;
  onClose: () => void;
}

function ResumePreviewModal({ resume, onClose }: ResumePreviewModalProps) {
  if (!resume) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{resume.name}</h2>
              <p className="text-lg text-gray-600 mt-1">{resume.type} Resume</p>
              <p className="text-sm text-gray-500 mt-1">Last updated: {new Date(resume.lastUpdated).toLocaleDateString()}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {resume.summary && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
                <p className="text-gray-700">{resume.summary}</p>
              </div>
            )}

            {resume.skills && resume.skills.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {resume.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Type:</span> {resume.type}
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span>{" "}
                  {new Date(resume.lastUpdated).toLocaleDateString()}
                </div>
              </div>
            </div>

            {resume.preview && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Full Resume Content</h3>
                <div className="bg-gray-50 p-6 rounded-lg border max-h-96 overflow-y-auto">
                  <div className="text-base text-gray-800 leading-relaxed whitespace-pre-line">
                    {formatPreviewText(resume.preview)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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

function EditIcon({ onClick }: { onClick: (event: MouseEvent<HTMLButtonElement>) => void }) {
	return (
		<button
			onClick={onClick}
			className="ml-2 text-gray-500 hover:text-blue-600"
			title="Edit resume name"
			aria-label="Edit resume name"
			type="button"
		>
			<svg width="16" height="16" fill="none" viewBox="0 0 24 24">
				<path
					stroke="currentColor"
					strokeWidth="2"
					d="M16.475 5.408l2.117-2.116a1.5 1.5 0 1 1 2.122 2.122l-2.116 2.117m-2.123-2.123l-9.193 9.193a2 2 0 0 0-.497.85l-1.06 3.18a.5.5 0 0 0 .632.632l3.18-1.06a2 2 0 0 0 .85-.497l9.193-9.193m-2.123-2.123 2.123 2.123"
				/>
			</svg>
		</button>
	);
}

export default function ResumePage() {
    const { candidateId } = useCandidateScope();
	const { user } = useUser();
	const [resumes, setResumes] = useState<Resume[]>([]);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState("");
	const [loading, setLoading] = useState<boolean>(true);
	const [usingFallback, setUsingFallback] = useState<boolean>(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
	const [uploadCandidateName, setUploadCandidateName] = useState("");
	const [extractingCandidateName, setExtractingCandidateName] = useState(false);
	const [previewResume, setPreviewResume] = useState<Resume | null>(null);

	const handlePreview = (resume: Resume) => {
		setPreviewResume(resume);
	};

	const loadResumes = useCallback(async () => {
		if (!user?.name) {
			setLoading(false);
			setUsingFallback(false);
			return;
		}
		setLoading(true);
		setErrorMessage(null);
		setStatusMessage(null);
		try {
			// First get the candidate by name
			const candidate = await fetchFromApi<{ candidate_id: string }>(`/candidates/by-name/${encodeURIComponent(user.name)}`);
			// Then load resumes for that candidate
			const response = await fetchFromApi<{ resumes: ResumeApiResponse[] }>(
				`/candidates/${candidate.candidate_id}/resumes`
			);
			const mapped = response.resumes.map(mapResume);
			const sorted = mapped.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
			setResumes(sorted);
			setSelectedId(sorted[0]?.id ?? null);
			setUsingFallback(false);
		} catch (error) {
			console.error("Failed to load resumes", error);
			// Only show fallback if there's a network/API error, not if user just has no resumes
			const errorMessage = error instanceof Error ? error.message : String(error);
			if (errorMessage.includes('fetch') || errorMessage.includes('network') || 
				(errorMessage.includes('404') && !errorMessage.includes('Candidate not found'))) {
				setResumes(fallbackResumes);
				setSelectedId(fallbackResumes[0]?.id ?? null);
				setUsingFallback(true);
			} else {
				// User has no resumes yet - show empty list
				setResumes([]);
				setSelectedId(null);
				setUsingFallback(false);
			}
		} finally {
			setLoading(false);
		}
	}, [user?.name]);

	useEffect(() => {
		void loadResumes();
	}, [loadResumes]);

	const sections = useMemo(() => {
		const types = Array.from(new Set(resumes.map(resume => resume.type)));
		const preferred = SECTION_ORDER.filter(section => types.includes(section));
		const remaining = types.filter(type => !SECTION_ORDER.includes(type));
		return [...preferred, ...remaining];
	}, [resumes]);

	const availableTypes = useMemo(() => {
		const types = [...RESUME_TYPES, ...resumes.map(resume => resume.type)];
		return Array.from(new Set(types)).filter(Boolean) as string[];
	}, [resumes]);

	useEffect(() => {
		if (!availableTypes.includes(uploadType)) {
			setUploadType(availableTypes[0] ?? RESUME_TYPES[0]);
		}
	}, [availableTypes, uploadType]);

	// Set default candidate name from authenticated user
	useEffect(() => {
		if (user?.name && !uploadCandidateName.trim()) {
			setUploadCandidateName(user.name);
		}
	}, [user?.name, uploadCandidateName]);

	const selectedResume = useMemo(() => {
		return resumes.find(resume => resume.id === selectedId) ?? resumes[0];
	}, [resumes, selectedId]);

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
			setErrorMessage("Could not sync the change to the server. Showing local copy.");
			setUsingFallback(true);
		}
	}

	function cancelEdit() {
		setEditingId(null);
		setEditName("");
	}

	function resetUploadForm() {
		setUploadName("");
		setUploadType(availableTypes[0] ?? RESUME_TYPES[0]);
		setUploadSummary("");
		setUploadSkills("");
		setUploadFile(null);
		setUploadFiles(null);
		setUploadCandidateName("");
	}

	async function extractCandidateNameFromFile(file: File): Promise<string> {
		setExtractingCandidateName(true);
		try {
			// Read file content
			const text = await new Promise<string>((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = (e) => {
					const result = e.target?.result;
					if (typeof result === 'string') {
						resolve(result);
					} else if (result instanceof ArrayBuffer) {
						// For binary files, we can't easily extract text on frontend
						// We'll let the backend handle this
						resolve('');
					} else {
						resolve('');
					}
				};
				reader.onerror = () => reject(new Error('Failed to read file'));
				reader.readAsText(file);
			});

			if (!text.trim()) {
				return '';
			}

			// Simple regex patterns to extract name from resume text
			// Look for patterns like "Name: John Doe" or just names at the top
			const namePatterns = [
				/(?:name|Name|NAME)[\s:]+([A-Za-z\s]+)/i,
				/^([A-Za-z\s]+)$/m, // First line if it looks like a name
				/([A-Za-z]+ [A-Za-z]+)/, // First two words that look like name
			];

			for (const pattern of namePatterns) {
				const match = text.match(pattern);
				if (match && match[1]) {
					const extractedName = match[1].trim();
					// Basic validation - should be 2-50 chars, contain letters
					if (extractedName.length >= 2 && extractedName.length <= 50 && /[A-Za-z]/.test(extractedName)) {
						return extractedName;
					}
				}
			}

			return '';
		} catch (error) {
			console.error('Failed to extract candidate name:', error);
			return '';
		} finally {
			setExtractingCandidateName(false);
		}
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
					setErrorMessage(`File "${file.name}" is not allowed. Only PDF and Word documents (.pdf, .docx, .doc) are allowed.`);
					setUploadFile(null);
					setUploadFiles(null);
					event.target.value = '';
					return;
				}
			}
			
			setErrorMessage(null);
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
				setErrorMessage("Only PDF and Word documents (.pdf, .docx, .doc) are allowed.");
				setUploadFile(null);
				setUploadFiles(null);
				event.target.value = '';
				return;
			}
			
			setErrorMessage(null);
			setUploadFile(file);
			setUploadFiles(null);

			// Auto-fill resume name from filename if not set
			if (!uploadName.trim()) {
				const baseName = file.name.replace(/\.(pdf|docx|doc)$/i, '').trim();
				setUploadName(baseName);
			}

			// Try to extract candidate name from file
			if (!uploadCandidateName.trim()) {
				void extractCandidateNameFromFile(file).then(extractedName => {
					if (extractedName) {
						setUploadCandidateName(extractedName);
					}
				});
			}
		}
	}

	async function handleUpload(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setErrorMessage(null);
		
		if (bulkUploadMode) {
			// Bulk upload validation
			if (!uploadFiles || uploadFiles.length === 0) {
				setStatusMessage("Please choose resume files to upload.");
				return;
			}
		} else {
			// Single upload validation
			if (!uploadName.trim()) {
				setStatusMessage("Resume name is required.");
				return;
			}
			if (!uploadCandidateName.trim()) {
				setStatusMessage("Candidate name is required.");
				return;
			}
			if (!uploadFile) {
				setStatusMessage("Please choose a resume file to upload.");
				return;
			}
		}

		setUploading(true);
		setStatusMessage(null);

		const skills = uploadSkills
			.split(",")
			.map(skill => skill.trim())
			.filter(Boolean);

		try {
			if (bulkUploadMode && uploadFiles) {
				// Bulk upload - upload each file
				const uploadPromises = Array.from(uploadFiles).map(async (file) => {
					const formData = new FormData();
					formData.append("candidate_name", uploadCandidateName.trim() || "Unknown Candidate");
					formData.append("name", file.name.replace(/\.(pdf|docx|doc)$/i, '').trim() || "Untitled Resume");
					formData.append("file", file);
					if (uploadSummary.trim()) {
						formData.append("summary", uploadSummary.trim());
					}
					if (skills.length > 0) {
						formData.append("skills", JSON.stringify(skills));
					}
					if (uploadType) {
						formData.append("resume_type", uploadType);
					}

					return fetchFromApi<{ resume_id: string }>("/resumes/", {
						method: "POST",
						body: formData,
					});
				});

				await Promise.all(uploadPromises);
				setStatusMessage(`${uploadFiles.length} resumes uploaded successfully.`);
			} else if (uploadFile) {
				// Single upload
				const formData = new FormData();
				formData.append("candidate_name", uploadCandidateName.trim() || "Unknown Candidate");
				formData.append("name", uploadName.trim());
				formData.append("file", uploadFile);
				if (uploadSummary.trim()) {
					formData.append("summary", uploadSummary.trim());
				}
				if (skills.length > 0) {
					formData.append("skills", JSON.stringify(skills));
				}
				if (uploadType) {
					formData.append("resume_type", uploadType);
				}

				await fetchFromApi<{ resume_id: string }>("/resumes/", {
					method: "POST",
					body: formData,
				});
				setStatusMessage("Resume uploaded successfully.");
			}

			await loadResumes();
			resetUploadForm();
		} catch (error) {
			console.error("Failed to upload resume", error);
			setStatusMessage(null);
			setErrorMessage("Could not upload the resume(s). Please try again.");
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
		setErrorMessage(null);

		setResumes(prev => {
			const updated = prev.filter(resume => resume.id !== resumeId);
			if (selectedId === resumeId) {
				setSelectedId(updated[0]?.id ?? null);
			}
			return updated;
		});

		if (usingFallback || resumeId.startsWith("fallback-")) {
			setDeletingId(null);
			setStatusMessage("Removed resume from the local list.");
			setErrorMessage(null);
			return;
		}

		try {
			await fetchFromApi(`/resumes/${resumeId}`, {
				method: "DELETE",
			});
			await loadResumes();
			setStatusMessage("Resume deleted successfully.");
		} catch (error) {
			console.error("Failed to delete resume", error);
			setStatusMessage(null);
			setErrorMessage("Could not delete the resume. Restoring list.");
			void loadResumes();
		} finally {
			setDeletingId(null);
		}
	}

	const professionalSummary = useMemo(() => {
		if (!selectedResume) return "";
		const segments = selectedResume.preview.split("Professional Summary:");
		if (segments.length < 2) return "";
		return segments[1].split("Skills:")[0]?.trim() ?? "";
	}, [selectedResume]);

	if (!user?.name) {
		return (
			<div className="max-w-5xl mx-auto py-10 px-4 text-sm text-gray-500">
				Please log in to manage your resumes.
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto py-10 px-4 flex flex-col gap-8">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
				{/* Left Column: Dashboard Components */}
				<div className="col-span-1 flex flex-col gap-6">
					<ResumeHealthCard />
					<SuggestedActions />
				</div>
				
				{/* Right Columns: Resume Management */}
				<div className="col-span-2 flex flex-col gap-6">
					<ApplicationPipeline />
					
					{/* Resume List and Preview */}
					<div className="flex flex-col md:flex-row gap-8">
						{/* Left: Resume List */}
						<div className="w-full md:w-1/2">
							<h1 className="text-2xl font-bold mb-6">Your Resumes</h1>
							{loading && <div className="text-sm text-gray-400 mb-4">Loading resumes...</div>}
							{usingFallback && !loading && (
								<div className="text-xs text-gray-400 mb-3">Showing cached resumes while the API is unavailable.</div>
							)}
							{errorMessage && <div className="text-xs text-red-500 mb-3">{errorMessage}</div>}
							{statusMessage && <div className="text-xs text-blue-600 mb-3">{statusMessage}</div>}
							{resumes.length === 0 && !loading && (
								<div className="text-sm text-gray-500 mb-4">No resumes yet. Upload one to get started.</div>
							)}
				{sections.map(section => (
					<div key={section} className="mb-6">
						<h2 className="text-lg font-semibold mb-3 text-blue-800">{section} Resumes</h2>
						<ul className="flex flex-col gap-2">
							{resumes
								.filter(resume => resume.type === section)
								.map(resume => (
									<li
										key={resume.id}
										className={`bg-white border border-blue-100 rounded-lg px-4 py-3 flex flex-col items-start shadow transition-all duration-200 cursor-pointer ${
											selectedResume?.id === resume.id ? "ring-2 ring-blue-400" : ""
										}`}
										style={{ minHeight: 48 }}
										onClick={() => setSelectedId(resume.id)}
									>
										<div className="flex items-center gap-2 w-full">
											{editingId === resume.id ? (
												<>
													<input
														className="border rounded px-2 py-1 text-sm flex-1"
														value={editName}
														onChange={event => setEditName(event.target.value)}
														onClick={event => event.stopPropagation()}
													/>
													<div className="flex gap-2 text-xs">
														<button
															className="text-blue-600"
															type="button"
															onClick={event => {
																event.stopPropagation();
																void saveEdit(resume.id);
															}}
														>
															Save
														</button>
														<button
															className="text-gray-500"
															type="button"
															onClick={event => {
																event.stopPropagation();
																cancelEdit();
															}}
														>
															Cancel
														</button>
													</div>
												</>
											) : (
												<>
													<span className="font-semibold flex-1 text-gray-900">{resume.name}</span>
													<div className="flex items-center gap-3">
														<button
															className="text-xs text-blue-600 hover:text-blue-700"
															type="button"
															onClick={event => {
																event.stopPropagation();
																handlePreview(resume);
															}}
														>
															Preview
														</button>
														<EditIcon
															onClick={event => {
																event.stopPropagation();
																startEdit(resume.id, resume.name);
															}}
														/>
														<button
															className="text-xs text-red-500 hover:text-red-600"
															type="button"
															onClick={event => {
																void handleDelete(event, resume.id);
															}}
															disabled={deletingId === resume.id}
														>
															{deletingId === resume.id ? "Deleting..." : "Delete"}
														</button>
													</div>
												</>
											)}
										</div>
										<div className="text-sm text-gray-700 mb-1 mt-1">{resume.summary}</div>
										<div className="text-xs text-gray-500 mt-1">
											Last updated: <span className="font-semibold text-blue-700">{resume.lastUpdated}</span>
										</div>
									</li>
								))}
							</ul>
						</div>
					))}

				<form onSubmit={handleUpload} className="bg-white border border-blue-100 rounded-lg p-4 shadow-sm">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-semibold text-blue-800">Upload New Resume</h2>
						<label className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								checked={bulkUploadMode}
								onChange={event => {
									setBulkUploadMode(event.target.checked);
									resetUploadForm();
								}}
							/>
							<span>Bulk Upload</span>
						</label>
					</div>
					<div className="flex flex-col gap-3">
						{!bulkUploadMode && (
							<label className="flex flex-col text-sm text-gray-700">
								<span className="mb-1 font-medium">Resume Name</span>
								<input
									className="border border-gray-300 rounded px-2 py-2"
									required
									value={uploadName}
									onChange={event => setUploadName(event.target.value)}
								/>
							</label>
						)}
						{!bulkUploadMode && (
							<label className="flex flex-col text-sm text-gray-700">
								<span className="mb-1 font-medium">Candidate Name</span>
								<input
									className="border border-gray-300 rounded px-2 py-2"
									required
									value={uploadCandidateName}
									onChange={event => setUploadCandidateName(event.target.value)}
									placeholder="Enter candidate name or leave blank to auto-extract from resume"
								/>
								{extractingCandidateName && (
									<span className="text-xs text-blue-600 mt-1">Extracting candidate name from resume...</span>
								)}
							</label>
						)}
						<label className="flex flex-col text-sm text-gray-700">
							<span className="mb-1 font-medium">Resume Type</span>
							<select
								className="border border-gray-300 rounded px-2 py-2"
								value={uploadType}
								onChange={event => setUploadType(event.target.value)}
							>
								{availableTypes.map(type => (
									<option key={type} value={type}>
										{type}
									</option>
								))}
							</select>
						</label>
						<label className="flex flex-col text-sm text-gray-700">
							<span className="mb-1 font-medium">Summary (optional)</span>
							<textarea
								className="border border-gray-300 rounded px-2 py-2 h-20"
								value={uploadSummary}
								onChange={event => setUploadSummary(event.target.value)}
							/>
						</label>
						<label className="flex flex-col text-sm text-gray-700">
							<span className="mb-1 font-medium">Skills (comma separated)</span>
							<input
								className="border border-gray-300 rounded px-2 py-2"
								value={uploadSkills}
								onChange={event => setUploadSkills(event.target.value)}
							/>
						</label>
						<label className="flex flex-col text-sm text-gray-700">
							<span className="mb-1 font-medium">Resume File{bulkUploadMode ? 's' : ''} (PDF, DOCX only)</span>
							<input
								className="border border-gray-300 rounded px-2 py-2"
								required
								type="file"
								accept=".pdf,.docx,.doc"
								multiple={bulkUploadMode}
								onChange={handleFileChange}
							/>
							{uploadFile && <span className="text-xs text-gray-500 mt-1">{uploadFile.name}</span>}
							{uploadFiles && uploadFiles.length > 0 && (
								<span className="text-xs text-gray-500 mt-1">
									{uploadFiles.length} file{uploadFiles.length > 1 ? 's' : ''} selected
								</span>
							)}
						</label>
						<button
							className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50"
							type="submit"
							disabled={uploading}
						>
							{uploading ? "Uploading..." : bulkUploadMode ? "Upload Resumes" : "Upload Resume"}
						</button>
					</div>
				</form>
			</div>
			{/* Right: Resume Preview */}
			<div className="w-full md:w-1/2">
				{selectedResume ? (
					<div className="bg-white border-2 border-blue-200 rounded-lg p-6 shadow-sm min-h-[300px]">
						<div className="mb-2 font-semibold text-blue-900 text-lg">{selectedResume.name}</div>
						<div className="mb-2 text-gray-700">{selectedResume.summary}</div>
						<div className="mb-2 font-semibold text-blue-900">Professional Summary</div>
						<div className="mb-3 text-gray-800">{professionalSummary || "No professional summary provided."}</div>
						<div className="mb-2 font-semibold text-blue-900">Skills</div>
						<div className="flex flex-wrap gap-2 mb-3">
							{selectedResume.skills.length > 0 ? (
								selectedResume.skills.map(skill => (
									<span
										key={skill}
										className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium border border-blue-200"
									>
										{skill}
										</span>
								))
							) : (
								<span className="text-xs text-gray-500">No skills listed.</span>
							)}
						</div>
						<div className="mb-2 font-semibold text-blue-900">Full Resume</div>
						<div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-700 whitespace-pre-line overflow-x-auto leading-relaxed">
							{selectedResume.preview ? formatPreviewText(selectedResume.preview) : "Preview not available."}
						</div>
					</div>
				) : (
					<div className="text-sm text-gray-500">No resume selected.</div>
				)}
			</div>
		</div>
	</div>
</div>

<ResumePreviewModal resume={previewResume} onClose={() => setPreviewResume(null)} />
</div>
	);
}
