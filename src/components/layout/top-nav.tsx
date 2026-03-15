import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { WorkspaceSwitcher } from './workspace-switcher';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';
import { MobileSidebar } from './mobile-sidebar';

interface TopNavProps {
  workspaceId: string;
  workspaceName: string;
}

export function TopNav({ workspaceId, workspaceName }: TopNavProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4">
      <MobileSidebar workspaceId={workspaceId} />

      <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
        AEGIS
      </Link>

      <Separator orientation="vertical" className="hidden h-6 md:block" />

      <div className="hidden md:block">
        <WorkspaceSwitcher workspaceName={workspaceName} />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
