'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  message?: string;
}

interface HealthData {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  services: ServiceStatus[];
  environment: { useMockProviders: boolean; nodeEnv: string };
}

const STATUS_CONFIG = {
  healthy: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-500/15', label: 'Healthy' },
  degraded: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-500/15', label: 'Degraded' },
  down: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/15', label: 'Down' },
} as const;

export function HealthPanel() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch health status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const overallConfig = data ? STATUS_CONFIG[data.status] : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">System Health</CardTitle>
          <CardDescription>Real-time status of all external services.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchHealth} disabled={loading}>
          <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        {data && overallConfig && (
          <>
            {/* Overall status */}
            <div className={cn('flex items-center gap-2 rounded-md p-3', overallConfig.bg)}>
              <overallConfig.icon className={cn('h-5 w-5', overallConfig.color)} />
              <span className={cn('font-medium', overallConfig.color)}>
                Overall: {overallConfig.label}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                {new Date(data.timestamp).toLocaleTimeString()}
              </span>
            </div>

            {/* Environment info */}
            <div className="flex gap-2">
              <Badge variant="outline">
                {data.environment.nodeEnv}
              </Badge>
              {data.environment.useMockProviders && (
                <Badge variant="secondary">Mock Providers</Badge>
              )}
            </div>

            {/* Service list */}
            <div className="space-y-2">
              {data.services.map((svc) => {
                const cfg = STATUS_CONFIG[svc.status];
                return (
                  <div
                    key={svc.name}
                    className="flex items-center justify-between rounded-md border px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <cfg.icon className={cn('h-4 w-4', cfg.color)} />
                      <div>
                        <p className="text-sm font-medium">{svc.name}</p>
                        {svc.message && (
                          <p className="text-xs text-muted-foreground">{svc.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={cfg.color}>
                        {cfg.label}
                      </Badge>
                      {svc.latencyMs > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">{svc.latencyMs}ms</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {!data && !error && loading && (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
