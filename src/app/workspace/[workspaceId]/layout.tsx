import { TopNav } from '@/components/layout/top-nav';
import { Sidebar } from '@/components/layout/sidebar';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: { workspaceId: string };
}

export default function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { workspaceId } = params;

  return (
    <div className="flex h-screen flex-col">
      <TopNav workspaceId={workspaceId} workspaceName="My Workspace" />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar — hidden on mobile, icon-only on tablet, full on desktop */}
        <aside className="hidden md:block lg:block">
          <div className="hidden lg:block h-full">
            <Sidebar workspaceId={workspaceId} />
          </div>
          <div className="hidden md:block lg:hidden h-full">
            <Sidebar workspaceId={workspaceId} collapsed />
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
