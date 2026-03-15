import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface BrandHealth {
  dnaStatus: 'extracted' | 'pending' | 'missing';
  dnaVersion: number;
  confidence: number;
  avgBrandScore: number;
  totalAssets: number;
  approvedRate: number;
}

const STATUS_CONFIG = {
  extracted: { icon: CheckCircle2, label: 'Extracted', color: 'text-green-600 dark:text-green-400' },
  pending: { icon: AlertCircle, label: 'Pending', color: 'text-yellow-600 dark:text-yellow-400' },
  missing: { icon: XCircle, label: 'Missing', color: 'text-destructive' },
} as const;

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{Math.round(value * 100)}%</span>
      </div>
      <Progress value={value * 100} />
    </div>
  );
}

export function BrandHealthCard({ health }: { health: BrandHealth }) {
  const statusCfg = STATUS_CONFIG[health.dnaStatus];
  const StatusIcon = statusCfg.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Brand Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-4 w-4 ${statusCfg.color}`} />
          <span className="text-sm font-medium">DNA {statusCfg.label}</span>
          <Badge variant="secondary" className="ml-auto text-xs">
            v{health.dnaVersion}
          </Badge>
        </div>

        <ScoreRow label="DNA Confidence" value={health.confidence} />
        <ScoreRow label="Avg Brand Score" value={health.avgBrandScore} />
        <ScoreRow label="Approval Rate" value={health.approvedRate} />

        <div className="flex items-center justify-between pt-2 border-t text-sm">
          <span className="text-muted-foreground">Total Assets</span>
          <span className="font-medium">{health.totalAssets}</span>
        </div>
      </CardContent>
    </Card>
  );
}
