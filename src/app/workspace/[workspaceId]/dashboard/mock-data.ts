export interface StatCard {
  label: string;
  value: string | number;
  description: string;
}

export interface RecentJob {
  id: string;
  title: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'AWAITING_REVIEW';
  stage?: string;
  progress?: number;
  createdAt: string;
}

export interface RecentAsset {
  id: string;
  thumbnailUrl: string;
  type: 'IMAGE' | 'VIDEO';
  prompt: string;
  brandScore: number;
  createdAt: string;
}

export interface BrandHealth {
  dnaStatus: 'extracted' | 'pending' | 'missing';
  dnaVersion: number;
  confidence: number;
  avgBrandScore: number;
  totalAssets: number;
  approvedRate: number;
}

export const MOCK_STATS: StatCard[] = [
  { label: 'Assets', value: 142, description: '+12 this week' },
  { label: 'Campaigns', value: 8, description: '3 active' },
  { label: 'Running Jobs', value: 2, description: '1 awaiting review' },
  { label: 'DNA Status', value: 'Extracted', description: 'v3 · 92% confidence' },
];

export const MOCK_RECENT_JOBS: RecentJob[] = [
  {
    id: 'job_01',
    title: 'Summer Campaign Hero',
    status: 'RUNNING',
    stage: 'PROMPT_ENGINEERING',
    progress: 45,
    createdAt: '2024-03-15T10:23:00Z',
  },
  {
    id: 'job_02',
    title: 'Product Shot #3',
    status: 'AWAITING_REVIEW',
    stage: 'QUALITY_GATE',
    progress: 83,
    createdAt: '2024-03-15T09:45:00Z',
  },
  {
    id: 'job_03',
    title: 'Brand Banner 16:9',
    status: 'COMPLETED',
    progress: 100,
    createdAt: '2024-03-15T08:30:00Z',
  },
  {
    id: 'job_04',
    title: 'Instagram Story',
    status: 'COMPLETED',
    progress: 100,
    createdAt: '2024-03-14T16:00:00Z',
  },
  {
    id: 'job_05',
    title: 'Failed: Logo Variant',
    status: 'FAILED',
    stage: 'GENERATION',
    progress: 60,
    createdAt: '2024-03-14T14:20:00Z',
  },
];

export const MOCK_RECENT_ASSETS: RecentAsset[] = [
  { id: 'asset_01', thumbnailUrl: '', type: 'IMAGE', prompt: 'Coffee cup lifestyle shot', brandScore: 0.92, createdAt: '2024-03-15T10:00:00Z' },
  { id: 'asset_02', thumbnailUrl: '', type: 'IMAGE', prompt: 'Team meeting workspace', brandScore: 0.87, createdAt: '2024-03-15T09:00:00Z' },
  { id: 'asset_03', thumbnailUrl: '', type: 'VIDEO', prompt: 'Product showcase 15s', brandScore: 0.85, createdAt: '2024-03-14T17:00:00Z' },
  { id: 'asset_04', thumbnailUrl: '', type: 'IMAGE', prompt: 'Hero banner warm tones', brandScore: 0.91, createdAt: '2024-03-14T15:00:00Z' },
  { id: 'asset_05', thumbnailUrl: '', type: 'IMAGE', prompt: 'Social media square', brandScore: 0.78, createdAt: '2024-03-14T12:00:00Z' },
];

export const MOCK_BRAND_HEALTH: BrandHealth = {
  dnaStatus: 'extracted',
  dnaVersion: 3,
  confidence: 0.92,
  avgBrandScore: 0.87,
  totalAssets: 142,
  approvedRate: 0.84,
};
