import React from 'react';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export interface ResumeCardProps {
  resume: {
    id: string;
    name: string;
    uploadedAt: string;
    healthScore?: number;
    type?: string;
    isPrimary?: boolean;
  };
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const ResumeCard: React.FC<ResumeCardProps> = ({ resume, onView, onDelete }) => {
  const getHealthColor = (score?: number) => {
    if (!score) return 'neutral';
    if (score >= 90) return 'success';
    if (score >= 75) return 'info';
    return 'warning';
  };

  return (
    <Card hoverable>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">{resume.name}</h3>
              {resume.isPrimary && <Badge variant="primary" size="sm">Primary</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{resume.uploadedAt}</p>
          </div>
          <div className="p-3 bg-primary-light rounded-lg">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        {resume.healthScore && (
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Health Score</span>
              <Badge variant={getHealthColor(resume.healthScore)} size="sm">{resume.healthScore}/100</Badge>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className={`h-full rounded-full bg-${getHealthColor(resume.healthScore) === 'success' ? 'green' : getHealthColor(resume.healthScore) === 'info' ? 'blue' : 'yellow'}-500`} style={{ width: `${resume.healthScore}%` }} />
            </div>
          </div>
        )}
        <div className="flex gap-2 pt-4 border-t">
          {onView && <Button variant="outline" size="sm" onClick={() => onView(resume.id)} className="flex-1">View</Button>}
          {onDelete && <Button variant="ghost" size="sm" onClick={() => onDelete(resume.id)}><svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></Button>}
        </div>
      </div>
    </Card>
  );
};

export default ResumeCard;
