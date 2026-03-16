'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Download,
  Link2,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface AssetActionsProps {
  assetId: string;
  originalUrl: string | null;
  type: string;
  status: string;
}

export function AssetActions({ assetId, originalUrl, type, status }: AssetActionsProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [acting, setActing] = useState(false);

  const handleCopyLink = useCallback(() => {
    if (!originalUrl) return;
    navigator.clipboard.writeText(originalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [originalUrl]);

  const handleDownload = useCallback(() => {
    if (!originalUrl) return;
    const a = document.createElement('a');
    a.href = originalUrl;
    a.download = `asset-${assetId}.${type === 'VIDEO' ? 'mp4' : 'png'}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [originalUrl, assetId, type]);

  const patchStatus = useCallback(
    async (newStatus: 'APPROVED' | 'REJECTED') => {
      setActing(true);
      await fetch(`/api/assets/${assetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          humanReviewed: true,
          humanApproved: newStatus === 'APPROVED',
        }),
      });
      setActing(false);
      router.refresh();
    },
    [assetId, router],
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={handleDownload} disabled={!originalUrl}>
          <Download className="mr-1.5 h-4 w-4" />
          Download
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={handleCopyLink} disabled={!originalUrl}>
          {copied ? (
            <><Copy className="mr-1.5 h-4 w-4" />Copied!</>
          ) : (
            <><Link2 className="mr-1.5 h-4 w-4" />Copy Link</>
          )}
        </Button>
        {originalUrl && (
          <Button variant="outline" size="icon" asChild>
            <a href={originalUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={status === 'APPROVED' || acting}
          onClick={() => patchStatus('APPROVED')}
        >
          <CheckCircle className="mr-1.5 h-4 w-4 text-green-600" />
          Approve
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={status === 'REJECTED' || acting}
          onClick={() => patchStatus('REJECTED')}
        >
          <XCircle className="mr-1.5 h-4 w-4 text-destructive" />
          Reject
        </Button>
      </div>
    </div>
  );
}
