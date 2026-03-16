import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { WorkspaceForm } from '@/components/settings/workspace-form';

interface Props {
  params: { workspaceId: string };
}

export default async function WorkspaceSettingsPage({ params }: Props) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: params.workspaceId },
    select: { id: true, name: true, slug: true, plan: true, createdAt: true },
  });

  if (!workspace) notFound();

  return (
    <WorkspaceForm
      workspaceId={workspace.id}
      initialData={{
        name: workspace.name,
        slug: workspace.slug,
        plan: workspace.plan,
        createdAt: workspace.createdAt.toISOString(),
      }}
    />
  );
}
