import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

interface RouteParams {
  params: { assetId: string };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const asset = await prisma.asset.findUnique({
    where: { id: params.assetId },
    include: {
      campaign: { select: { id: true, name: true } },
      job: { select: { id: true, status: true, currentStage: true, completedAt: true } },
    },
  });

  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  return NextResponse.json(asset);
}

const PatchSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']).optional(),
  humanReviewed: z.literal(true).optional(),
  humanApproved: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const body = await request.json();
  const parsed = PatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const asset = await prisma.asset.update({
    where: { id: params.assetId },
    data: parsed.data,
  });

  return NextResponse.json(asset);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  await prisma.asset.delete({ where: { id: params.assetId } });
  return NextResponse.json({ success: true });
}
