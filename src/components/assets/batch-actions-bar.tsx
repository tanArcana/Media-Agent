'use client';

import { Button } from '@/components/ui/button';
import { Download, CheckCircle, XCircle, X } from 'lucide-react';

interface BatchActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDownload: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export function BatchActionsBar({
  selectedCount,
  onClearSelection,
  onDownload,
  onApprove,
  onReject,
}: BatchActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky bottom-4 z-20 mx-auto flex w-fit items-center gap-2 rounded-lg border bg-background px-4 py-2 shadow-lg">
      <span className="text-sm font-medium mr-2">
        {selectedCount} selected
      </span>

      <Button variant="outline" size="sm" onClick={onDownload}>
        <Download className="mr-1.5 h-3.5 w-3.5" />
        Download
      </Button>

      <Button variant="outline" size="sm" onClick={onApprove}>
        <CheckCircle className="mr-1.5 h-3.5 w-3.5 text-green-600" />
        Approve
      </Button>

      <Button variant="outline" size="sm" onClick={onReject}>
        <XCircle className="mr-1.5 h-3.5 w-3.5 text-destructive" />
        Reject
      </Button>

      <Button variant="ghost" size="sm" onClick={onClearSelection}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
