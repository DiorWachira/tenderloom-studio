# Agent Handoff Ledger

This file is the **only memory that survives a model switch**. Every agent reads it first and updates it last.

## Protocol (all agents)

1. **On start**: read this file top to bottom, then `docs/INCREMENTS.md`, then skim the files listed under "Key files" in the latest entry. Do not re-plan finished work.
2. **Verify the baseline** before changing anything: from `tenderloom-studio/` run `npm run lint`, `npm run test`, `npm run build`. Record failures you inherited in your entry rather than silently fixing unrelated code.
3. **Branch**: work on `feat/increment-<n>-<slug>`. Conventional Commits grouped by ownership (`feat(ui)`, `feat(domain)`, `test(domain)`, `docs`, `chore(ci)`), tests committed with the code they cover. Never push, merge to `main`, or tag unless the user asks.
4. **Stay in lane**: only do your phase's scope. Log ideas for other phases under "Parked for later phases" instead of building them.
5. **On finish**: append a new entry using the template below, update the "Current baton" block, tick items in `docs/INCREMENTS.md`, then offer the handoff button to the next agent.

## Current baton

| Field | Value |
| --- | --- |
| Next phase | Increment 7 - Compliance Engine |
| Next agent | `Tenderloom 2 - Compliance Engine` (Claude Opus 5.5) |
| Branch to create | `feat/increment-7-compliance-engine` (branch from `feat/increment-6-cockpit-launch` until it is merged to `main`) |
| Baseline status | Increment 6 complete; lint, tsc, 69 tests, build all green |

## Parked for later phases

- [Phase 6] Before/after screenshots in `docs/screenshots/increment-6/` - automated capture was unreliable; take them manually or via Playwright in Increment 9
- [Phase 8] Memo is still plain text (`src/domain/memo.ts`); replace with structured `buildDecisionMemo`
- [Phase 9] Dark "Espresso" theme: override tokens only; illustrations already use token-driven CSS classes
- [Phase 9] Replace the `window.location.hash` view state with a router only if multi-tender workspaces need it

---

## Entry template

```markdown
### Increment <n> - <name> (<model>, <YYYY-MM-DD>)

**Branch:** feat/increment-<n>-<slug>
**Status:** complete | partial (explain)

**Delivered**
- ...

**Key files** (what the next agent must read)
- path - why it matters

**Contracts / decisions the next agent must respect**
- e.g. design tokens in src/styles/tokens.css, domain API signatures, storage keys + version

**Verification**
- lint: pass/fail | test: <n> passed | build: pass/fail
- manual checks done

**Known issues / debt**
- ...

**Instructions for the next agent**
- 3-6 concrete bullets: where to start, what not to touch
```

---

## Log

### Increment 1-5 - Foundation to Release (pre-workflow)

**Status:** complete

**Delivered**
- Vite + React + TS scaffold, CI + GitHub Pages deploy, issue/PR templates
- Vendor intake (react-hook-form + zod), localStorage persistence (`tenderloom.vendors.v1`), edit/delete
- Weighted scoring (`src/scoring.ts`) with tests, recommendation summary
- Decision memo export view, audit trail (`tenderloom.audit.v1`), release docs

**Key files**
- src/App.tsx - single large component holding all UI, schemas, and storage (needs decomposition)
- src/scoring.ts - pure scoring function; compliance is a binary `yes`/`no` with a 0.6 penalty
- src/index.css, src/App.css - current mint/teal theme, Fraunces + Manrope fonts
- docs/INCREMENTS.md - roadmap, now extended with Increments 6-9

**Known issues / debt**
- App.tsx is monolithic; dev-facing "increments" board is rendered in the product UI
- Visual design is plain; no imagery, no app-shell navigation
- Compliance model is too simple for real procurement

### Increment 6 - Cockpit Launch (Claude Sonnet 5, 2026-10-06)

**Branch:** feat/increment-6-cockpit-launch
**Status:** complete (screenshots deferred, see Parked)

**Delivered**
- App.tsx decomposed: `src/domain`, `src/hooks`, `src/components/{layout,overview,vendors,scoring,memo,audit,compliance,ui}`, `src/views`
- Cockpit shell: sticky side rail (drawer under 1024px), top bar with tender status chip, hash-based views (`#/overview|vendors|scoring|compliance|memo|audit`), skip link, focus moves to `<main>` on navigation
- Overview: hero, KPI strip, top-3 podium, derived "path to a decision" checklist; "Load sample tender" seeds 4 demo vendors
- Designed empty states for vendors, scoring, memo, audit, compliance (placeholder "Arrives in Increment 7")
- Atelier Cream tokens, self-hosted Fraunces + Manrope (`@fontsource-variable`), paper grain, token-driven SVG illustrations, logo mark, favicon
- Scoring view: weight presets, effective-share bar, per-vendor score bars

**Key files**
- src/styles/tokens.css - every colour/space/radius/motion value; no hard-coded colours elsewhere
- src/styles/tokens.test.ts - parses tokens.css and asserts WCAG AA contrast; add a pair here for any new colour combination
- src/domain/schemas.ts - zod schemas, `STORAGE_KEYS`, `emptyVendorForm`
- src/domain/scoring.ts - unchanged maths; added `DEFAULT_WEIGHTS`
- src/domain/{kpis,memo,sample,identity,format}.ts - pure helpers, each with tests
- src/hooks/{usePersistentState,useVendors,useAuditTrail,useView}.ts - state and persistence
- src/components/layout/AppShell.tsx + navigation.ts - add new sections by extending `VIEWS` (useView.ts) and `NAV_ITEMS`
- src/components/compliance/ComplianceTeaser.tsx - the slot Increment 7 replaces
- src/assets/illustrations/ - illustrations are React components styled by utility classes in `ui.css` (`f-*`, `s-*`, `sw-*`), so they follow tokens

**Contracts / decisions the next agent must respect**
- Storage keys unchanged: `tenderloom.vendors.v1`, `tenderloom.audit.v1`. Invalid or corrupt stored data silently falls back to empty
- Reuse `Panel`, `PageHeader`, `EmptyState`, `Chip`, `Button`, `Avatar`, `ScoreBar`; plain CSS only, no UI framework
- Chip tones: `ok` (sage), `risk` (danger), `brass`, `accent`, `neutral`. Always render the numeric value as text next to a `ScoreBar`
- Illustrations use classes, not hex values; favicon.svg is the only file with raw hex
- Memo export is now disabled when there are no vendors (previously exported an empty memo)
- `useVendors.loadSample()` replaces the roster; the UI only offers it when the roster is empty or from the overview hero
- Audit action names are matched as strings by the overview checklist: `Weight profile applied`, `Memo exported`
- Vendor `compliant: 'yes' | 'no'` is still the compliance model; the form field "Compliance status" is the one to replace

**Verification**
- lint: pass | tsc -b: pass | test: 69 passed (8 files) | build: pass (JS 323.7 kB, 100.3 kB gzip)
- Contrast: all token text pairs >= 4.5:1 and control border >= 3:1, enforced by tokens.test.ts
- Not verified: visual check in a real browser at 360/768/1280px (screenshot tooling was unreliable); do a quick manual pass

**Known issues / debt**
- No before/after screenshots committed yet
- `npm install` reported 1 high-severity advisory after adding the font packages; not investigated
- Photography was not added; all imagery is original SVG, so docs/CREDITS.md lists only fonts and original art

**Instructions for the next agent**
- Branch from `feat/increment-6-cockpit-launch`; confirm the baseline first
- Build the domain engine in `src/domain/compliance.ts` and keep it React-free; migrate to `tenderloom.vendors.v2` with a pure migration
- Replace `ComplianceTeaser` and the "Compliance status" select with the new UI inside the existing shell and tokens
- Feed compliance results into `calculateWeightedScores` via an adapter, then update `computeKpis` (compliant share) and `buildMemoText`
- Do not restyle or change tokens; add new token pairs to tokens.test.ts if you need new colours
