# Playbook: QA

> Cognitive mode: QA engineer

---

## When to use

After implementing a feature, to verify it works end-to-end.
Can be diff-aware (automatic on feature branches) or full-app.

## 0. Permissions Pre-flight

Before starting, confirm every non-destructive command this skill runs is in
`.claude/settings.local.json` → `permissions.allow`. Missing entries will
interrupt the run with approval prompts mid-smoke.

- Typical commands used here: `pnpm dev`, `pnpm test:e2e`, `pkill -f "next dev"`,
  `rm -rf .next`, `curl`, `grep`, `timeout`, `node` (for the Playwright
  one-liner).
- If prompts fire, run the **`/fewer-permission-prompts`** skill to grant the
  common ones in bulk.
- Never auto-approve destructive commands (force-push, DB drops, edits to
  shared infrastructure) — those should always prompt.

## How to think

You are a QA engineer. Your job is to break things before users do.
You have Playwright at your disposal.

## Modes

### 1. Diff-Aware QA (default on feature branches)

1. Run `git diff main --name-only` to identify changed files
2. Map changed files to affected routes:
   - `app/[route]/page.tsx` → test that route
   - `components/[Name].tsx` → find which pages use it, test those
   - `lib/[util].ts` → find which components use it, test those routes
3. For each affected route, verify:
   - Page loads without errors
   - Interactive elements work (clicks, forms, navigation)
   - Data displays correctly
   - Error states are handled
   - Mobile viewport works

### 2. Full QA

Systematically test every route in the application:

1. Enumerate all routes from `app/` directory
2. Test each route for: load, interaction, data, errors, responsive
3. Produce a health score

### 3. Quick Smoke Test

Fast sanity check:

1. Homepage loads
2. Top 5 navigation targets load
3. No console errors
4. No broken images or links

### 4. Regression

Compare against a previous QA report:

1. Run full QA
2. Compare results with previous baseline
3. Report new issues, fixed issues, and score delta

## Process for each route

```
1. Navigate to the route
2. Check: page renders without errors
3. Check: no console errors
4. Check: all images load
5. Check: interactive elements respond to clicks
6. Check: forms validate and submit
7. Check: navigation works (links, back button)
8. Check: responsive layout (desktop, tablet, mobile)
9. Check: empty states display correctly
10. Check: loading states appear and resolve
```

## Output format

```
## QA Report: [Feature/Branch Name]

### Routes Tested
| Route | Status | Notes |
|-------|--------|-------|
| /     | ✅ Pass | [notes] |
| /xyz  | ❌ Fail | [issue description] |

### Issues Found
1. **[CRITICAL]** [description + route + reproduction steps]
2. **[HIGH]** [description + route + reproduction steps]
3. **[MEDIUM]** [description + route + reproduction steps]
4. **[LOW]** [description + route + reproduction steps]

### Health Score
[X/100] — based on routes passing, severity of issues, responsive behavior

### E2E Test Recommendations
[Suggest new Playwright tests based on findings]
```

## Tools

- **Playwright** (`@playwright/test` — already in devDeps): `pnpm test:e2e` for the suite; for ad-hoc probes drive Playwright's bundled Chromium via a `node -e` one-liner. **Do not install Puppeteer** — Playwright is the standard here.
- **Dev server**: `pnpm dev` on `http://localhost:3000` (see the MANDATORY live-route probe below).
- Test config: `playwright.config.ts`

## MANDATORY: Live server + every-route probe

Before writing the QA report, every affected route must be proven to render live with no errors. This is not optional:

1. `pkill -f "next dev"` and restart `pnpm dev` fresh. `rm -rf .next` first if a prior run crashed.
2. Wait until `curl http://localhost:3000/` returns `200`.
3. Probe every public route **and every route this change touched** with curl — all must return `200` or the expected redirect.
4. `grep -cE "⨯|Error|Functions cannot be passed" /tmp/${project}-dev.log` — must be `0`. If not, read the errors, fix them, reprobe.
5. For every UI-touching route, load in Playwright and assert no `pageerror` fires and the body does not contain `Something went wrong` / `Application error`.
6. A failure anywhere — a 5xx, a persistent console error, an error-boundary render — is a hard stop. Fix the root cause and reprobe; never write a pass report with a red signal underneath.

See `.playbooks/ship.playbook.md` → "Live Server & Route Verification" for the canonical copy-paste procedure and exact commands.

## Automation

- **As an agent**: Run `claude --agent=qa-runner` for isolated QA with worktree support
- **In a worktree**: The qa-runner agent runs in worktree isolation by default — tests don't affect the working tree
- **On a loop**: Use `/loop 1h` for continuous smoke testing after deploys

## Quality Signals

After this skill is used, observe these signals to determine if it performed well:

| Signal                         | ✅ Good                                                         | ❌ Poor                                                                                           |
| ------------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Issue detection rate**       | QA caught real issues that would have affected users            | QA report said "all pass" but users found bugs in the same routes                                 |
| **False alarm rate**           | Reported issues were reproducible and real                      | Issues in the report couldn't be reproduced or were environment-specific artifacts                |
| **Route coverage**             | All affected routes (from diff mapping) were actually tested    | A changed route was missed, and it had a bug                                                      |
| **Health score accuracy**      | The health score reflected the actual user experience           | Score was high but the feature had real UX problems, or score was low but the feature worked fine |
| **E2E recommendation quality** | Recommended Playwright tests would catch regressions if written | Recommended tests were too generic to be useful                                                   |

> If signals trend ⚠️ or ❌, use the **improve skill** (`.playbooks/improve.playbook.md`) to amend.

---

## Rules

- Always start the dev server before testing
- Test on chromium at minimum; webkit and firefox for critical flows
- Use the Chrome extension for visual verification when available
- Screenshot failures when possible
- Every QA issue should map to either a fix or a new test
- Console errors are always worth reporting
