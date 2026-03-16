'use client';

import { useState, useCallback } from 'react';
import { z } from 'zod/v4';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

const BrandDefaultsSchema = z.object({
  defaultMediaType: z.enum(['IMAGE', 'VIDEO']),
  defaultAspectRatio: z.enum(['1:1', '16:9', '9:16', '4:5']),
  autoQualityGate: z.boolean(),
  qualityThreshold: z.coerce.number().min(0).max(1),
  maxRetries: z.coerce.number().int().min(0).max(5),
  requireDnaForGeneration: z.boolean(),
});

interface BrandDefaultsFormProps {
  workspaceId: string;
}

export function BrandDefaultsForm({ workspaceId }: BrandDefaultsFormProps) {
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:5'>('1:1');
  const [autoQualityGate, setAutoQualityGate] = useState(true);
  const [qualityThreshold, setQualityThreshold] = useState('0.85');
  const [maxRetries, setMaxRetries] = useState('3');
  const [requireDna, setRequireDna] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const handleSave = useCallback(async () => {
    setErrors({});
    setSuccess(false);

    const parsed = BrandDefaultsSchema.safeParse({
      defaultMediaType: mediaType,
      defaultAspectRatio: aspectRatio,
      autoQualityGate,
      qualityThreshold,
      maxRetries,
      requireDnaForGeneration: requireDna,
    });

    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const fieldErrors: Record<string, string> = {};
      for (const [key, msgs] of Object.entries(flat.fieldErrors)) {
        if (msgs && msgs.length > 0) fieldErrors[key] = msgs[0];
      }
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    // Store as workspace metadata — in production, use a dedicated table or JSON column
    await fetch(`/api/settings?workspaceId=${workspaceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brandDefaults: parsed.data }),
    });
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }, [mediaType, aspectRatio, autoQualityGate, qualityThreshold, maxRetries, requireDna, workspaceId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Brand Defaults</CardTitle>
        <CardDescription>Default settings for new generation jobs in this workspace.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Media Type */}
        <div className="space-y-2">
          <Label>Default Media Type</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {mediaType} <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
              <DropdownMenuItem onClick={() => setMediaType('IMAGE')}>Image</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMediaType('VIDEO')}>Video</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-2">
          <Label>Default Aspect Ratio</Label>
          <div className="flex gap-2">
            {(['1:1', '16:9', '9:16', '4:5'] as const).map((ratio) => (
              <Button
                key={ratio}
                variant={aspectRatio === ratio ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAspectRatio(ratio)}
              >
                {ratio}
              </Button>
            ))}
          </div>
        </div>

        {/* Auto Quality Gate */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Auto Quality Gate</Label>
            <p className="text-xs text-muted-foreground">
              Automatically evaluate generated assets for brand compliance.
            </p>
          </div>
          <Switch checked={autoQualityGate} onCheckedChange={setAutoQualityGate} />
        </div>

        {/* Quality Threshold */}
        <div className="space-y-2">
          <Label htmlFor="quality-threshold">Quality Threshold (0-1)</Label>
          <Input
            id="quality-threshold"
            type="number"
            step="0.05"
            min="0"
            max="1"
            value={qualityThreshold}
            onChange={(e) => setQualityThreshold(e.target.value)}
          />
          {errors.qualityThreshold && <p className="text-sm text-destructive">{errors.qualityThreshold}</p>}
          <p className="text-xs text-muted-foreground">
            Assets scoring below this are auto-rejected (0.85 recommended).
          </p>
        </div>

        {/* Max Retries */}
        <div className="space-y-2">
          <Label htmlFor="max-retries">Max Retries</Label>
          <Input
            id="max-retries"
            type="number"
            min="0"
            max="5"
            value={maxRetries}
            onChange={(e) => setMaxRetries(e.target.value)}
          />
          {errors.maxRetries && <p className="text-sm text-destructive">{errors.maxRetries}</p>}
        </div>

        {/* Require DNA */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Require Brand DNA</Label>
            <p className="text-xs text-muted-foreground">
              Block generation until Brand DNA is configured for the workspace.
            </p>
          </div>
          <Switch checked={requireDna} onCheckedChange={setRequireDna} />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>{success && <p className="text-sm text-green-600">Defaults saved</p>}</div>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Defaults'}</Button>
      </CardFooter>
    </Card>
  );
}
