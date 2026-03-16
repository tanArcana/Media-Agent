import { redirect } from 'next/navigation';

interface SettingsPageProps {
  params: { workspaceId: string };
}

export default function SettingsPage({ params }: SettingsPageProps) {
  redirect(`/workspace/${params.workspaceId}/settings/workspace`);
}
