import { z } from 'zod/v4';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  FAL_KEY: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  USE_MOCK_PROVIDERS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  MOCK_PROVIDER_FAIL_RATE: z.coerce.number().min(0).max(1).default(0),
  USE_STUBS: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error'])
    .default('info'),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(
  processEnv: Record<string, string | undefined> = process.env,
): Env {
  return envSchema.parse(processEnv);
}

let _env: Env | undefined;

export function getEnv(): Env {
  if (!_env) {
    _env = parseEnv();
  }
  return _env;
}

export const env = new Proxy({} as Env, {
  get(_, prop) {
    return getEnv()[prop as keyof Env];
  },
});
