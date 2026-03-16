import { redirect } from 'next/navigation';

interface WorkspacePageProps {
  params: { workspaceId: string };
}

export default function WorkspacePage({ params }: WorkspacePageProps) {
  redirect(`/workspace/${params.workspaceId}/dashboard`);
}
