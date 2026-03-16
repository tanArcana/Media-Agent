import { logger } from '@/lib/logger';
import type { StorageProvider } from './s3';
import { S3StorageProvider } from './s3';
import { MockStorageProvider } from './mock-storage';

export type { StorageProvider };

let _provider: StorageProvider | undefined;

export function getStorageProvider(): StorageProvider {
  if (_provider) return _provider;

  const useMock = process.env.USE_MOCK_PROVIDERS === 'true';

  if (useMock) {
    logger.info('Using mock storage provider');
    _provider = new MockStorageProvider();
  } else {
    logger.info('Using S3 storage provider');
    _provider = new S3StorageProvider();
  }

  return _provider;
}

export { S3StorageProvider } from './s3';
export { MockStorageProvider } from './mock-storage';
