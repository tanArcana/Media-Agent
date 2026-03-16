import { logger } from '@/lib/logger';
import type { StorageProvider } from './s3';

export class MockStorageProvider implements StorageProvider {
  private store = new Map<string, { data: Buffer | Uint8Array; contentType: string }>();

  async upload(key: string, data: Buffer | Uint8Array, contentType: string): Promise<string> {
    logger.info({ key, contentType }, 'Mock storage: uploading');
    this.store.set(key, { data, contentType });
    return this.getUrl(key);
  }

  getUrl(key: string): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    return `${appUrl}/mock-storage/${key}`;
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  // Test helper
  get(key: string) {
    return this.store.get(key);
  }
}
