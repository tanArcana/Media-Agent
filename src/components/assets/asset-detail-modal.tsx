'use client';

import { useCallback, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AssetStatusBadge } from './asset-status-badge';
import {
  Download,
  Link2,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  Video,
  Calendar,
  Layers,
  Sparkles,
  Copy,
  ExternalLink,
} from 'lucide-react';
import type { AssetItem } from './asset-card';

interface AssetDetailModalProps {
  asset: AssetItem | null;
  open: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function AssetDetailModal({ asset, open, onClose, onApprove, onReject }: AssetDetailModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = useCallback(() => {
    if (!asset?.originalUrl) return;
    navigator.clipboard.writeText(asset.originalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [asset?.originalUrl]);

  const handleDownload = useCallback(() => {
    if (!asset?.originalUrl) return;
    const a = document.createElement('a');
    a.href = asset.originalUrl;
    a.download = `asset-${asset.id}.${asset.type === 'VIDEO' ? 'mp4' : 'png'}`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [asset]);

  if (!asset) return null;

  const createdDate = new Date(asset.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {asset.type === 'VIDEO' ? (
              <Video className="h-5 w-5" />
            ) : (
              <ImageIcon className="h-5 w-5" />
            )}
            Asset Detail
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Preview */}
          <div className="relative aspect-square rounded-lg border bg-muted overflow-hidden">
            {asset.thumbnailUrl || asset.originalUrl ? (
              <img
                src={asset.originalUrl ?? asset.thumbnailUrl ?? ''}
                alt={asset.prompt ?? 'Generated asset'}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                {asset.type === 'VIDEO' ? (
                  <Video className="h-16 w-16 text-muted-foreground/30" />
                ) : (
                  <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={handleDownload} disabled={!asset.originalUrl}>
              <Download className="mr-1.5 h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={handleCopyLink} disabled={!asset.originalUrl}>
              {copied ? (
                <>
                  <Copy className="mr-1.5 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Link2 className="mr-1.5 h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>
            {asset.originalUrl && (
              <Button variant="outline" size="icon" asChild>
                <a href={asset.originalUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>

          <Separator />

          {/* Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Info</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Layers className="h-4 w-4" /> Type
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="secondary">{asset.type}</Badge>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" /> Created
              </div>
              <div>{createdDate}</div>

              <div className="flex items-center gap-2 text-muted-foreground">
                Status
              </div>
              <div>
                <AssetStatusBadge status={asset.status as 'APPROVED'} />
              </div>

              {asset.aspectRatio && (
                <>
                  <div className="text-muted-foreground">Aspect Ratio</div>
                  <div>{asset.aspectRatio}</div>
                </>
              )}

              {asset.width && asset.height && (
                <>
                  <div className="text-muted-foreground">Dimensions</div>
                  <div>{asset.width} &times; {asset.height}</div>
                </>
              )}

              {asset.campaign && (
                <>
                  <div className="text-muted-foreground">Campaign</div>
                  <div>{asset.campaign.name}</div>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Quality Scores */}
          {(asset.brandScore != null || asset.qualityScore != null) && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Quality Scores
              </h4>
              {asset.qualityScore != null && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Overall</span>
                    <span className="font-medium">{Math.round(asset.qualityScore * 100)}%</span>
                  </div>
                  <Progress value={asset.qualityScore * 100} />
                </div>
              )}
              {asset.brandScore != null && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Brand DNA</span>
                    <span className="font-medium">{Math.round(asset.brandScore * 100)}%</span>
                  </div>
                  <Progress value={asset.brandScore * 100} />
                </div>
              )}
            </div>
          )}

          {/* Prompt */}
          {asset.prompt && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Prompt</h4>
                <p className="text-sm text-muted-foreground leading-relaxed rounded-md bg-muted p-3">
                  {asset.prompt}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Approve / Reject */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onApprove(asset.id)}
              disabled={asset.status === 'APPROVED'}
            >
              <CheckCircle className="mr-1.5 h-4 w-4 text-green-600" />
              Approve
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onReject(asset.id)}
              disabled={asset.status === 'REJECTED'}
            >
              <XCircle className="mr-1.5 h-4 w-4 text-destructive" />
              Reject
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
