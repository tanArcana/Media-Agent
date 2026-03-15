# AEGIS — UI/UX Specification

## Page Map

```
/                           → Marketing landing page (public)
/sign-in                    → Clerk sign-in
/sign-up                    → Clerk sign-up
/onboarding                 → New workspace setup wizard
/workspace/[id]/
  dashboard                 → Overview: recent assets, active jobs
  campaigns/
    index                   → Campaign list
    [campaignId]/
      index                 → Campaign detail: asset grid, brief
      generate              → Generation form for this campaign
  generate                  → Quick generate (no campaign)
  brand-dna/
    index                   → DNA overview, extraction status
    edit                    → DNA editor
    upload                  → Brand materials upload
  assets/
    index                   → All assets grid/list
    [assetId]               → Asset detail: preview, metadata, quality scores
  settings/
    workspace               → Workspace name, slug, plan
    members                 → Invite/manage members
    billing                 → Plan and usage
/admin (internal only)      → Usage, job queue monitoring
```

## Shell Layout

```
┌─────────────────────────────────────────────────────────┐
│ AEGIS  [Workspace Switcher]              [User Menu]     │ ← Top Nav
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ Sidebar  │          Main Content Area                   │
│          │                                              │
│ Dashboard│                                              │
│ Campaigns│                                              │
│ Generate │                                              │
│ Brand DNA│                                              │
│ Assets   │                                              │
│ Settings │                                              │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

The sidebar collapses to icon-only on tablet screens.

## Key Pages

### Dashboard (`/workspace/[id]/dashboard`)

```
┌─────────────────────────────────────────────────────┐
│ Welcome back, [Name]                                 │
│                                                     │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐ │
│ │ Assets  │ │Campaigns│ │ Running │ │ DNA Status│ │
│ │   142   │ │    8    │ │  Jobs 2 │ │ Extracted │ │
│ └─────────┘ └─────────┘ └─────────┘ └───────────┘ │
│                                                     │
│ Recent Assets                    [View All →]       │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│ │      │ │      │ │      │ │      │ │      │    │
│ │ img  │ │ img  │ │ img  │ │ img  │ │ img  │    │
│ │      │ │      │ │      │ │      │ │      │    │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘    │
│                                                     │
│ Active Jobs                                         │
│ ● Generating "Summer Campaign Hero" — 60%          │
│ ● Awaiting review "Product Shot #3"                │
└─────────────────────────────────────────────────────┘
```

### Generate Page (`/workspace/[id]/generate`)

```
┌─────────────────────────────────────────────────────┐
│ Generate Media                                      │
│                                                     │
│ Brief                                               │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Describe the image or video you want to create  │ │
│ │ ...                                              │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Media Type      Aspect Ratio       Campaign         │
│ ○ Image ● Video  [16:9 ▼]          [None ▼]        │
│                                                     │
│ Reference Images (optional)                         │
│ ┌────────────────┐                                  │
│ │  + Add images  │                                  │
│ └────────────────┘                                  │
│                                                     │
│ [Generate →]                                        │
└─────────────────────────────────────────────────────┘

During generation — progress panel slides in from right:
┌──────────────────┐
│ Generating...    │
│                  │
│ ✓ Brief analysis │
│ ✓ DNA alignment  │
│ ● Crafting prompt│
│ ○ Generating     │
│ ○ Quality check  │
│ ○ Delivering     │
└──────────────────┘
```

### Brand DNA Editor (`/workspace/[id]/brand-dna/edit`)

```
┌─────────────────────────────────────────────────────┐
│ Brand DNA — v3                    [Save] [Preview]  │
│                                                     │
│ ┌─────────────┐ ┌─────────────────────────────────┐ │
│ │ Color       │ │ Primary Colors                  │ │
│ │ Typography  │ │ ┌──┐ ┌──┐ ┌──┐  [+ Add]        │ │
│ │ Visual Style│ │ │  │ │  │ │  │                 │ │
│ │ Composition │ │ └──┘ └──┘ └──┘                 │ │
│ │ Rules       │ │                                 │ │
│ └─────────────┘ │ Forbidden Colors                │ │
│                 │ ┌──┐  [+ Add]                   │ │
│                 │ │  │                             │ │
│                 │ └──┘                             │ │
│                 └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Asset Detail (`/workspace/[id]/assets/[assetId]`)

```
┌─────────────────────────────────────────────────────┐
│ ← Back to Assets                                   │
│                                                     │
│ ┌──────────────────────┐  ┌────────────────────┐   │
│ │                      │  │ Asset Info          │   │
│ │    [Asset Preview]   │  │ Type: Image         │   │
│ │                      │  │ Campaign: Summer    │   │
│ │                      │  │ Created: Mar 15     │   │
│ └──────────────────────┘  │                    │   │
│                           │ Quality Scores      │   │
│                           │ Overall    ████ 87% │   │
│                           │ Brand DNA  ███  82% │   │
│                           │ Safety     █████ 98%│   │
│                           │                    │   │
│                           │ Prompt              │   │
│                           │ [View ▼]            │   │
│                           │                    │   │
│                           │ [Download] [Delete] │   │
│                           └────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Component Library

AEGIS uses **shadcn/ui** components built on Radix UI primitives with Tailwind CSS. Components live in `src/components/ui/`.

Custom AEGIS components live in `src/components/`:

| Component | Description |
|-----------|-------------|
| `AssetCard` | Thumbnail card with status badge, quality scores |
| `AssetGrid` | Responsive masonry grid of AssetCards |
| `GenerationForm` | Multi-step brief input form |
| `PipelineProgress` | Live stage progress tracker |
| `DNAColorPicker` | Color palette editor with brand context |
| `DNATagInput` | Multi-value tag input for style arrays |
| `JobStatusBadge` | Colored status pill |
| `WorkspaceSwitcher` | Dropdown to switch active workspace |
| `BrandScoreBar` | Horizontal progress bar for quality scores |

## Responsive Rules

| Breakpoint | Layout Changes |
|-----------|----------------|
| Mobile (<640px) | Sidebar hidden; bottom nav; single-column grid |
| Tablet (640-1024px) | Sidebar icon-only; 2-column grid |
| Desktop (>1024px) | Full sidebar; 4-column asset grid |

## Real-time Updates

Generation progress is streamed to the browser via **Server-Sent Events (SSE)**:

- Endpoint: `GET /api/pipeline/jobs/[jobId]/stream`
- Events: `stage_update`, `completed`, `failed`, `awaiting_review`
- Client hook: `useJobStream(jobId)` in `src/hooks/use-job-stream.ts`

The pipeline progress panel updates automatically as stages complete.

## Empty States

Every list/grid view has a designed empty state:
- No campaigns → "Create your first campaign" CTA
- No assets → "Generate your first asset" CTA
- No DNA → "Upload your brand guidelines" CTA (blocks generation if DNA required)

## Loading States

- Asset grids: skeleton cards matching expected layout
- Generation form: button disabled with spinner during submission
- DNA editor: field-level skeleton during initial load
