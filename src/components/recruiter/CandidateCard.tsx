import React from 'react';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export interface CandidateCardProps {
  candidate: {
    id: string;
    name: string;
    title: string;
    matchScore: number;
    location: string;
    experience: string;
    skills: string[];
    appliedDate: string;
    status: 'new' | 'screening' | 'interview' | 'offer' | 'rejected';
  };
  onViewProfile?: (id: string) => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, onViewProfile }) => {
  const getStatusColor = (status: string) => {
    const colors = { new: 'info', screening: 'warning', interview: 'primary', offer: 'success', rejected: 'error' };
    return colors[status as keyof typeof colors] || 'neutral';
  };

  return (
    <Card hoverable>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-primary-dark font-semibold">
              {candidate.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h3 className="font-semibold">{candidate.name}</h3>
              <p className="text-sm text-muted-foreground">{candidate.title}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={candidate.matchScore >= 90 ? 'success' : 'info'} size="lg">{candidate.matchScore}%</Badge>
            <Badge variant={getStatusColor(candidate.status)} size="sm">{candidate.status}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {candidate.skills.slice(0, 3).map((s, i) => <Badge key={i} variant="primary" size="sm">{s}</Badge>)}
        </div>
        <div className="flex justify-between pt-4 border-t">
          <span className="text-xs text-muted-foreground">{candidate.appliedDate}</span>
          {onViewProfile && <Button variant="outline" size="sm" onClick={() => onViewProfile(candidate.id)}>View</Button>}
        </div>
      </div>
    </Card>
  );
};

export default CandidateCard;
