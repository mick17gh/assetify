# VortAsset — Implementation Plan

**Repo:** `~/DEV/assetmgt` · `main` · Next.js App Router + Prisma/PostgreSQL
**Spec:** `VortAsset Platform.docx` (17 use-case stories, Nov 2026)
**Status:** 87 uncommitted files from a UI/service consistency pass; last commit 3 months ago.
**Purpose of this file:** sequence the gap-closing work so features land on a clean base, not on top of an unreviewed diff.

---

## 0. Current state (verified from code)

**Built and routed**

| Area | Where |
|---|---|
| Org hierarchy: Organization → Branch → Department → Room → Shelf | `prisma/schema.prisma`, `settings/*` |
| Asset register + detail tabs + photos + documents | `app/(dashboard)/assets`, `components/assets` |
| QR / asset tagging + field scan | `api/assets/tag`, `api/locations/tag`, `app/scan` |
| Bulk import (template → parse → confirm) | `api/assets/import/*`, `ImportJob` |
| Movements/transfers + status history | `AssetMovement`, `AssetStatusHistory` |
| Maintenance + requests | `MaintenanceRecord`, `AssetRequest` |
| Condition flags, replacement eval, disposal recs | `ConditionFlag`, `ReplacementEvaluation`, `DisposalRecommendation` |
| Depreciation + budget snapshots | `DepreciationPolicy`, `BudgetForecastSnapshot` |
| Reminders, notifications, audit log | `ReminderSchedule`, `AuditLog`, `lib/reminder-service.ts` |
| Reports + export, offline sync | `api/reports/export`, `api/offline/sync` |

**Gaps against the spec**

| Story | Missing | Severity |
|---|---|---|
| 9 — Verification Campaigns | No `campaign` model, no expected/verified/unregistered dashboard | **Blocker for the product's core offer** |
| 10 — Asset Exceptions | No exception entity; no identified → assigned → investigating → resolved → approved workflow | **Blocker** |
| 17 — Asset timeline | Data exists across 4 tables; no consolidated view | High (differentiator) |
| 14 — Health Check / maturity | Absent entirely | Medium (upsell service) |
| 6 — Assignment acknowledgement | No record of employee acceptance | Medium (audit defensibility) |
| 5 — "Not found" reason + evidence | Partly via `ConditionFlag`; no structured reason/evidence | Medium |

**Also missing:** README is still create-next-app boilerplate; no test suite; no migrations folder discipline documented.

---

## Phase 0 — Stabilise the working tree (before any feature)

**Goal:** know what those 87 files are, before layering features on them.

1. `git diff --stat` review grouped by area (assets / settings / shared / email / css).
2. Decide per group: keep, revert, or split into separate commits.
3. Commit in logical chunks: `ui: detail tabs + loading states`, `chore: email service`, `style: globals`.
4. Run `npm run build` and `npx tsc --noEmit`; fix anything the refactor broke.
5. Replace README with a real one: what the product is, env vars, setup, seed, deploy.

**Done when:** clean tree, build passes, README accurate. **Estimate: 0.5 day.**

> Do not start Phase 1 with an uncommitted 87-file diff. Any bug found later becomes un-bisectable.

---

## Phase 1 — Verification Campaigns (story 9)

**Why first:** it is the parent object for exceptions, verification events and reporting. Exceptions cannot exist without a campaign to attach to.

### Schema

```prisma
enum CampaignStatus { DRAFT SCHEDULED ACTIVE PAUSED COMPLETED CANCELLED }
enum VerificationOutcome { VERIFIED NOT_FOUND UNREGISTERED EXCEPTION }

model VerificationCampaign {
  id             String   @id @default(cuid())
  organizationId String
  name           String            // "H1 2027 Verification"
  description    String?
  status         CampaignStatus @default(DRAFT)
  startDate      DateTime
  endDate        DateTime
  // scope (nullable = all)
  branchIds      String[]          // or join table if you prefer
  departmentIds  String[]
  categoryIds    String[]
  createdById    String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  assignments    CampaignAssignment[]
  verifications  AssetVerification[]
  exceptions     AssetException[]
}

model CampaignAssignment {          // which field officer covers what
  id          String @id @default(cuid())
  campaignId  String
  userId      String
  branchId    String?
  createdAt   DateTime @default(now())
  @@unique([campaignId, userId, branchId])
}

model AssetVerification {
  id           String @id @default(cuid())
  campaignId   String
  assetId      String?              // null when UNREGISTERED
  outcome      VerificationOutcome
  verifiedAt   DateTime @default(now())
  verifiedById String
  locationId   String?              // branch/room/shelf at time of check
  condition    AssetCondition?
  photoKey     String?              // evidence in DO Spaces
  notes        String?
  latitude     Float?
  longitude    Float?

  @@index([campaignId, outcome])
  @@index([assetId])
}
```

**Scope resolution:** "expected assets" = assets in the campaign's branch/department/category scope, active, at campaign start. Store a snapshot list at activation (`CampaignScopeSnapshot`) so the denominator doesn't drift when assets are added mid-campaign.

### API

- `POST /api/campaigns` create (DRAFT)
- `PATCH /api/campaigns/[id]` edit scope/dates
- `POST /api/campaigns/[id]/activate` freeze scope snapshot, status → ACTIVE
- `POST /api/campaigns/[id]/verify` record a verification (asset or unregistered)
- `GET /api/campaigns/[id]/stats` expected / verified / not found / unregistered / exceptions / completion %
- `GET /api/campaigns/[id]/export` CSV + PDF summary

### UI

- `app/(dashboard)/campaigns` — list with status + progress bars
- `app/(dashboard)/campaigns/[id]` — dashboard (the 6 metrics from the spec), tabs: Scope · Officers · Progress by branch · Exceptions · Export
- Scan flow: when a campaign is active, `app/scan` gains a campaign context banner and writes `AssetVerification` instead of only a status change.

### Acceptance criteria

1. Create → activate → verify 3 assets → dashboard shows 3 verified, completion % updates.
2. Verifying an asset outside scope is refused with a clear error.
3. Unregistered asset created from scan appears under "Unregistered", linked to the campaign.
4. Two officers assigned to the same branch both see it in their queue; no duplicate verification rows for the same asset+campaign (unique constraint).
5. Export produces the same numbers as the dashboard.

**Estimate: 3–4 days.**

---

## Phase 2 — Asset Exceptions (story 10)

**Why second:** campaign verification produces discrepancies; without a workflow they are just noise.

### Schema

```prisma
enum ExceptionType { WRONG_LOCATION WRONG_CUSTODIAN MISSING UNREGISTERED DUPLICATE
                     DAMAGED INCORRECT_SERIAL INCORRECT_CATEGORY
                     DISPOSED_BUT_REGISTERED OTHER }
enum ExceptionStatus { IDENTIFIED ASSIGNED INVESTIGATING RESOLVED APPROVED REJECTED }

model AssetException {
  id            String @id @default(cuid())
  campaignId    String?
  assetId       String?
  organizationId String
  type          ExceptionType
  status        ExceptionStatus @default(IDENTIFIED)
  identifiedById String
  identifiedAt  DateTime @default(now())
  assignedToId  String?
  dueDate       DateTime?
  description   String
  resolution    String?
  resolvedAt    DateTime?
  approvedById  String?
  approvedAt    DateTime?

  evidence      ExceptionEvidence[]
  events        ExceptionEvent[]     // state machine audit trail
}

model ExceptionEvent {
  id          String @id @default(cuid())
  exceptionId String
  fromStatus  ExceptionStatus?
  toStatus    ExceptionStatus
  actorId     String
  note        String?
  createdAt   DateTime @default(now())
}
```

**Rule:** status changes only through a transition function — never a free-text update. `RESOLVED` requires `resolution`; `APPROVED` requires `approvedById`.

### API + UI

- Auto-create on verification outcome mismatch (wrong location / wrong custodian / missing / unregistered / damaged).
- `app/(dashboard)/exceptions` — queue with filters (type, status, branch, assignee, due)
- Detail drawer: timeline of `ExceptionEvent`, evidence upload, resolve form, approve action
- Dashboard widget "Assets Requiring Attention" wired to open exceptions

### Acceptance criteria

1. A wrong-location verification creates exactly one exception, linked to campaign + asset.
2. Illegal transition (e.g. IDENTIFIED → APPROVED) is rejected server-side.
3. Resolve without a resolution note fails validation.
4. Exception queue filters match counts in the dashboard widget.
5. Every transition writes an `ExceptionEvent` and an `AuditLog` row.

**Estimate: 3–4 days.**

---

## Phase 3 — Consolidated asset timeline (story 17)

**Why third:** cheap once campaigns and exceptions exist, and it is the clearest "asset intelligence" demo in the spec.

- `GET /api/assets/[id]/timeline` — union of: acquisition, registration, assignment, `AssetMovement`, `AssetStatusHistory`, `MaintenanceRecord`, `AssetVerification`, `AssetException`, `AssetDisposalRecord`.
- One shape: `{ at, type, title, actor, from, to, evidenceUrl, notes }`, sorted desc, cursor-paginated.
- UI: new **Timeline** tab on the asset detail page (replaces scattered history blocks), with type filters.

**Acceptance:** a seeded asset that has been assigned → transferred → repaired → verified → flagged shows all five events in order, each with actor and evidence where present. **Estimate: 1.5 days.**

---

## Phase 4 — Health Check / maturity assessment (story 14)

- `model HealthAssessment { id, organizationId, version, scores Json, overall Decimal, strengths, weaknesses, actions, createdById, createdAt }`
- Questionnaire definition in `constants/health-check.ts`: 14 categories × 5-point scale.
- Weighted scoring function in `lib/health-score.ts` (unit-testable, pure).
- UI: `settings/health-check` wizard → results page with radar chart + printable report.
- Output is a consulting deliverable: PDF with score, strengths, priority actions.

**Acceptance:** completing the wizard stores scores, computes overall, and the PDF matches on-screen numbers. **Estimate: 2 days.**

---

## Phase 5 — Assignment acknowledgement + not-found reasons (stories 6, 5)

- `model AssignmentAcknowledgement { id, assetId, userId, method (CHECKBOX|PIN|SIGNATURE), acceptedAt, ip, userAgent, documentKey? }`
- Assignment flow gains an acceptance step; the asset detail shows "acknowledged on …" with method.
- Extend verification "not found" to a structured `reason` enum (Unable to Locate / Employee No Longer Has Asset / Transferred / Under Repair / In Storage / Disposed / Missing / Other) + required note when `Other`, optional photo.

**Acceptance:** assigning an asset produces an acknowledgement row only after the employee accepts; "not found" without a reason is rejected. **Estimate: 1.5 days.**

---

## Phase 6 — Quality floor

- Vitest for pure logic: scope resolution, health scoring, exception transitions, depreciation math.
- 3 Playwright paths: create campaign → verify → export; wrong-location verification → exception → approve; asset timeline renders seeded history.
- Seed script extended with one full narrative asset (the spec's `ENS-IT-00482`).
- README: setup, env, migrations, seed, deploy target.

**Estimate: 2 days.**

---

## Sequencing and risk

```
Phase 0 (0.5d) ──► Phase 1 (3–4d) ──► Phase 2 (3–4d) ──► Phase 3 (1.5d)
                                        └──► Phase 4 (2d, parallelisable)
                                              └──► Phase 5 (1.5d) ──► Phase 6 (2d)
```

**Risks**

| Risk | Mitigation |
|---|---|
| Campaign scope drifting mid-campaign | Snapshot the expected-asset list at activation; never recompute the denominator |
| Exception workflow bolted onto ad-hoc status updates | Single transition function; no UI path writes `status` directly |
| Verification duplicates from flaky offline sync | Unique `[campaignId, assetId]`; idempotency key on the verify endpoint |
| 87-file diff hides a regression | Phase 0 gate: commit by area before feature work |
| Multi-tenant leakage | Every new model carries `organizationId`; reuse `lib/scoping.ts` helpers, not raw queries |

## Definition of done (whole plan)

- Every spec story 1–17 either implemented or explicitly deferred with a written reason.
- `npm run build`, `tsc --noEmit`, and the new test suite pass.
- One seeded organization with 3 branches, ~50 assets, one completed campaign containing all exception types.
- E&N Synergy can run a verification campaign end to end without developer assistance.
