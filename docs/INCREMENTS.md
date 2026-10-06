# Increment Plan

## Increment 1
- Scaffold project
- Initialize git repository
- Set local planning note as ignored

## Increment 2
- Replace template UI with Tenderloom branded foundation
- Add testing and formatting scripts
- Add CI and GitHub Pages workflows
- Add issue and PR templates

## Increment 3
- Build Vendor Intake form with validation ✅
- Persist vendor records in localStorage ✅
- Add edit and delete interactions ✅

## Increment 4
- Build weighted scoring matrix ✅
- Add recommendation summary output ✅
- Add acceptance tests for scoring logic ✅

## Increment 5
- Build decision memo export view ✅
- Add audit trail timeline ✅
- Final docs, screenshots, and release notes ✅

---

Increments 6-9 are delivered by dedicated agents in `.github/agents/`. Each one reads and updates `docs/handoff/HANDOFF.md`, which carries context across model switches.

## Increment 6 - Cockpit Launch (Claude Sonnet 5) ✅
- Decompose App.tsx into components, hooks, and a domain folder ✅
- App shell with navigation, KPI strip, empty states, sample tender seed ✅
- Atelier Cream design tokens, typography, paper texture, AA contrast ✅
- Original SVG illustrations, brand mark, favicon, image credits ✅
- Before/after screenshots (deferred, see HANDOFF.md)

## Increment 7 - Compliance Engine (Claude Opus 5.5) ✅
- Criteria model with mandatory gates, scored criteria, evidence expiry ✅
- Findings, risk levels, abnormally low tender detection ✅
- Scoring v2 with contribution breakdown, tie-breaks, sensitivity analysis ✅
- Versioned storage migration v1 to v2, audit events, 95% domain coverage ✅ (100% achieved)

## Increment 8 - Decision-Ready Documentation (GPT-6 Astra)
- Decision memo v2 with print/PDF, Markdown, and JSON evidence exports
- Methodology, compliance rulebook, architecture, ADRs, user guide
- Portfolio case study, README refresh, changelog, docs lint in CI

## Increment 9 - Next Level (Grok 4.7)
- Scenario planner, multi-tender workspaces, JSON import/export, command palette
- Espresso dark theme, micro-interactions, PWA offline, code splitting
- Playwright e2e, axe accessibility checks, Lighthouse CI budgets
- v1.0.0 readiness, then hand back to Decision Docs for release refresh
