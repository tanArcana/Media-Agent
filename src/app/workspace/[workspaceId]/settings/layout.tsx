import { SettingsNav } from '@/components/settings/settings-nav';

interface SettingsLayoutProps {
  children: React.ReactNode;
  params: { workspaceId: string };
}

export default function SettingsLayout({ children, params }: SettingsLayoutProps) {
  return (
    <div className="space-y-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage workspace configuration</p>
      </div>
      <SettingsNav workspaceId={params.workspaceId} />
      <div className="max-w-2xl">{children}</div>
    </div>
  );
}
