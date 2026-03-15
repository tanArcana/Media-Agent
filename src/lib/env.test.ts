import { describe, it, expect } from 'vitest';
import { parseEnv } from './env';

const validEnv = {
  DATABASE_URL: 'postgresql://postgres:password@localhost:5432/aegis_dev',
  REDIS_URL: 'redis://localhost:6379',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_abc123',
  CLERK_SECRET_KEY: 'sk_test_abc123',
  ANTHROPIC_API_KEY: 'sk-ant-abc123',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  USE_MOCK_PROVIDERS: 'true' as const,
  MOCK_PROVIDER_FAIL_RATE: '0',
  LOG_LEVEL: 'info' as const,
};

describe('parseEnv', () => {
  it('parses valid environment variables', () => {
    const result = parseEnv(validEnv);

    expect(result.DATABASE_URL).toBe(validEnv.DATABASE_URL);
    expect(result.REDIS_URL).toBe(validEnv.REDIS_URL);
    expect(result.USE_MOCK_PROVIDERS).toBe(true);
    expect(result.MOCK_PROVIDER_FAIL_RATE).toBe(0);
    expect(result.LOG_LEVEL).toBe('info');
    expect(result.AWS_REGION).toBe('us-east-1');
  });

  it('transforms USE_MOCK_PROVIDERS to boolean', () => {
    expect(parseEnv({ ...validEnv, USE_MOCK_PROVIDERS: 'true' }).USE_MOCK_PROVIDERS).toBe(true);
    expect(parseEnv({ ...validEnv, USE_MOCK_PROVIDERS: 'false' }).USE_MOCK_PROVIDERS).toBe(false);
  });

  it('applies defaults for optional fields', () => {
    const result = parseEnv(validEnv);

    expect(result.AWS_REGION).toBe('us-east-1');
    expect(result.FAL_KEY).toBeUndefined();
    expect(result.AWS_ACCESS_KEY_ID).toBeUndefined();
  });

  it('throws on missing required fields', () => {
    const { DATABASE_URL: _, ...missingDb } = validEnv;
    expect(() => parseEnv(missingDb)).toThrow();
  });

  it('throws on invalid DATABASE_URL', () => {
    expect(() => parseEnv({ ...validEnv, DATABASE_URL: 'not-a-url' })).toThrow();
  });

  it('throws on invalid LOG_LEVEL', () => {
    expect(() => parseEnv({ ...validEnv, LOG_LEVEL: 'verbose' as 'info' })).toThrow();
  });

  it('throws on MOCK_PROVIDER_FAIL_RATE out of range', () => {
    expect(() => parseEnv({ ...validEnv, MOCK_PROVIDER_FAIL_RATE: '2' })).toThrow();
    expect(() => parseEnv({ ...validEnv, MOCK_PROVIDER_FAIL_RATE: '-1' })).toThrow();
  });

  it('coerces MOCK_PROVIDER_FAIL_RATE from string to number', () => {
    const result = parseEnv({ ...validEnv, MOCK_PROVIDER_FAIL_RATE: '0.5' });
    expect(result.MOCK_PROVIDER_FAIL_RATE).toBe(0.5);
  });
});
