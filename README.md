# Tenderloom Studio

Tenderloom Studio is a premium static web procurement cockpit that helps teams compare vendors, score options transparently, and produce decision-ready evidence.

## Why this project is CV-strong
- Real-world decision workflow instead of a generic CRUD demo
- Clear product framing with measurable problem-to-solution logic
- Professional engineering practices: issues, PR templates, CI, tests, and deploy automation

## Technology stack
- Vite + React + TypeScript
- react-hook-form + zod
- Vitest + Testing Library
- Oxlint + Prettier
- GitHub Actions CI + GitHub Pages deployment

Detailed stack rationale: see docs/STACK.md.

## Local development
1. Install dependencies:
   npm install
2. Start dev server:
   npm run dev
3. Run quality checks:
   npm run lint
   npm run test
   npm run build

## Increment roadmap
The increment plan is documented in docs/INCREMENTS.md.

## Delivery artifacts
- Release notes: docs/RELEASE_NOTES.md
- Screenshot evidence plan: docs/SCREENSHOT_EVIDENCE.md
- Increment 5 summary: docs/INCREMENT_5_SUMMARY.md

## Git workflow expectations
- Open a feature branch per increment or sub-feature
- Create issues before implementation
- Open PRs to document scope, screenshots, and verification
- Keep commits focused and descriptive for audit-quality history

## Deployment
GitHub Pages deployment is automated through .github/workflows/deploy-pages.yml.
