import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Image as ImageIcon, Video } from 'lucide-react';

interface RecentAsset {
  id: string;
  thumbnailUrl: string;
  type: 'IMAGE' | 'VIDEO';
  prompt: string;
  brandScore: number;
  createdAt: string;
}

export function RecentAssets({
  assets,
  workspaceId,
}: {
  assets: RecentAsset[];
  workspaceId: string;
}) {
  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Assets</CardTitle>
        <Link
          href={`/workspace/${workspaceId}/assets`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View All &rarr;
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {assets.map((asset) => (
            <Link
              key={asset.id}
              href={`/workspace/${workspaceId}/assets/${asset.id}`}
              className="group relative aspect-square rounded-md border bg-muted overflow-hidden hover:ring-2 hover:ring-ring transition-all"
            >
              {/* Placeholder thumbnail */}
              <div className="flex h-full items-center justify-center">
                {asset.type === 'VIDEO' ? (
                  <Video className="h-8 w-8 text-muted-foreground/40" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                )}
              </div>

              {/* Overlay on hover */}
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-white truncate">{asset.prompt}</p>
                <Badge
                  variant="secondary"
                  className="mt-1 w-fit text-[10px] bg-white/20 text-white border-0"
                >
                  {Math.round(asset.brandScore * 100)}% match
                </Badge>
              </div>
            </Link>
          ))}
        </div>
        {assets.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No assets yet. Generate your first asset to get started.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
