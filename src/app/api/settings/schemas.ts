import { z } from 'zod/v4';

// ─── Workspace Settings ─────────────────────────────────────────────────────

export const WorkspaceSettingsSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(64, 'Name must be at most 64 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(48, 'Slug must be at most 48 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
});

export type WorkspaceSettings = z.infer<typeof WorkspaceSettingsSchema>;

// ─── API Keys ────────────────────────────────────────────────────────────────

export const ApiKeysSchema = z.object({
  anthropicApiKey: z
    .string()
    .min(1, 'Anthropic API key is required')
    .regex(/^sk-ant-/, 'Must start with sk-ant-'),
  falKey: z.string().optional(),
  awsAccessKeyId: z.string().optional(),
  awsSecretAccessKey: z.string().optional(),
  awsRegion: z.string().default('us-east-1'),
  awsS3Bucket: z.string().optional(),
});

export type ApiKeys = z.infer<typeof ApiKeysSchema>;

// ─── Brand Defaults ──────────────────────────────────────────────────────────

export const BrandDefaultsSchema = z.object({
  defaultMediaType: z.enum(['IMAGE', 'VIDEO']).default('IMAGE'),
  defaultAspectRatio: z.enum(['1:1', '16:9', '9:16', '4:5']).default('1:1'),
  autoQualityGate: z.boolean().default(true),
  qualityThreshold: z.coerce.number().min(0).max(1).default(0.85),
  maxRetries: z.coerce.number().int().min(0).max(5).default(3),
  requireDnaForGeneration: z.boolean().default(false),
});

export type BrandDefaults = z.infer<typeof BrandDefaultsSchema>;

// ─── Notification Preferences ────────────────────────────────────────────────

export const NotificationPrefsSchema = z.object({
  onJobComplete: z.boolean().default(true),
  onJobFailed: z.boolean().default(true),
  onReviewRequired: z.boolean().default(true),
  onDnaExtracted: z.boolean().default(false),
  emailDigest: z.enum(['none', 'daily', 'weekly']).default('none'),
});

export type NotificationPrefs = z.infer<typeof NotificationPrefsSchema>;
