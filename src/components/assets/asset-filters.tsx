'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Filter, Image as ImageIcon, Video, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AssetFilters {
  type?: 'IMAGE' | 'VIDEO';
  status?: string;
  campaignId?: string;
  sortBy: 'createdAt' | 'brandScore' | 'qualityScore';
  sortOrder: 'asc' | 'desc';
}

interface Campaign {
  id: string;
  name: string;
}

interface AssetFiltersBarProps {
  filters: AssetFilters;
  campaigns: Campaign[];
  onChange: (filters: AssetFilters) => void;
}

const STATUSES = [
  { value: 'APPROVED', label: 'Approved' },
  { value: 'AWAITING_REVIEW', label: 'Awaiting Review' },
  { value: 'GENERATING', label: 'Generating' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'FAILED', label: 'Failed' },
] as const;

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'brandScore', label: 'Brand Score' },
  { value: 'qualityScore', label: 'Quality Score' },
] as const;

export function AssetFiltersBar({ filters, campaigns, onChange }: AssetFiltersBarProps) {
  const activeFilterCount = [filters.type, filters.status, filters.campaignId].filter(Boolean).length;

  const clearAll = () => onChange({ sortBy: 'createdAt', sortOrder: 'desc' });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Type filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={filters.type ? 'default' : 'outline'} size="sm">
            {filters.type === 'IMAGE' ? <ImageIcon className="mr-1.5 h-3.5 w-3.5" /> : filters.type === 'VIDEO' ? <Video className="mr-1.5 h-3.5 w-3.5" /> : <Filter className="mr-1.5 h-3.5 w-3.5" />}
            {filters.type ?? 'Type'}
            <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Media Type</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onChange({ ...filters, type: undefined })}>
            All Types
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChange({ ...filters, type: 'IMAGE' })}>
            <ImageIcon className="mr-2 h-4 w-4" /> Image
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChange({ ...filters, type: 'VIDEO' })}>
            <Video className="mr-2 h-4 w-4" /> Video
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={filters.status ? 'default' : 'outline'} size="sm">
            {filters.status ? STATUSES.find(s => s.value === filters.status)?.label : 'Status'}
            <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onChange({ ...filters, status: undefined })}>
            All Statuses
          </DropdownMenuItem>
          {STATUSES.map((s) => (
            <DropdownMenuItem key={s.value} onClick={() => onChange({ ...filters, status: s.value })}>
              {s.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Campaign filter */}
      {campaigns.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={filters.campaignId ? 'default' : 'outline'} size="sm">
              {filters.campaignId
                ? campaigns.find(c => c.id === filters.campaignId)?.name ?? 'Campaign'
                : 'Campaign'}
              <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Campaign</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onChange({ ...filters, campaignId: undefined })}>
              All Campaigns
            </DropdownMenuItem>
            {campaigns.map((c) => (
              <DropdownMenuItem key={c.id} onClick={() => onChange({ ...filters, campaignId: c.id })}>
                {c.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Sort */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Sort: {SORT_OPTIONS.find(s => s.value === filters.sortBy)?.label}
            {filters.sortOrder === 'asc' ? ' ↑' : ' ↓'}
            <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Sort By</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {SORT_OPTIONS.map((s) => (
            <DropdownMenuItem
              key={s.value}
              onClick={() => {
                const newOrder =
                  filters.sortBy === s.value && filters.sortOrder === 'desc' ? 'asc' : 'desc';
                onChange({ ...filters, sortBy: s.value as AssetFilters['sortBy'], sortOrder: newOrder });
              }}
            >
              {s.label}
              {filters.sortBy === s.value && (
                <span className="ml-auto text-muted-foreground">
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Clear filters */}
      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearAll} className={cn('text-muted-foreground')}>
          <X className="mr-1 h-3.5 w-3.5" />
          Clear ({activeFilterCount})
        </Button>
      )}
    </div>
  );
}
