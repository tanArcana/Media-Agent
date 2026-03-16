'use client';

import { useState, useCallback } from 'react';
import { z } from 'zod/v4';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Mail, CheckCircle2, XCircle, AlertTriangle, Sparkles } from 'lucide-react';

const NotificationPrefsSchema = z.object({
  onJobComplete: z.boolean(),
  onJobFailed: z.boolean(),
  onReviewRequired: z.boolean(),
  onDnaExtracted: z.boolean(),
  emailDigest: z.enum(['none', 'daily', 'weekly']),
});

export function NotificationPrefsForm() {
  const [onJobComplete, setOnJobComplete] = useState(true);
  const [onJobFailed, setOnJobFailed] = useState(true);
  const [onReviewRequired, setOnReviewRequired] = useState(true);
  const [onDnaExtracted, setOnDnaExtracted] = useState(false);
  const [emailDigest, setEmailDigest] = useState<'none' | 'daily' | 'weekly'>('none');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = useCallback(async () => {
    const parsed = NotificationPrefsSchema.safeParse({
      onJobComplete,
      onJobFailed,
      onReviewRequired,
      onDnaExtracted,
      emailDigest,
    });

    if (!parsed.success) return;

    setSaving(true);
    // In production: POST to /api/settings/notifications
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }, [onJobComplete, onJobFailed, onReviewRequired, onDnaExtracted, emailDigest]);

  const DIGEST_LABELS: Record<string, string> = { none: 'None', daily: 'Daily', weekly: 'Weekly' };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Notifications</CardTitle>
        <CardDescription>Choose which events trigger in-app and email notifications.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <div>
              <Label>Job completed</Label>
              <p className="text-xs text-muted-foreground">When a generation job finishes successfully.</p>
            </div>
          </div>
          <Switch checked={onJobComplete} onCheckedChange={setOnJobComplete} />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <XCircle className="h-4 w-4 text-destructive" />
            <div>
              <Label>Job failed</Label>
              <p className="text-xs text-muted-foreground">When a generation job fails after all retries.</p>
            </div>
          </div>
          <Switch checked={onJobFailed} onCheckedChange={setOnJobFailed} />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <div>
              <Label>Review required</Label>
              <p className="text-xs text-muted-foreground">When an asset needs human approval.</p>
            </div>
          </div>
          <Switch checked={onReviewRequired} onCheckedChange={setOnReviewRequired} />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <div>
              <Label>DNA extracted</Label>
              <p className="text-xs text-muted-foreground">When Brand DNA extraction completes.</p>
            </div>
          </div>
          <Switch checked={onDnaExtracted} onCheckedChange={setOnDnaExtracted} />
        </div>

        <div className="border-t pt-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>Email digest</Label>
                <p className="text-xs text-muted-foreground">Summary email of workspace activity.</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {DIGEST_LABELS[emailDigest]} <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEmailDigest('none')}>None</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEmailDigest('daily')}>Daily</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEmailDigest('weekly')}>Weekly</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>{success && <p className="text-sm text-green-600">Preferences saved</p>}</div>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Preferences'}</Button>
      </CardFooter>
    </Card>
  );
}
