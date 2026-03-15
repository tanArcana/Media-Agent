import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCards } from '@/components/dashboard/stat-cards';
import { RecentJobs } from '@/components/dashboard/recent-jobs';
import { BrandHealthCard } from '@/components/dashboard/brand-health';
import { RecentAssets } from '@/components/dashboard/recent-assets';
import { LiveJobTicker } from '@/components/dashboard/live-job-ticker';
import {
  MOCK_STATS,
  MOCK_RECENT_JOBS,
  MOCK_RECENT_ASSETS,
  MOCK_BRAND_HEALTH,
} from './mock-data';

interface DashboardPageProps {
  params: { workspaceId: string };
}

export default function DashboardPage({ params }: DashboardPageProps) {
  const { workspaceId } = params;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back</p>
        </div>
        <Link href={`/workspace/${workspaceId}/campaigns`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <StatCards stats={MOCK_STATS} />

      {/* Jobs + Brand health row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <RecentJobs jobs={MOCK_RECENT_JOBS} />
        <BrandHealthCard health={MOCK_BRAND_HEALTH} />
      </div>

      {/* Live SSE ticker */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentAssets assets={MOCK_RECENT_ASSETS} workspaceId={workspaceId} />
        </div>
        <LiveJobTicker />
      </div>
    </div>
  );
}
