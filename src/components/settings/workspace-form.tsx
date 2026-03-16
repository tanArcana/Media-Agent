'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod/v4';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const WorkspaceSettingsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(64, 'Name must be at most 64 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(48, 'Slug must be at most 48 characters').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase alphanumeric with hyphens only'),
});

interface WorkspaceFormProps {
  workspaceId: string;
  initialData: { name: string; slug: string; plan: string; createdAt: string };
}

export function WorkspaceForm({ workspaceId, initialData }: WorkspaceFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialData.name);
  const [slug, setSlug] = useState(initialData.slug);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const handleSave = useCallback(async () => {
    setErrors({});
    setSuccess(false);

    const parsed = WorkspaceSettingsSchema.safeParse({ name, slug });
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
    const res = await fetch(`/api/settings?workspaceId=${workspaceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });

    if (!res.ok) {
      const data = await res.json();
      setErrors({ form: data.error ?? 'Failed to save' });
      setSaving(false);
      return;
    }

    setSaving(false);
    setSuccess(true);
    router.refresh();
    setTimeout(() => setSuccess(false), 3000);
  }, [name, slug, workspaceId, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Workspace</CardTitle>
        <CardDescription>General workspace settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ws-name">Workspace Name</Label>
          <Input
            id="ws-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Workspace"
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ws-slug">Slug</Label>
          <Input
            id="ws-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="my-workspace"
          />
          {errors.slug && <p className="text-sm text-destructive">{errors.slug}</p>}
        </div>

        <div className="space-y-2">
          <Label>Plan</Label>
          <div>
            <Badge variant="secondary">{initialData.plan}</Badge>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Created</Label>
          <p className="text-sm text-muted-foreground">
            {new Date(initialData.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          {success && <p className="text-sm text-green-600">Saved successfully</p>}
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardFooter>
    </Card>
  );
}
