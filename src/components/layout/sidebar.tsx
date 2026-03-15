'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Megaphone,
  Sparkles,
  Dna,
  Image,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  workspaceId: string;
  collapsed?: boolean;
}

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Campaigns', icon: Megaphone, href: '/campaigns' },
  { label: 'Generate', icon: Sparkles, href: '/generate' },
  { label: 'Brand DNA', icon: Dna, href: '/brand-dna' },
  { label: 'Assets', icon: Image, href: '/assets' },
  { label: 'Settings', icon: Settings, href: '/settings/workspace' },
];

export function Sidebar({ workspaceId, collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const base = `/workspace/${workspaceId}`;

  return (
    <nav
      className={cn(
        'flex h-full flex-col gap-1 border-r bg-background px-2 py-4 transition-all duration-200',
        collapsed ? 'w-[60px]' : 'w-[220px]',
      )}
    >
      {navItems.map((item) => {
        const href = `${base}${item.href}`;
        const isActive =
          pathname === href || pathname.startsWith(`${href}/`);

        const linkContent = (
          <Link
            key={item.href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              collapsed && 'justify-center px-2',
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );

        if (collapsed) {
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        }

        return linkContent;
      })}
    </nav>
  );
}
