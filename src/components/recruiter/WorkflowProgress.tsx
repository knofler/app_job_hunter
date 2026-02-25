import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  message?: string;
  progress?: number;
}

export interface WorkflowProgressProps {
  steps: WorkflowStep[];
  title?: string;
}

const WorkflowProgress: React.FC<WorkflowProgressProps> = ({ steps, title = 'AI Workflow' }) => {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={step.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center',
                  step.status === 'completed' ? 'bg-green-100' :
                  step.status === 'in_progress' ? 'bg-blue-100' : 'bg-gray-100'
                )}>
                  {step.status === 'completed' ? '✓' : step.status === 'in_progress' ? '⟳' : '○'}
                </div>
                {i < steps.length - 1 && <div className={cn('w-0.5 h-12 mt-2', step.status === 'completed' ? 'bg-green-500' : 'bg-gray-300')} />}
              </div>
              <div className="flex-1 pb-4">
                <h4 className="text-sm font-semibold">{step.name}</h4>
                {step.message && <p className="text-sm text-muted-foreground">{step.message}</p>}
                {step.status === 'in_progress' && step.progress && (
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${step.progress}%` }} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkflowProgress;
