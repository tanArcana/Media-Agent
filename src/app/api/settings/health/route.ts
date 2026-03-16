import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  message?: string;
}

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { name: 'PostgreSQL', status: 'healthy', latencyMs: Date.now() - start };
  } catch (err) {
    return {
      name: 'PostgreSQL',
      status: 'down',
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Connection failed',
    };
  }
}

async function checkRedis(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const Redis = await import('ioredis');
    const redis = new Redis.default(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      connectTimeout: 3000,
      lazyConnect: true,
    });
    await redis.ping();
    await redis.quit();
    return { name: 'Redis', status: 'healthy', latencyMs: Date.now() - start };
  } catch (err) {
    return {
      name: 'Redis',
      status: 'down',
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Connection failed',
    };
  }
}

async function checkAnthropic(): Promise<ServiceStatus> {
  const start = Date.now();
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return { name: 'Anthropic API', status: 'down', latencyMs: 0, message: 'API key not configured' };
  }
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }],
      }),
      signal: AbortSignal.timeout(10000),
    });
    const latencyMs = Date.now() - start;
    if (res.ok || res.status === 400) {
      // 400 is OK — means API is reachable (may reject minimal payload)
      return { name: 'Anthropic API', status: 'healthy', latencyMs };
    }
    if (res.status === 429) {
      return { name: 'Anthropic API', status: 'degraded', latencyMs, message: 'Rate limited' };
    }
    return { name: 'Anthropic API', status: 'degraded', latencyMs, message: `HTTP ${res.status}` };
  } catch (err) {
    return {
      name: 'Anthropic API',
      status: 'down',
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Connection failed',
    };
  }
}

async function checkFal(): Promise<ServiceStatus> {
  const start = Date.now();
  const key = process.env.FAL_KEY;
  if (!key) {
    return { name: 'FAL.ai', status: 'down', latencyMs: 0, message: 'API key not configured' };
  }
  try {
    const res = await fetch('https://rest.alpha.fal.ai/health', {
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - start;
    return {
      name: 'FAL.ai',
      status: res.ok ? 'healthy' : 'degraded',
      latencyMs,
      ...(!res.ok && { message: `HTTP ${res.status}` }),
    };
  } catch (err) {
    return {
      name: 'FAL.ai',
      status: 'down',
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Connection failed',
    };
  }
}

async function checkS3(): Promise<ServiceStatus> {
  const start = Date.now();
  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  if (!accessKey) {
    return { name: 'AWS S3', status: 'down', latencyMs: 0, message: 'AWS credentials not configured' };
  }
  try {
    const { S3Client, HeadBucketCommand } = await import('@aws-sdk/client-s3');
    const client = new S3Client({
      region: process.env.AWS_REGION ?? 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    await client.send(new HeadBucketCommand({ Bucket: process.env.AWS_S3_BUCKET ?? 'aegis-assets' }));
    return { name: 'AWS S3', status: 'healthy', latencyMs: Date.now() - start };
  } catch (err) {
    return {
      name: 'AWS S3',
      status: 'down',
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Connection failed',
    };
  }
}

export async function GET() {
  const useMock = process.env.USE_MOCK_PROVIDERS === 'true';

  const checks = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkAnthropic(),
    useMock
      ? { name: 'FAL.ai', status: 'healthy' as const, latencyMs: 0, message: 'Mock mode' }
      : checkFal(),
    useMock
      ? { name: 'AWS S3', status: 'healthy' as const, latencyMs: 0, message: 'Mock mode' }
      : checkS3(),
  ]);

  const overall = checks.every((c) => c.status === 'healthy')
    ? 'healthy'
    : checks.some((c) => c.status === 'down')
      ? 'down'
      : 'degraded';

  return NextResponse.json({
    status: overall,
    timestamp: new Date().toISOString(),
    services: checks,
    environment: {
      useMockProviders: useMock,
      nodeEnv: process.env.NODE_ENV ?? 'development',
    },
  });
}
