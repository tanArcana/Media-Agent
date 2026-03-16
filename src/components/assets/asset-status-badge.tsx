import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type AssetStatus = 'PENDING' | 'GENERATING' | 'AWAITING_REVIEW' | 'APPROVED' | 'REJECTED' | 'FAILED';

const STATUS_STYLES: Record<AssetStatus, string> = {
  PENDING: 'bg-secondary text-secondary-foreground',
  GENERATING: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20',
  AWAITING_REVIEW: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  APPROVED: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20',
  REJECTED: 'bg-destructive/15 text-destructive border-destructive/20',
  FAILED: 'bg-destructive/15 text-destructive border-destructive/20',
};

const STATUS_LABELS: Record<AssetStatus, string> = {
  PENDING: 'Pending',
  GENERATING: 'Generating',
  AWAITING_REVIEW: 'Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  FAILED: 'Failed',
};

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  return (
    <Badge variant="outline" className={cn('text-[10px]', STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
