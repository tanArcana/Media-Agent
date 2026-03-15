# AEGIS — Product Requirements

## Overview

AEGIS is an AI-powered media generation platform that enables brands to produce on-brand visual and video content at scale. It encodes a brand's visual identity into a "Brand DNA" structure and uses that DNA to guide every stage of the media generation pipeline, ensuring consistent, high-quality output.

## Problem Statement

Marketing teams spend hours manually briefing designers and reviewing AI-generated content that drifts off-brand. Existing AI tools produce generic output with no memory of brand guidelines. AEGIS solves this by making brand identity a first-class citizen in the generation process.

## Target Users

| Persona | Pain Point | AEGIS Solution |
|---------|-----------|----------------|
| Brand Manager | AI output never looks on-brand | DNA system enforces brand rules at every step |
| Content Marketer | Too slow to brief designers | Generate campaign assets in minutes |
| Creative Director | No visibility into AI generation decisions | Explainable pipeline with stage-by-stage previews |
| Agency Account Lead | Can't manage multiple brand clients | Multi-tenant workspace isolation |

## Core Features

### 1. Brand DNA System
- Ingest brand guidelines (logo, color palette, typography, tone of voice, visual style)
- Extract structured Brand DNA via AI analysis
- Store and version DNA per brand workspace
- Use DNA as a constraint system throughout generation

### 2. Media Generation Pipeline
- 6-stage pipeline: Brief → DNA Alignment → Prompt Engineering → Generation → Quality Gate → Delivery
- Supports images (static) and short-form video (up to 60s)
- Multiple aspect ratios: 1:1, 16:9, 9:16, 4:5
- Batch generation with campaign-level coherence

### 3. Agent Orchestration
- Orchestrator agent manages pipeline stages
- Specialist sub-agents for each domain (prompt engineering, quality assessment, etc.)
- Human-in-the-loop approval gates
- Automatic retry and fallback strategies

### 4. Campaign Management
- Group assets into campaigns with shared briefs
- Version history and asset comparison
- Export to common formats (PNG, MP4, WebP)
- Integration hooks for DAM systems

### 5. Quality Assurance
- Automated brand compliance scoring
- Content safety filtering
- Resolution and format validation
- Human review queue for borderline assets

## Non-Goals (v1)

- Real-time video generation (>60s)
- Audio generation
- 3D asset generation
- Direct social media publishing
- Multi-language localization of on-screen text

## Success Metrics

| Metric | Target |
|--------|--------|
| Time from brief to first asset | < 3 minutes |
| Brand compliance score (auto-rated) | > 85% |
| User-rated quality approval rate | > 80% |
| Pipeline success rate (no crashes) | > 99% |
| P95 generation latency (image) | < 30s |

## Constraints

- All generated content must pass content safety checks before delivery
- Brand DNA is stored encrypted at rest
- Users may not share Brand DNA across workspaces without explicit export
- The system must support USE_MOCK_PROVIDERS mode for development/testing without incurring FAL costs
