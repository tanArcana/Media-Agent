import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const AssetsQuerySchema = z.object({
  workspaceId: z.string().min(1),
  type: z.enum(['IMAGE', 'VIDEO']).optional(),
  status: z.enum(['PENDING', 'GENERATING', 'AWAITING_REVIEW', 'APPROVED', 'REJECTED', 'FAILED']).optional(),
  campaignId: z.string().optional(),
  brandDnaId: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  sortBy: z.enum(['createdAt', 'brandScore', 'qualityScore']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const params = Object.fromEntries(searchParams.entries());

  const parsed = AssetsQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid query parameters', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { workspaceId, type, status, campaignId, brandDnaId, cursor, limit, sortBy, sortOrder } = parsed.data;

  const where = {
    workspaceId,
    ...(type && { type }),
    ...(status && { status }),
    ...(campaignId && { campaignId }),
    ...(brandDnaId && { brandDnaId }),
  };

  const assets = await prisma.asset.findMany({
    where,
    include: {
      campaign: { select: { id: true, name: true } },
    },
    orderBy: { [sortBy]: sortOrder },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  const hasMore = assets.length > limit;
  const items = hasMore ? assets.slice(0, limit) : assets;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ items, nextCursor, hasMore });
}
