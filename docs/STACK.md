# Tenderloom Studio Stack Decision

## Core stack
- Vite + React + TypeScript for fast builds, predictable types, and static deployment
- react-hook-form + zod for vendor intake validation and safe payload shaping
- Plain CSS with design tokens for bespoke premium visuals without runtime styling overhead

## Quality and verification
- Oxlint for fast lint checks
- Vitest + Testing Library for component and interaction tests
- GitHub Actions for CI and Pages deployment

## Data and persistence
- localStorage (versioned schema) for static hosting compatibility
- JSON export/import for backup and review evidence

## Why this is optimal for 1 to 2 weeks
- No backend complexity; all features remain deployable on GitHub Pages
- Strong product and engineering signal through tests, CI, issue templates, and PR template
- Easy to demonstrate Git workflow with feature branches and documented increments
