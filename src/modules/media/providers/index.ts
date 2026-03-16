import { logger } from '@/lib/logger';
import type { MediaProvider } from '../types';
import { MockMediaProvider } from './mock';
import { FalMediaProvider } from './fal';

let _provider: MediaProvider | undefined;

export function getMediaProvider(): MediaProvider {
  if (_provider) return _provider;

  const useMock = process.env.USE_MOCK_PROVIDERS === 'true';

  if (useMock) {
    const failRate = parseFloat(process.env.MOCK_PROVIDER_FAIL_RATE ?? '0');
    logger.info({ failRate }, 'Using mock media provider');
    _provider = new MockMediaProvider(failRate);
  } else {
    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      throw new Error('FAL_KEY is required when USE_MOCK_PROVIDERS is not true');
    }
    logger.info('Using FAL media provider');
    _provider = new FalMediaProvider(falKey);
  }

  return _provider;
}

export { MockMediaProvider } from './mock';
export { FalMediaProvider } from './fal';
