import { prisma } from '@/lib/prisma';
import { AssetGrid } from '@/components/assets/asset-grid';

interface AssetsPageProps {
  params: { workspaceId: string };
}

export default async function AssetsPage({ params }: AssetsPageProps) {
  const { workspaceId } = params;
  const limit = 24;

  const [dbAssets, campaigns] = await Promise.all([
    prisma.asset.findMany({
      where: { workspaceId },
      include: { campaign: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    }),
    prisma.campaign.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, status: true },
    }),
  ]);

  const hasMore = dbAssets.length > limit;
  const items = hasMore ? dbAssets.slice(0, limit) : dbAssets;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  // Serialize dates for client component
  const serializedAssets = items.map((a) => ({
    id: a.id,
    type: a.type,
    status: a.status,
    originalUrl: a.originalUrl,
    thumbnailUrl: a.thumbnailUrl,
    aspectRatio: a.aspectRatio,
    width: a.width,
    height: a.height,
    prompt: a.prompt,
    brandScore: a.brandScore,
    qualityScore: a.qualityScore,
    createdAt: a.createdAt.toISOString(),
    campaign: a.campaign,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assets</h1>
        <p className="text-muted-foreground">Browse and manage generated assets</p>
      </div>

      <AssetGrid
        workspaceId={workspaceId}
        initialAssets={serializedAssets}
        initialCursor={nextCursor}
        initialHasMore={hasMore}
        campaigns={campaigns}
      />
    </div>
  );
}
