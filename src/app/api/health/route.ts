import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Alerting thresholds from docs/12_RISKS_AND_FAILURE_MODES.md
const THRESHOLDS = {
  dbLatencyWarningMs: 200,
  dbLatencyCriticalMs: 1000,
  redisLatencyWarningMs: 100,
  redisLatencyCriticalMs: 500,
};

interface ServiceCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  message?: string;
}

async function checkDatabase(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    const status =
      latencyMs > THRESHOLDS.dbLatencyCriticalMs
        ? 'degraded'
        : 'healthy';
    if (latencyMs > THRESHOLDS.dbLatencyWarningMs) {
      logger.warn({ service: 'PostgreSQL', latencyMs }, 'Database latency above warning threshold');
    }
    return { name: 'database', status, latencyMs };
  } catch (err) {
    logger.error({ service: 'PostgreSQL', error: err instanceof Error ? err.message : String(err) }, 'Database health check failed');
    return { name: 'database', status: 'down', latencyMs: Date.now() - start, message: err instanceof Error ? err.message : 'Connection failed' };
  }
}

async function checkRedis(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const Redis = await import('ioredis');
    const redis = new Redis.default(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      connectTimeout: 3000,
      lazyConnect: true,
    });
    await redis.ping();
    await redis.quit();
    const latencyMs = Date.now() - start;
    const status =
      latencyMs > THRESHOLDS.redisLatencyCriticalMs
        ? 'degraded'
        : 'healthy';
    if (latencyMs > THRESHOLDS.redisLatencyWarningMs) {
      logger.warn({ service: 'Redis', latencyMs }, 'Redis latency above warning threshold');
    }
    return { name: 'redis', status, latencyMs };
  } catch (err) {
    logger.error({ service: 'Redis', error: err instanceof Error ? err.message : String(err) }, 'Redis health check failed');
    return { name: 'redis', status: 'down', latencyMs: Date.now() - start, message: err instanceof Error ? err.message : 'Connection failed' };
  }
}

export async function GET() {
  const [db, redis] = await Promise.all([checkDatabase(), checkRedis()]);

  const services = [db, redis];
  const overall = services.every((s) => s.status === 'healthy')
    ? 'healthy'
    : services.some((s) => s.status === 'down')
      ? 'unhealthy'
      : 'degraded';

  logger.info({ healthStatus: overall, services: services.map((s) => ({ name: s.name, status: s.status, latencyMs: s.latencyMs })) }, 'Health check completed');

  const statusCode = overall === 'healthy' ? 200 : overall === 'degraded' ? 200 : 503;
  return NextResponse.json(
    {
      status: overall,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services,
      environment: process.env.NODE_ENV,
    },
    { status: statusCode },
  );
}
