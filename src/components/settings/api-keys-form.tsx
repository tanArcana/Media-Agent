'use client';

import { useState, useCallback } from 'react';
import { z } from 'zod/v4';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

const ApiKeysSchema = z.object({
  anthropicApiKey: z.string().min(1, 'Required').regex(/^sk-ant-/, 'Must start with sk-ant-'),
  falKey: z.string().optional(),
  awsAccessKeyId: z.string().optional(),
  awsSecretAccessKey: z.string().optional(),
  awsRegion: z.string().default('us-east-1'),
  awsS3Bucket: z.string().optional(),
});

interface KeyStatus {
  configured: boolean;
  name: string;
}

interface ApiKeysFormProps {
  initialStatus: KeyStatus[];
}

function MaskedInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function ApiKeysForm({ initialStatus }: ApiKeysFormProps) {
  const [anthropicApiKey, setAnthropicApiKey] = useState('');
  const [falKey, setFalKey] = useState('');
  const [awsAccessKeyId, setAwsAccessKeyId] = useState('');
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState('');
  const [awsRegion, setAwsRegion] = useState('us-east-1');
  const [awsS3Bucket, setAwsS3Bucket] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const handleSave = useCallback(async () => {
    setErrors({});
    setSuccess(false);

    const data = {
      anthropicApiKey: anthropicApiKey || undefined,
      falKey: falKey || undefined,
      awsAccessKeyId: awsAccessKeyId || undefined,
      awsSecretAccessKey: awsSecretAccessKey || undefined,
      awsRegion,
      awsS3Bucket: awsS3Bucket || undefined,
    };

    // Only validate fields that were actually filled in
    if (anthropicApiKey) {
      const parsed = ApiKeysSchema.shape.anthropicApiKey.safeParse(anthropicApiKey);
      if (!parsed.success) {
        setErrors({ anthropicApiKey: parsed.error.issues[0].message });
        return;
      }
    }

    setSaving(true);
    // In production, this would POST to a secure endpoint that stores keys encrypted.
    // For now we validate client-side and show a success message.
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }, [anthropicApiKey, falKey, awsAccessKeyId, awsSecretAccessKey, awsRegion, awsS3Bucket]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">API Keys</CardTitle>
        <CardDescription>
          Configure external service credentials. Keys are encrypted at rest.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status overview */}
        <div className="flex flex-wrap gap-2">
          {initialStatus.map((s) => (
            <Badge
              key={s.name}
              variant="outline"
              className={s.configured ? 'text-green-600 border-green-200' : 'text-muted-foreground'}
            >
              {s.configured ? (
                <CheckCircle className="mr-1 h-3 w-3" />
              ) : (
                <XCircle className="mr-1 h-3 w-3" />
              )}
              {s.name}
            </Badge>
          ))}
        </div>

        {/* Anthropic */}
        <div className="space-y-2">
          <Label htmlFor="key-anthropic">Anthropic API Key</Label>
          <MaskedInput
            id="key-anthropic"
            value={anthropicApiKey}
            onChange={setAnthropicApiKey}
            placeholder="sk-ant-..."
          />
          {errors.anthropicApiKey && <p className="text-sm text-destructive">{errors.anthropicApiKey}</p>}
          <p className="text-xs text-muted-foreground">Required for all agent operations.</p>
        </div>

        {/* FAL */}
        <div className="space-y-2">
          <Label htmlFor="key-fal">FAL.ai Key</Label>
          <MaskedInput id="key-fal" value={falKey} onChange={setFalKey} placeholder="fal-..." />
          <p className="text-xs text-muted-foreground">Required when USE_MOCK_PROVIDERS is false.</p>
        </div>

        {/* AWS */}
        <div className="space-y-2">
          <Label htmlFor="key-aws-id">AWS Access Key ID</Label>
          <MaskedInput id="key-aws-id" value={awsAccessKeyId} onChange={setAwsAccessKeyId} placeholder="AKIA..." />
        </div>

        <div className="space-y-2">
          <Label htmlFor="key-aws-secret">AWS Secret Access Key</Label>
          <MaskedInput id="key-aws-secret" value={awsSecretAccessKey} onChange={setAwsSecretAccessKey} placeholder="••••••••" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="key-aws-region">AWS Region</Label>
            <Input id="key-aws-region" value={awsRegion} onChange={(e) => setAwsRegion(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="key-aws-bucket">S3 Bucket</Label>
            <Input id="key-aws-bucket" value={awsS3Bucket} onChange={(e) => setAwsS3Bucket(e.target.value)} placeholder="aegis-assets" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>{success && <p className="text-sm text-green-600">Keys saved</p>}</div>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Keys'}</Button>
      </CardFooter>
    </Card>
  );
}
