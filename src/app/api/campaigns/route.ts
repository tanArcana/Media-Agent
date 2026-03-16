import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get('workspaceId');

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  const campaigns = await prisma.campaign.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, status: true },
  });

  return NextResponse.json(campaigns);
}
