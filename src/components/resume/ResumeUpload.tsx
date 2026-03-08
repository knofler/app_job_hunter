import React, { useCallback, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function getFileTypeIcon(fileName: string) {
  const ext = fileName.toLowerCase().split('.').pop();
  if (ext === 'pdf') {
    return (
      <svg className="w-5 h-5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h5v7h7v9H6z" />
        <text x="7" y="18" fontSize="6" fontWeight="bold" fill="currentColor">PDF</text>
      </svg>
    );
  }
  if (ext === 'doc' || ext === 'docx') {
    return (
      <svg className="w-5 h-5 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h5v7h7v9H6z" />
        <text x="6" y="18" fontSize="5" fontWeight="bold" fill="currentColor">DOC</text>
      </svg>
    );
  }
  return null;
}

export interface ResumeUploadProps {
  onUpload: (file: File) => void;
  isUploading?: boolean;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onUpload, isUploading = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const validateAndUpload = useCallback((file: File) => {
    setFileError(null);
    setSelectedFile(null);
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Please choose a smaller file.`);
      return;
    }
    setSelectedFile(file);
    onUpload(file);
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndUpload(file);
  }, [validateAndUpload]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Resume</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-12 text-center transition-all',
            isDragging ? 'border-primary bg-primary-light' : 'border-border hover:border-primary hover:bg-muted'
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-4">
              <svg className="animate-spin h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <>
              <svg className="mx-auto h-16 w-16 mb-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-medium text-foreground mb-2">Drag & drop your resume</p>
              <p className="text-sm text-muted-foreground mb-6">or click to browse</p>
              <input type="file" id="resume-upload" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => e.target.files?.[0] && validateAndUpload(e.target.files[0])} />
              <label htmlFor="resume-upload" className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity">
                Choose File
              </label>
              {fileError && (
                <p className="text-xs text-red-500 mt-3">{fileError}</p>
              )}
              {selectedFile && !fileError && (
                <div className="flex items-center gap-2 mt-3 text-sm text-foreground">
                  {getFileTypeIcon(selectedFile.name)}
                  <span>{selectedFile.name}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-4">PDF, DOC, DOCX (Max 10MB)</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumeUpload;
