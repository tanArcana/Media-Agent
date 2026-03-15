'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Radio } from 'lucide-react';

interface TickerEvent {
  jobId: string;
  title: string;
  stage: string;
  progress: number;
  timestamp: string;
}

const STAGE_LABELS: Record<string, string> = {
  BRIEF_ANALYSIS: 'Brief Analysis',
  DNA_ALIGNMENT: 'DNA Alignment',
  PROMPT_ENGINEERING: 'Prompt Engineering',
  GENERATION: 'Generating',
  QUALITY_GATE: 'Quality Gate',
  DELIVERY: 'Delivering',
};

/**
 * Simulates SSE events locally for demonstration.
 * In production this would connect to /api/pipeline/jobs/[jobId]/stream.
 */
function useMockSSE(): TickerEvent[] {
  const [events, setEvents] = useState<TickerEvent[]>([
    {
      jobId: 'job_01',
      title: 'Summer Campaign Hero',
      stage: 'PROMPT_ENGINEERING',
      progress: 45,
      timestamp: new Date().toISOString(),
    },
  ]);

  useEffect(() => {
    const stages = [
      'PROMPT_ENGINEERING',
      'GENERATION',
      'GENERATION',
      'QUALITY_GATE',
      'DELIVERY',
    ];
    let idx = 0;

    const interval = setInterval(() => {
      if (idx >= stages.length) {
        clearInterval(interval);
        return;
      }
      const stage = stages[idx];
      const progress = Math.min(100, 45 + (idx + 1) * 12);
      idx++;

      setEvents((prev) => [
        {
          jobId: 'job_01',
          title: 'Summer Campaign Hero',
          stage,
          progress,
          timestamp: new Date().toISOString(),
        },
        ...prev.slice(0, 4),
      ]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return events;
}

export function LiveJobTicker() {
  const events = useMockSSE();
  const latest = events[0];

  if (!latest) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-blue-500 animate-pulse" />
          <CardTitle className="text-lg">Live Feed</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Current job highlight */}
        <div className="rounded-md border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium truncate">{latest.title}</span>
            <Badge variant="outline" className="text-xs shrink-0">
              {STAGE_LABELS[latest.stage] ?? latest.stage}
            </Badge>
          </div>
          <Progress value={latest.progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground">
            {latest.progress}% complete
          </p>
        </div>

        {/* Event log */}
        <div className="space-y-1.5">
          {events.slice(0, 5).map((event, i) => (
            <div
              key={`${event.jobId}-${event.stage}-${i}`}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
              <span className="truncate">
                {event.title} &mdash; {STAGE_LABELS[event.stage] ?? event.stage}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
