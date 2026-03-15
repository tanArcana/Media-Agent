'use client';

import { useState, useEffect, useCallback } from 'react';

export type PipelineStage =
  | 'BRIEF_ANALYSIS'
  | 'DNA_ALIGNMENT'
  | 'PROMPT_ENGINEERING'
  | 'GENERATION'
  | 'QUALITY_GATE'
  | 'DELIVERY';

export interface JobStreamEvent {
  jobId: string;
  type: 'stage_update' | 'completed' | 'failed' | 'awaiting_review';
  stage?: PipelineStage;
  progress?: number;
  message?: string;
  timestamp: string;
}

interface UseJobStreamOptions {
  enabled?: boolean;
}

export function useJobStream(jobId: string | null, opts: UseJobStreamOptions = {}) {
  const { enabled = true } = opts;
  const [events, setEvents] = useState<JobStreamEvent[]>([]);
  const [currentStage, setCurrentStage] = useState<PipelineStage | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');

  const reset = useCallback(() => {
    setEvents([]);
    setCurrentStage(null);
    setProgress(0);
    setStatus('idle');
  }, []);

  useEffect(() => {
    if (!jobId || !enabled) return;

    setStatus('running');
    const eventSource = new EventSource(`/api/pipeline/jobs/${jobId}/stream`);

    eventSource.onmessage = (event) => {
      const data: JobStreamEvent = JSON.parse(event.data);
      setEvents((prev) => [...prev, data]);

      if (data.stage) setCurrentStage(data.stage);
      if (data.progress != null) setProgress(data.progress);

      if (data.type === 'completed') {
        setStatus('completed');
        setProgress(100);
        eventSource.close();
      } else if (data.type === 'failed') {
        setStatus('failed');
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }, [jobId, enabled]);

  return { events, currentStage, progress, status, reset };
}
