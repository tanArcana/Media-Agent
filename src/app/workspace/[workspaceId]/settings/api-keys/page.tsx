import { ApiKeysForm } from '@/components/settings/api-keys-form';
import { HealthPanel } from '@/components/settings/health-panel';

export default function ApiKeysPage() {
  // In production, read key status from a secure store (not raw values)
  const keyStatus = [
    { name: 'Anthropic', configured: !!process.env.ANTHROPIC_API_KEY },
    { name: 'FAL.ai', configured: !!process.env.FAL_KEY },
    { name: 'AWS S3', configured: !!process.env.AWS_ACCESS_KEY_ID },
    { name: 'Redis', configured: !!process.env.REDIS_URL },
  ];

  return (
    <div className="space-y-6">
      <ApiKeysForm initialStatus={keyStatus} />
      <HealthPanel />
    </div>
  );
}
