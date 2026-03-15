import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type JobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'AWAITING_REVIEW' | 'CANCELLED';

const STATUS_STYLES: Record<JobStatus, string> = {
  QUEUED: 'bg-secondary text-secondary-foreground',
  RUNNING: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20',
  COMPLETED: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20',
  FAILED: 'bg-destructive/15 text-destructive border-destructive/20',
  AWAITING_REVIEW: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  CANCELLED: 'bg-secondary text-muted-foreground',
};

const STATUS_LABELS: Record<JobStatus, string> = {
  QUEUED: 'Queued',
  RUNNING: 'Running',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  AWAITING_REVIEW: 'Review',
  CANCELLED: 'Cancelled',
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
