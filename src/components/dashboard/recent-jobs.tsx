'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { JobStatusBadge } from './job-status-badge';

interface RecentJob {
  id: string;
  title: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'AWAITING_REVIEW';
  stage?: string;
  progress?: number;
  createdAt: string;
}

const STAGE_LABELS: Record<string, string> = {
  BRIEF_ANALYSIS: 'Analyzing brief',
  DNA_ALIGNMENT: 'Aligning with DNA',
  PROMPT_ENGINEERING: 'Crafting prompt',
  GENERATION: 'Generating media',
  QUALITY_GATE: 'Quality check',
  DELIVERY: 'Delivering',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function RecentJobs({ jobs }: { jobs: RecentJob[] }) {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg">Active Jobs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{job.title}</span>
                  <JobStatusBadge status={job.status} />
                </div>
                {job.stage && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {STAGE_LABELS[job.stage] ?? job.stage}
                  </p>
                )}
                {(job.status === 'RUNNING' || job.status === 'AWAITING_REVIEW') &&
                  job.progress != null && (
                    <Progress value={job.progress} className="mt-2 h-1.5" />
                  )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {timeAgo(job.createdAt)}
              </span>
            </div>
          ))}
          {jobs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent jobs
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
