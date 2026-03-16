import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AssetStatusBadge } from '@/components/assets/asset-status-badge';
import { AssetActions } from '@/components/assets/asset-actions';
import {
  ArrowLeft,
  Image as ImageIcon,
  Video,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface AssetDetailPageProps {
  params: { workspaceId: string; assetId: string };
}

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const { workspaceId, assetId } = params;

  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    include: {
      campaign: { select: { id: true, name: true } },
      job: { select: { id: true, status: true, currentStage: true, completedAt: true } },
    },
  });

  if (!asset || asset.workspaceId !== workspaceId) {
    notFound();
  }

  const createdDate = asset.createdAt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      <Link href={`/workspace/${workspaceId}/assets`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Assets
        </Button>
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Preview */}
        <div className="relative aspect-video rounded-lg border bg-muted overflow-hidden flex items-center justify-center">
          {asset.originalUrl ? (
            <img
              src={asset.originalUrl}
              alt={asset.prompt ?? 'Generated asset'}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground/30">
              {asset.type === 'VIDEO' ? (
                <Video className="h-20 w-20" />
              ) : (
                <ImageIcon className="h-20 w-20" />
              )}
              <span className="text-sm">No preview available</span>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <AssetActions assetId={asset.id} originalUrl={asset.originalUrl} type={asset.type} status={asset.status} />

          <Separator />

          {/* Asset Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Asset Info</h3>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Layers className="h-4 w-4" /> Type
              </div>
              <div>
                <Badge variant="secondary">{asset.type}</Badge>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" /> Created
              </div>
              <div>{createdDate}</div>

              <div className="text-muted-foreground">Status</div>
              <div>
                <AssetStatusBadge status={asset.status} />
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
                  <div>
                    <Link
                      href={`/workspace/${workspaceId}/campaigns/${asset.campaign.id}`}
                      className="text-primary hover:underline"
                    >
                      {asset.campaign.name}
                    </Link>
                  </div>
                </>
              )}

              {asset.providerModel && (
                <>
                  <div className="text-muted-foreground">Model</div>
                  <div className="text-xs font-mono">{asset.providerModel}</div>
                </>
              )}
            </div>
          </div>

          {/* Quality Scores */}
          {(asset.brandScore != null || asset.qualityScore != null) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Quality Scores
                </h3>
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
            </>
          )}

          {/* Prompt */}
          {asset.prompt && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Prompt</h3>
                <p className="text-sm text-muted-foreground leading-relaxed rounded-md bg-muted p-3">
                  {asset.prompt}
                </p>
              </div>
            </>
          )}

          {asset.negativePrompt && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Negative Prompt</h3>
              <p className="text-sm text-muted-foreground leading-relaxed rounded-md bg-muted p-3">
                {asset.negativePrompt}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
