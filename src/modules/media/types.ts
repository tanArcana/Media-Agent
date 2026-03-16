export interface ImageGenerationParams {
  prompt: string;
  negativePrompt?: string;
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
  guidanceScale?: number;
  seed?: number;
}

export interface ImageGenerationResult {
  providerJobId: string;
  outputUrls: string[];
  metadata: Record<string, unknown>;
}

export interface VideoGenerationParams {
  prompt: string;
  negativePrompt?: string;
  model?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
}

export interface VideoGenerationResult {
  providerJobId: string;
  outputUrls: string[];
  metadata: Record<string, unknown>;
}

export interface MediaProvider {
  generateImage(params: ImageGenerationParams): Promise<ImageGenerationResult>;
  generateVideo(params: VideoGenerationParams): Promise<VideoGenerationResult>;
}
