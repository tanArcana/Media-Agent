'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { AssetCard, type AssetItem } from './asset-card';
import { AssetFiltersBar, type AssetFilters } from './asset-filters';
import { AssetDetailModal } from './asset-detail-modal';
import { BatchActionsBar } from './batch-actions-bar';
import { Image as ImageIcon } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
}

interface AssetGridProps {
  workspaceId: string;
  initialAssets: AssetItem[];
  initialCursor: string | null;
  initialHasMore: boolean;
  campaigns: Campaign[];
}

export function AssetGrid({
  workspaceId,
  initialAssets,
  initialCursor,
  initialHasMore,
  campaigns,
}: AssetGridProps) {
  const [assets, setAssets] = useState<AssetItem[]>(initialAssets);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<AssetFilters>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailAsset, setDetailAsset] = useState<AssetItem | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchAssets = useCallback(
    async (newFilters: AssetFilters, pageCursor?: string | null) => {
      setLoading(true);
      const params = new URLSearchParams({ workspaceId });
      if (newFilters.type) params.set('type', newFilters.type);
      if (newFilters.status) params.set('status', newFilters.status);
      if (newFilters.campaignId) params.set('campaignId', newFilters.campaignId);
      params.set('sortBy', newFilters.sortBy);
      params.set('sortOrder', newFilters.sortOrder);
      if (pageCursor) params.set('cursor', pageCursor);

      const res = await fetch(`/api/assets?${params.toString()}`);
      const data = await res.json();
      setLoading(false);
      return data as { items: AssetItem[]; nextCursor: string | null; hasMore: boolean };
    },
    [workspaceId],
  );

  const handleFilterChange = useCallback(
    async (newFilters: AssetFilters) => {
      setFilters(newFilters);
      setSelectedIds(new Set());
      const data = await fetchAssets(newFilters);
      setAssets(data.items);
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    },
    [fetchAssets],
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || !cursor) return;
    const data = await fetchAssets(filters, cursor);
    setAssets((prev) => [...prev, ...data.items]);
    setCursor(data.nextCursor);
    setHasMore(data.hasMore);
  }, [hasMore, loading, cursor, filters, fetchAssets]);

  // Infinite scroll
  useEffect(() => {
    const node = loaderRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBatchAction = useCallback(
    async (action: 'APPROVED' | 'REJECTED') => {
      const ids = Array.from(selectedIds);
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/assets/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: action, humanReviewed: true, humanApproved: action === 'APPROVED' }),
          }),
        ),
      );
      setAssets((prev) =>
        prev.map((a) =>
          selectedIds.has(a.id) ? { ...a, status: action } : a,
        ),
      );
      setSelectedIds(new Set());
    },
    [selectedIds],
  );

  const handleDownload = useCallback(() => {
    const selected = assets.filter((a) => selectedIds.has(a.id) && a.originalUrl);
    for (const asset of selected) {
      const a = document.createElement('a');
      a.href = asset.originalUrl!;
      a.download = `asset-${asset.id}`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, [assets, selectedIds]);

  const handleSingleApprove = useCallback(
    async (id: string) => {
      await fetch(`/api/assets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED', humanReviewed: true, humanApproved: true }),
      });
      setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'APPROVED' } : a)));
      setDetailAsset((prev) => (prev?.id === id ? { ...prev, status: 'APPROVED' } : prev));
    },
    [],
  );

  const handleSingleReject = useCallback(
    async (id: string) => {
      await fetch(`/api/assets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', humanReviewed: true, humanApproved: false }),
      });
      setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'REJECTED' } : a)));
      setDetailAsset((prev) => (prev?.id === id ? { ...prev, status: 'REJECTED' } : prev));
    },
    [],
  );

  return (
    <div className="space-y-4">
      <AssetFiltersBar filters={filters} campaigns={campaigns} onChange={handleFilterChange} />

      {assets.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium">No assets found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {filters.type || filters.status || filters.campaignId
              ? 'Try adjusting your filters.'
              : 'Generate your first asset to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              selected={selectedIds.has(asset.id)}
              selectionMode={selectedIds.size > 0}
              onSelect={toggleSelect}
              onClick={setDetailAsset}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={loaderRef} className="flex justify-center py-8">
          {loading && (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </div>
      )}

      {/* Batch actions */}
      <BatchActionsBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onDownload={handleDownload}
        onApprove={() => handleBatchAction('APPROVED')}
        onReject={() => handleBatchAction('REJECTED')}
      />

      {/* Detail modal */}
      <AssetDetailModal
        asset={detailAsset}
        open={detailAsset !== null}
        onClose={() => setDetailAsset(null)}
        onApprove={handleSingleApprove}
        onReject={handleSingleReject}
      />
    </div>
  );
}
