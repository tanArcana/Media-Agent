'use client';

import { Image as ImageIcon, Video, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AssetStatusBadge } from './asset-status-badge';
import { cn } from '@/lib/utils';

export interface AssetItem {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  status: string;
  originalUrl: string | null;
  thumbnailUrl: string | null;
  aspectRatio: string | null;
  width: number | null;
  height: number | null;
  prompt: string | null;
  brandScore: number | null;
  qualityScore: number | null;
  createdAt: string;
  campaign: { id: string; name: string } | null;
}

interface AssetCardProps {
  asset: AssetItem;
  selected: boolean;
  selectionMode: boolean;
  onSelect: (id: string) => void;
  onClick: (asset: AssetItem) => void;
}

export function AssetCard({ asset, selected, selectionMode, onSelect, onClick }: AssetCardProps) {
  const handleClick = () => {
    if (selectionMode) {
      onSelect(asset.id);
    } else {
      onClick(asset);
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(asset.id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'group relative aspect-square rounded-lg border bg-muted overflow-hidden cursor-pointer transition-all',
        'hover:ring-2 hover:ring-ring',
        selected && 'ring-2 ring-primary',
      )}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
    >
      {/* Thumbnail or placeholder */}
      {asset.thumbnailUrl ? (
        <img
          src={asset.thumbnailUrl}
          alt={asset.prompt ?? 'Generated asset'}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          {asset.type === 'VIDEO' ? (
            <Video className="h-10 w-10 text-muted-foreground/40" />
          ) : (
            <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
          )}
        </div>
      )}

      {/* Selection checkbox */}
      <div
        className={cn(
          'absolute top-2 left-2 z-10 h-5 w-5 rounded border-2 flex items-center justify-center transition-all',
          selectionMode || selected
            ? 'opacity-100'
            : 'opacity-0 group-hover:opacity-100',
          selected
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-white/80 bg-black/20',
        )}
        onClick={handleCheckboxClick}
      >
        {selected && <Check className="h-3 w-3" />}
      </div>

      {/* Status badge top-right */}
      <div className="absolute top-2 right-2">
        <AssetStatusBadge status={asset.status as 'APPROVED' | 'PENDING' | 'GENERATING' | 'AWAITING_REVIEW' | 'REJECTED' | 'FAILED'} />
      </div>

      {/* Type badge for video */}
      {asset.type === 'VIDEO' && (
        <div className="absolute bottom-2 left-2">
          <Badge variant="secondary" className="text-[10px] bg-black/50 text-white border-0">
            <Video className="mr-1 h-3 w-3" />
            Video
          </Badge>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs text-white line-clamp-2">{asset.prompt ?? 'No prompt'}</p>
        <div className="mt-1 flex items-center gap-2">
          {asset.brandScore != null && (
            <Badge variant="secondary" className="text-[10px] bg-white/20 text-white border-0">
              {Math.round(asset.brandScore * 100)}% brand
            </Badge>
          )}
          {asset.campaign && (
            <Badge variant="secondary" className="text-[10px] bg-white/20 text-white border-0 truncate max-w-[100px]">
              {asset.campaign.name}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
