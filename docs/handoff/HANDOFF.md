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
| Next phase | Increment 8 - Decision-Ready Documentation |
| Next agent | `Tenderloom 3 - Decision Docs` (GPT-6 Astra) |
| Branch to create | `feat/increment-8-decision-docs` (branch from `feat/increment-7-compliance-engine` until it is merged to `main`) |
| Baseline status | Increment 7 complete; lint, tsc, 153 tests, 100% domain coverage, build all green |

## Parked for later phases

- [Phase 6] Before/after screenshots in `docs/screenshots/increment-6/` - automated capture was unreliable; take them manually or via Playwright in Increment 9
- [Phase 8] Memo is still plain text (`src/domain/memo.ts`); replace with structured `buildDecisionMemo` that consumes `TenderEvaluation` from `src/domain/evaluation.ts`
- [Phase 8] Document the compliance rulebook verbatim from the Increment 7 entry below (constants, finding codes, risk rules, migration)
- [Phase 9] Dark "Espresso" theme: override tokens only; illustrations already use token-driven CSS classes
- [Phase 9] Replace the `window.location.hash` view state with a router only if multi-tender workspaces need it
- [Phase 9] Criteria are global (`tenderloom.criteria.v1`); multi-tender workspaces should scope criteria per tender in the v3 migration
- [Phase 9] Evidence is a text reference only; file attachments would need IndexedDB, not localStorage

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

### Increment 7 - Compliance Engine (Claude Opus 5.5, 2026-10-06)

**Branch:** feat/increment-7-compliance-engine (from feat/increment-6-cockpit-launch)
**Status:** complete

**Delivered**
- Pure compliance engine (`src/domain/compliance.ts`): criteria model, mandatory gates, scored criteria, evidence expiry, evidence-reference checks, abnormally low tender detection, findings, risk levels
- Scoring v2 (`src/domain/scoring.ts`): eligible-only ranking, per-criterion contributions that sum exactly to the total, deterministic tie-breaks, `analyseSensitivity`
- One pipeline `evaluateTender` (`src/domain/evaluation.ts`) used by the app: gates, then ranking, then sensitivity
- Versioned storage: `tenderloom.vendors.v2` with pure `migrateV1toV2`; criteria persisted in `tenderloom.criteria.v1`
- Compliance view: checklist matrix (vendors x criteria), evidence editor, risk register, criteria editor with reset to baseline
- Scoring view: stacked contribution bars, risk column, "Fragile result" banner, "Excluded by mandatory gates" list
- Audit events: `Compliance updated`, `Vendor disqualified`, `Vendor reinstated`, `Criterion added|updated|removed`, `Criteria reset`
- Sample tender now has 5 vendors that exercise every rule (expiring insurance, evidence gap, partial, disqualification, abnormally low bid)
- `@vitest/coverage-v8`, `npm run test:coverage` (95% thresholds on `src/domain/**`), CI now runs it; pure suites use `// @vitest-environment node`

**Key files**
- src/domain/compliance.ts - every rule and constant; read the TSDoc on each export
- src/domain/scoring.ts - `calculateWeightedScores(inputs: ScoringInput[], weights)`, `analyseSensitivity`, `FRAGILE_THRESHOLD`
- src/domain/evaluation.ts - `evaluateTender(vendors, criteria, weights, now): TenderEvaluation`
- src/domain/migrations.ts - `parseLegacyVendors`, `migrateV1toV2`, `MIGRATION_NOTE`
- src/domain/memo.ts - `buildMemoText` (still text), `describeSensitivity`, `describeShift`
- src/hooks/useCriteria.ts, src/hooks/useVendors.ts - state, audit events, disqualification detection
- src/components/compliance/* - matrix, evidence editor, risk register, criteria editor, `statusMeta.ts` (labels/tones)
- src/styles/compliance.css - styles for the above (tokens only)

**Rule constants**

| Constant | Value | Meaning |
| --- | --- | --- |
| `EXPIRY_WARNING_DAYS` | 30 | Evidence expiring within 30 days (inclusive) raises a warning |
| `ABNORMALLY_LOW_RATIO` | 0.8 | Bid strictly below 80% of the median bid is flagged |
| `ABNORMALLY_LOW_MIN_VENDORS` | 3 | Fewer bids than this: no price-risk check |
| `RISK_HIGH_SCORE_BELOW` | 50 | Eligible vendor with compliance score < 50 is high risk |
| `RISK_MEDIUM_SCORE_BELOW` | 75 | Eligible vendor with compliance score < 75 is at least medium risk |
| `STATUS_POINTS` | met 100, partial 50, not-met 0, unknown 0 | Points per scored criterion |
| `FRAGILE_THRESHOLD` | 10 | A leader flip within < 10 weight points marks the result fragile |

**Rules**
- Mandatory `not-met` or expired: vendor disqualified (excluded from ranking, risk `critical`)
- Mandatory `partial` or `unknown`: eligible, `mandatory-unconfirmed` (high)
- Expiry = `expiresAt`, else `evidenceDate + validityDays`, else none. Only checked for `met`/`partial`. Compared as UTC calendar days; valid through the expiry day. Expired counts as `not-met`
- Compliance score = weighted average of scored criteria (weights normalised; all-zero weights count equally; no scored criteria = 100)
- Risk: not eligible = critical; score < 50 or any high finding = high; score < 75 or any warning = medium; else low
- Ranking: on the displayed total (sum of contributions rounded to 0.1). Ties: compliance, cost score, speed score, vendor name, id
- Cost and speed are min-max scaled across eligible vendors only

**Finding codes**

| Code | Severity | When |
| --- | --- | --- |
| `mandatory-failed` | critical | Mandatory criterion not met |
| `mandatory-expired` | critical | Mandatory evidence expired |
| `mandatory-unconfirmed` | high | Mandatory criterion partial or unknown |
| `evidence-expired` | high | Scored evidence expired |
| `price-risk` | high | Abnormally low bid |
| `evidence-expiring` | warning | Expires within 30 days |
| `evidence-gap` | warning | Scored criterion unknown |
| `evidence-missing` | warning | Met/partial, evidence required, no reference |
| `criterion-not-met` | warning | Scored criterion not met |
| `criterion-partial` | info | Scored criterion partially met |

**Contracts / decisions the next agent must respect**
- Storage: `tenderloom.vendors.v2` (vendors + `compliance` map keyed by criterion id), `tenderloom.criteria.v1`, `tenderloom.audit.v1`. `tenderloom.vendors.v1` is read once for migration and never written or deleted (backup)
- Migration: v1 `yes` = every criterion `met` with `MIGRATION_NOTE` (keeps old score of 100, but raises `evidence-missing` warnings, so medium risk); v1 `no` = first mandatory criterion `not-met`
- `VendorRecord.compliant` no longer exists. Missing response for a criterion = `unknown`
- Always go through `evaluateTender`; never rank disqualified vendors
- The baseline checklist is illustrative, not legal advice; keep that wording in docs and memo
- KPI renamed: `compliantShare` is now `eligibleShare` (label "Eligible"); `tenderStatus(vendorCount, eligibleCount)` needs 2 eligible vendors for "ready"
- Score scale changed: no 0.6 non-compliance penalty any more; disqualification replaces it. Totals are not comparable with v1

**Verification**
- lint: pass | tsc -b: pass | test: 153 passed (11 files) | coverage `src/domain/**`: 100% statements/branches/functions/lines | build: pass (JS 352 kB, 107.9 kB gzip)
- Manual: compliance and scoring views checked in the browser at 1360px; fixed a horizontal overflow from the wide matrix (`.main > * { min-width: 0 }`)
- Sample tender (default weights): Northlake 53.4, Harbor & Finch 50, Brightwater 48.1, Meridian 37.2; Cinderline disqualified; result is fragile (compliance weight -7 makes Brightwater leader)

**Known issues / debt**
- Running the whole suite locally on this OneDrive path can hit vitest worker-start timeouts; `--maxWorkers=2` is reliable. CI (Linux) is unaffected
- OneDrive sometimes blocks `Move-Item` over existing files (leaves them empty). Edit files in place instead of rename-swapping
- Memo is still plain text; it now includes risk, sensitivity, and exclusions but needs the Increment 8 redesign
- No undo for evidence edits beyond the audit trail

**Instructions for the next agent**
- Branch from `feat/increment-7-compliance-engine`; run `npm run test:coverage` as the baseline
- Build `buildDecisionMemo(evaluation, weights, now)` on top of `TenderEvaluation`; keep `describeSensitivity`/`describeShift` wording consistent
- Copy the rule constants, rules, and finding codes above into `docs/COMPLIANCE_RULEBOOK.md`; cite the source file for each
- Use the sample tender numbers above for the methodology worked example; regenerate them with the evaluation test if you change the sample
- Do not change domain rules or scoring maths; if a doc reveals a bug, add a failing test and log it here
