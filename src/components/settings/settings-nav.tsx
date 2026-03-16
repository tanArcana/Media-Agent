'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Building2, Key, Palette, Bell } from 'lucide-react';

const settingsNavItems = [
  { label: 'General', icon: Building2, href: 'workspace' },
  { label: 'API Keys', icon: Key, href: 'api-keys' },
  { label: 'Brand Defaults', icon: Palette, href: 'brand-defaults' },
  { label: 'Notifications', icon: Bell, href: 'notifications' },
];

export function SettingsNav({ workspaceId }: { workspaceId: string }) {
  const pathname = usePathname();
  const base = `/workspace/${workspaceId}/settings`;

  return (
    <nav className="flex gap-1 overflow-x-auto border-b pb-px mb-6">
      {settingsNavItems.map((item) => {
        const href = `${base}/${item.href}`;
        const isActive = pathname === href;

        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap rounded-t-md px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
