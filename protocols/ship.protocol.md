# Protocol: Ship

> Cognitive mode: Release engineer

---

## When to use

When the feature is done, reviewed, and ready to merge. This protocol handles
release hygiene so nothing falls through the cracks.

## How to think

You are a disciplined release engineer. The interesting work is done.
Now land the plane cleanly.

## Pre-ship Checklist

### 0. Permissions Pre-flight

- [ ] Check `.claude/settings.json` `permissions.allow` — ensure all commands needed for this ship process (lint, test, build, git, gh) are listed
- [ ] If any non-harmful command is missing (e.g., `Bash(gh *)`), add it to the project settings now so the remaining steps run uninterrupted
- [ ] Never auto-approve destructive commands (force-push, drop, delete remote branches) — those should always prompt
- [ ] **Post-task sweep:** after the ship completes, scan back through this session's bash history and add any safe / read-only commands that triggered prompts (or that you notice are missing) to `.claude/settings.json` so the next session starts smoother. The `fewer-permission-prompts` protocol automates this. Never allowlist destructive commands, message-sending commands (Slack, gh pr create, email), or commands that spend money

### 1. Code Quality

- [ ] Run `pnpm lint` — fix all errors
- [ ] Run `pnpm test:run` — all unit tests pass
- [ ] Run `pnpm test:e2e` — all E2E tests pass
- [ ] Run `pnpm build` — production build succeeds
- [ ] No TypeScript errors (`tsc --noEmit`)

### 1a. Live server smoke (MANDATORY — not optional)

A production build passing does **not** prove runtime health. Boot the dev
server and prove every route renders. See `## Live Server & Route
Verification` at the bottom of this file for the exact commands.

- [ ] `pkill -f "next dev"` then start `pnpm dev` fresh (clear `.next` if the
      previous run crashed)
- [ ] Wait for `http://localhost:3000/` to return `200`
- [ ] Probe every public route + `/auth/signin` + any route this feature
      touched — **all must return `200` or the expected redirect**
- [ ] `grep -cE "⨯|Error|Functions cannot be passed" /tmp/${project}-dev.log`
      returns `0`
- [ ] For UI changes, load each route in Playwright, verify no `pageerror`
      fires and no rendered body contains "Something went wrong"
- [ ] Any failure — resolve the root cause before shipping. Never merge a
      5xx, a persistent console error, or a page stuck on its error
      boundary

### 2. Documentation

- [ ] Feature doc created/updated in `docs/[feature_group]/`
- [ ] `docs/overview/PROJECT.md` updated if scope changed
- [ ] `CHANGELOG.md` updated with the new entry
- [ ] `ARCHITECTURE.md` updated if system design changed
- [ ] `README.md` updated if setup, scripts, stack, or project overview changed
- [ ] **Review findings tracked**: all Critical → TODOS.md "In Progress", Important → TODOS.md "Next Up", Minor → relevant docs
- [ ] **Cyber findings tracked**: all CRITICAL/HIGH → TODOS.md, MEDIUM auto-fixed, LOW → relevant docs

### 3. Git Hygiene

- [ ] Branch is rebased on latest `main`
- [ ] Commits use conventional format (`feat:`, `fix:`, `docs:`, etc.)
- [ ] No debug code, console.logs, or commented-out code
- [ ] No `.env` files or secrets committed

### 4. PR

- [ ] PR title follows conventional commits
- [ ] PR body includes: summary, what changed, how to test
- [ ] Link to relevant docs in `docs/`
- [ ] Screenshots/recordings for UI changes

## Output format

```
## Ship Report: [Feature Name]

### Checklist Results
[Pass/fail for each item above]

### Issues Found
[Any problems discovered during the checklist]

### Actions Taken
[What was fixed during the ship process]

### Ready to Merge?
[Yes/No + any caveats]
```

## Quality Signals

After this protocol is used, observe these signals to determine if it performed well:

| Signal                     | ✅ Good                                                           | ❌ Poor                                                                     |
| -------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Post-merge stability**   | Nothing broke after merge — no hotfixes needed                    | A bug, broken build, or missing dependency was discovered post-merge        |
| **Checklist completeness** | Every item was actually checked, not just rubber-stamped          | A checklist item was marked "pass" but the check wasn't actually run        |
| **PR acceptance rate**     | PR was accepted without revisions (or only minor ones)            | PR needed significant revisions after the ship report said "ready to merge" |
| **Doc completeness**       | All documentation was current after shipping                      | Someone asked a question that should have been in the docs                  |
| **Trivial fix accuracy**   | Trivial issues fixed by the protocol (lint, formatting) were correct | Auto-fixes introduced new issues or changed behavior                        |

> If signals trend ⚠️ or ❌, use the **improve protocol** (`.protocols/improve.protocol.md`) to amend.

---

## Automation

- **Parallel verification**: Run `claude --agent=reviewer` and `claude --agent=qa-runner` in separate worktrees before the ship checklist — review and QA in parallel without blocking each other
- **On a loop**: Use `/loop 5m` to babysit CI/deploy and auto-address review comments

## Rules

- Run every check. Don't skip steps.
- Fix trivial issues yourself (lint, formatting, missing types)
- Flag anything non-trivial for the developer
- The goal is a clean merge with zero post-merge surprises

---

## Live Server & Route Verification

Before calling the work done, confirm the app actually runs. A green
`pnpm build` only proves the code compiles — not that pages render.

### Procedure

1. **Kill any existing dev server** — `pkill -f "next dev"`; `sleep 2`.
2. **Clear stale Turbopack cache if a prior run crashed** —
   `rm -rf .next` (safe; regenerates on start).
3. **Start the dev server in the background** —
   `pnpm dev > /tmp/${project}-dev.log 2>&1 &` then `disown`.
4. **Wait for it to be ready** — poll until `curl` returns `200`:
   ```bash
   until curl -sS -o /dev/null -w '%{http_code}' --max-time 2 \
     http://localhost:3000/ 2>/dev/null | grep -q "^200$"; do sleep 3; done
   ```
5. **Probe every public route + anything the feature touched**:
   ```bash
   for p in / /market-moves /archive /articles /pitches /advertise \
            /pricing /terminal /agi-tracker /auth/signin; do
     printf "%-18s " "$p"
     curl -sS -o /dev/null -w "%{http_code}\n" --max-time 60 \
       "http://localhost:3000$p"
   done
   ```
   All must return `200` (or a known redirect like `307` for auth-gated).
6. **Tail the dev log** — expected count is `0`:
   ```bash
   grep -cE "⨯|Error|Functions cannot be passed" /tmp/${project}-dev.log
   ```
7. **Browser-level probe for UI changes** — load each affected route in
   Playwright's bundled Chromium (no extra install; `@playwright/test` is
   already a devDep). Assert no `pageerror` fires and no rendered body
   contains `Something went wrong` or `Application error`.
   ```bash
   node -e "
     const path = require('path');
     const { chromium } = require(
       path.resolve('./node_modules/.pnpm/playwright@1.58.2/node_modules/playwright')
     );
     (async () => {
       const browser = await chromium.launch();
       const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
       let errors = 0;
       page.on('pageerror', () => { errors++; });
       await page.goto('http://localhost:3000/[route]', { waitUntil: 'domcontentloaded' });
       await page.waitForTimeout(1500);
       const body = await page.evaluate(() => document.body.innerText.slice(0, 200));
       if (body.includes('Something went wrong')) process.exit(1);
       if (errors > 0) process.exit(1);
       await browser.close();
     })();
   "
   ```
8. **If anything failed**, resolve the root cause. Never merge a 5xx,
   persistent console error, or a route stuck on its error boundary —
   suppress the symptom and the next user hits the same thing.

### When to skip

Never skip. The routes you don't check are the ones that break.

### Browser tool

Use **Playwright** (`@playwright/test` — already in devDeps) for all
browser automation. Do not install Puppeteer — Playwright's Chromium is
equivalent and already on disk. For suite-level E2E use `pnpm test:e2e`;
for ad-hoc smoke use the node one-liner above.
