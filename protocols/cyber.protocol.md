# Protocol: Cyber

> Cognitive mode: Application security engineer
> Purpose: Identify, catalogue, and resolve security vulnerabilities before merge.

---

## When to use

After Review + QA, before Documentation and Ship. The review skill has a surface-level
"Security & Trust" checklist — this skill goes deeper. It is a dedicated security audit
that maps findings to OWASP categories, checks dependencies, and auto-fixes what it can.

## 0. Permissions Pre-flight

Before starting, confirm every non-destructive command this skill runs is in
`.claude/settings.local.json` → `permissions.allow`. Missing entries will
interrupt the audit with approval prompts mid-scan.

- Typical commands used here: `pnpm audit`, `pnpm lint`, `pnpm test:run`,
  `pnpm build`, `pnpm update`, `git diff`, `grep`, `curl`, `pkill`, `timeout`,
  `node`.
- If prompts fire, run the **`/fewer-permission-prompts`** skill to batch-grant
  the common ones.
- Never auto-approve destructive commands (force-push, `rm -rf` outside
  `.next`, DB drops, infra edits, `pnpm audit fix --force`) — those should
  always prompt.

## How to think

You are an application security engineer performing a targeted audit of a web application.
You know that most vulnerabilities are mundane — unsanitized input, leaked secrets,
misconfigured headers — not exotic zero-days. You focus on what actually gets exploited.

Your stack context: Next.js 16 (App Router), React 19, TypeScript, Prisma 7, MUI v7.
Read `MODELS.md` for full project conventions.

## Modes

### 1. Diff-Aware Audit (default on feature branches)

1. Run `git diff main --name-only` to identify changed files
2. Classify each changed file by attack surface:
   - `app/api/` routes → **Input validation, auth, injection**
   - `app/*/page.tsx` → **XSS, data exposure, SSRF in server components**
   - `components/` → **XSS via props, unsafe `dangerouslySetInnerHTML`**
   - `lib/` utilities → **Injection, secrets leakage, unsafe deserialization**
   - `prisma/` schema/migrations → **SQL injection surface, access control**
   - `middleware.ts` → **Auth bypass, header manipulation**
   - Config files → **Misconfiguration, exposed secrets**
   - `package.json` → **Dependency vulnerabilities**
3. Audit each file against the relevant threat categories below

### 2. Full Audit

Systematic security review of the entire application:

1. **Live probe first** — boot `pnpm dev` (kill any stale one, `rm -rf .next` if crashed), wait for `curl http://localhost:3000/` to return `200`, then probe every public route and confirm each returns `200` / expected redirect. Grep the dev log for `⨯|Error` — must be `0`. A security audit on a broken app is noise, and a broken app IS a finding (error boundaries leak stack traces / data / can bypass auth). Use **Playwright** (already installed via `@playwright/test`) for any browser-level probe — never install Puppeteer. See `.protocols/ship.protocol.md` → "Live Server & Route Verification".
2. Enumerate all API routes, pages, middleware, and utilities
3. Audit each against all threat categories
4. Run dependency vulnerability check
5. Produce a full security posture report

### 3. Dependency Audit

Focused check on third-party packages:

1. Run `pnpm audit` for known CVEs
2. Check for outdated packages with known vulnerabilities
3. Review `package.json` for unnecessary or risky dependencies
4. Flag packages that haven't been updated in 12+ months

## Threat Categories

### T1: Injection (OWASP A03)

- [ ] SQL injection via raw queries or unsafe Prisma usage (`$queryRaw`, `$executeRaw` with string interpolation)
- [ ] NoSQL injection patterns
- [ ] Command injection via `child_process`, `exec`, or shell commands
- [ ] Template injection in server-rendered content
- [ ] Header injection in API responses

### T2: Cross-Site Scripting — XSS (OWASP A03)

- [ ] `dangerouslySetInnerHTML` used without sanitization (DOMPurify or equivalent)
- [ ] User input rendered without escaping in server components
- [ ] URL parameters reflected in page content
- [ ] Stored XSS via database fields rendered unsanitized
- [ ] SVG/image content with embedded scripts

### T3: Broken Authentication & Authorization (OWASP A01, A07)

- [ ] API routes missing authentication checks
- [ ] Server actions missing authorization verification
- [ ] Route handlers accessible without proper session validation
- [ ] Insecure session configuration (missing `httpOnly`, `secure`, `sameSite` flags)
- [ ] Privilege escalation — users accessing resources they shouldn't
- [ ] IDOR (Insecure Direct Object Reference) — user-controlled IDs without ownership checks

### T4: Sensitive Data Exposure (OWASP A02)

- [ ] Secrets in client-side code (API keys, tokens, connection strings)
- [ ] `.env` values leaked to client components (only `NEXT_PUBLIC_*` should be client-accessible)
- [ ] Sensitive data in error messages or stack traces
- [ ] PII or credentials in logs (`console.log`, server logs)
- [ ] Sensitive data in URL parameters (appears in browser history, server logs)
- [ ] Missing `"use server"` on functions that handle sensitive data

### T5: Security Misconfiguration (OWASP A05)

- [ ] Missing or weak CSP (Content Security Policy) headers
- [ ] Missing `X-Frame-Options` / `X-Content-Type-Options` / `Referrer-Policy` headers
- [ ] CORS misconfiguration (overly permissive `Access-Control-Allow-Origin`)
- [ ] Debug mode / verbose error pages in production config
- [ ] Default credentials or development secrets in committed files
- [ ] `next.config.ts` security headers missing or misconfigured

### T6: Vulnerable Dependencies (OWASP A06)

- [ ] Known CVEs in direct dependencies
- [ ] Known CVEs in transitive dependencies
- [ ] Outdated packages with published security advisories
- [ ] Unnecessary dependencies that increase attack surface

### T7: Server-Side Request Forgery — SSRF (OWASP A10)

- [ ] User-controlled URLs passed to `fetch()` in server components or API routes
- [ ] Image URLs from user input without allowlist validation
- [ ] Redirect URLs without origin validation (open redirect)

### T8: Next.js Specific

- [ ] Server Components leaking sensitive data to client (check serialization boundary)
- [ ] Server Actions without input validation or rate limiting
- [ ] `revalidatePath`/`revalidateTag` callable without auth
- [ ] Middleware bypass via `_next/` paths or static file routes
- [ ] API route handlers missing HTTP method validation
- [ ] Dynamic route parameters used unsanitized in database queries

## Severity Classification

| Severity     | Criteria                                                                  | Action                                      |
| ------------ | ------------------------------------------------------------------------- | ------------------------------------------- |
| **CRITICAL** | Exploitable now. Data breach, RCE, auth bypass, secret exposure.          | **Block merge.** Fix immediately or revert. |
| **HIGH**     | Exploitable with moderate effort. XSS, IDOR, SQL injection surface.      | **Block merge.** Fix before ship.           |
| **MEDIUM**   | Requires specific conditions. Missing headers, weak config, info leakage. | **Auto-fix if safe.** Otherwise track.      |
| **LOW**      | Best practice gaps. Hardening opportunities, minor info disclosure.       | **Log and track.** Fix in next cycle.       |

## Resolution Protocol

The cyber skill is unique in that it both identifies **and** resolves issues where safe to do so.
The workflow is: **prioritise → resolve → track**. Every finding gets one of three outcomes: fixed now, fixed in-session with the operator, or added to the backlog with enough context to act on later.

### Step 1: Prioritise

After all findings are classified by severity, sort them into resolution buckets:

| Bucket               | Criteria                                                                   | Action                              |
| -------------------- | -------------------------------------------------------------------------- | ----------------------------------- |
| **Fix now**          | MEDIUM/LOW with a well-known, safe fix. No architectural judgment needed.  | Auto-fix, verify, log.              |
| **Fix in-session**   | HIGH with a clear fix that can be applied and verified right now.          | Apply fix, verify, log.             |
| **Defer to backlog** | HIGH/CRITICAL requiring architectural decisions, planned future work (e.g. auth integration), or cross-cutting changes that affect multiple systems. | Document in TODOS.md Backlog with full context. |

**Key judgment call:** A HIGH finding is only deferred when it genuinely depends on planned work (e.g. "admin auth requires Auth.js which is in the Backlog"). If a HIGH can be fixed with a targeted change (e.g. upgrading a dependency), fix it now — don't defer.

### Step 2: Auto-Fix (MEDIUM and LOW by default)

For issues with well-known, safe fixes — apply the fix directly:

1. Apply the fix
2. Run `pnpm lint` and `pnpm test:run` to verify no regression
3. Log the fix in the audit report under "Resolutions Applied"

**Auto-fixable patterns:**

- Adding missing security headers in `next.config.ts` or middleware
- Adding `httpOnly`, `secure`, `sameSite` to cookie configuration
- Replacing `dangerouslySetInnerHTML` with sanitized alternatives
- Adding input validation to API routes (zod schemas, type guards)
- Adding missing auth checks to unprotected routes
- Removing `console.log` statements that leak sensitive data
- Updating `.env.example` when new secrets are detected
- Upgrading dependencies with known CVEs (`pnpm update [package]`)
- Running `pnpm audit fix` for auto-fixable dependency vulnerabilities

### Step 3: Fix In-Session (HIGH with clear fixes)

For HIGH findings that can be resolved without architectural decisions:

1. Present the finding and proposed fix to the operator
2. On approval, apply the fix
3. Run `pnpm lint`, `pnpm test:run`, and `pnpm build` to verify no regression
4. Log in the audit report under "Resolutions Applied"

**Common in-session fixes:**

- Dependency upgrades for known CVEs
- Adding auth checks to unprotected routes (when auth system exists)
- Input validation gaps with straightforward fixes
- Configuration hardening with clear best practices

### Step 4: Defer to Backlog (requires future work)

For findings that depend on planned work or require architectural judgment:

1. Document the vulnerability with file path, line number, impact, and reproduction steps
2. Provide a specific suggested fix (code snippet or approach)
3. Add to TODOS.md Backlog under a dated `### Security hardening (audits YYYY-MM-DD → YYYY-MM-DD)` subsection. Group by severity (`#### HIGH`, `#### LOW`) and append a `#### RESOLVED (from this audit)` subsection for same-cycle fixes so the lifecycle is visible in one place.
4. Classify as HIGH or LOW within the backlog section
5. Cross-reference related backlog items (e.g. "Requires Auth.js — see Infrastructure backlog")

**Backlog entry format:**

```markdown
- [ ] [Brief description] — [impact/context]. [Suggested approach]. See: `file:line`
```

**Note on labels:** the earlier convention used an inline `[cyber finding]` label on items. Actual practice (as of 2026-04-25) uses the dated `### Security hardening` subsection instead — it reads better and groups a single audit's output together. Use the subsection format; don't add the `[cyber finding]` inline label unless the finding is filed under a non-security category (rare).

### Severity Override

The operator can override the auto-fix threshold:

- `--fix-all`: Auto-fix everything including HIGH (never CRITICAL — those always need human review)
- `--report-only`: Don't fix anything, just produce the audit report
- Default: Auto-fix MEDIUM + LOW, present HIGH for in-session fix or backlog, report CRITICAL

## Process

```
1. Determine mode (diff-aware or full)
2. Enumerate attack surface (files, routes, endpoints)
3. For each file/route:
   a. Check against relevant threat categories (T1–T8)
   b. Classify findings by severity
   c. Auto-fix MEDIUM/LOW issues (verify with lint + tests)
   d. Document HIGH/CRITICAL issues with suggested fixes
4. Run dependency audit (`pnpm audit`)
5. Produce structured audit report
6. Track findings per severity protocol
```

## Output Format

```
## Cyber Audit Report: [Feature/Branch Name]

### Attack Surface
| Surface             | Files Reviewed | Findings |
|---------------------|---------------|----------|
| API Routes          | X             | Y        |
| Pages/Components    | X             | Y        |
| Utilities/Lib       | X             | Y        |
| Configuration       | X             | Y        |
| Dependencies        | X             | Y        |

### Findings

#### CRITICAL
1. **[T-category] [description]**
   - File: `path/to/file.ts:line`
   - Impact: [what an attacker could do]
   - Suggested fix: [specific code change]
   - → Tracked in TODOS.md "In Progress"

#### HIGH
1. **[T-category] [description]**
   - File: `path/to/file.ts:line`
   - Impact: [what an attacker could do]
   - Suggested fix: [specific code change]
   - → Tracked in TODOS.md "Next Up" [cyber finding]

#### MEDIUM (auto-fixed)
1. **[T-category] [description]**
   - File: `path/to/file.ts:line`
   - Resolution: [what was changed]
   - Verified: lint ✅ tests ✅

#### LOW (tracked)
1. **[T-category] [description]**
   - File: `path/to/file.ts:line`
   - Recommendation: [what to do]
   - → Logged in [relevant doc]

### Dependency Audit
| Package   | Severity | CVE           | Status       |
|-----------|----------|---------------|--------------|
| [name]    | [sev]    | [CVE-XXXX-X] | [fixed/tracked] |

### Resolutions Applied
[List of auto-fixes applied during this audit, with before/after]

### Security Posture Score
[X/100] — based on finding count, severity distribution, and attack surface coverage

### Residual Risk
[Summary of what remains unresolved and the risk it carries]
```

## Findings Tracking (required)

Every finding must be tracked — nothing falls through the cracks.

| Severity     | Outcome          | Where to track                                                                     |
| ------------ | ---------------- | ---------------------------------------------------------------------------------- |
| **CRITICAL** | Blocks merge     | TODOS.md → "In Progress" (must fix before ship)                                   |
| **HIGH**     | Fixed in-session | Audit report → "Resolutions Applied" (mark resolved)                              |
| **HIGH**     | Deferred         | TODOS.md → Backlog → dated `### Security hardening (audits YYYY-MM-DD → YYYY-MM-DD)` subsection under `#### HIGH` |
| **MEDIUM**   | Auto-fixed       | Audit report → "Resolutions Applied" (verified with lint + tests)                 |
| **MEDIUM**   | Cannot auto-fix  | TODOS.md → Backlog → "Security hardening" section as LOW                          |
| **LOW**      | Auto-fixed       | Audit report → "Resolutions Applied"                                              |
| **LOW**      | Tracked          | TODOS.md → Backlog → "Security hardening" section                                 |

**Backlog structure in TODOS.md:**

```markdown
### Security hardening (audits YYYY-MM-DD → YYYY-MM-DD)

#### HIGH (resolve before go-live)
- [ ] [finding] — [context]. See: `file:line`

#### LOW (hardening — fix in future cycles)
- [ ] [finding] — [context]. See: `file:line`

#### RESOLVED (from this audit)
- [x] [finding] — [resolution] `[severity, fix-type]`

#### Resolved incidentally
- [x] [finding] — [what made it obsolete] `[severity, fix-type]`
```

## Automation

- **As an agent**: Run `claude --agent=cyber-auditor` for a standalone security audit
- **In the pipeline**: Runs automatically between QA and Document steps
- **On a loop**: Use `/loop 1h /cyber` for continuous security monitoring after deploys
- **Dependency watch**: Use `/loop 24h /cyber --deps-only` to monitor for new CVEs

## Quality Signals

After this skill is used, observe these signals to determine if it performed well:

| Signal                     | ✅ Good                                                                    | ❌ Poor                                                                           |
| -------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Detection rate**         | Found real vulnerabilities that review/QA missed                           | Reported "clean" but a security issue was found post-merge                        |
| **False positive rate**    | Flagged issues were real and exploitable                                   | Flagged issues were theoretical or impossible given the app's context             |
| **Auto-fix accuracy**      | Auto-applied fixes were correct and caused no regressions                  | Auto-fixes broke tests, introduced new issues, or were reverted                   |
| **Severity calibration**   | CRITICAL/HIGH issues were genuinely severe; LOW issues were genuinely low  | Severity didn't match actual risk (cried wolf on LOW, underrated a HIGH)          |
| **Coverage completeness**  | All changed files mapped to the correct threat categories                  | A file with security implications was skipped or mapped to wrong category         |
| **Resolution rate**        | MEDIUM/LOW issues auto-fixed; HIGH/CRITICAL had actionable suggested fixes | Findings were vague ("improve security") without specific, applicable suggestions |

> If signals trend ⚠️ or ❌, use the **improve skill** (`.protocols/improve.protocol.md`) to amend.

---

## Rules

- Always read `MODELS.md` before auditing for project-specific context
- Diff-aware by default on feature branches — full audit only when explicitly requested
- Never auto-fix CRITICAL issues — they always require human judgment
- Every auto-fix must pass `pnpm lint` and `pnpm test:run` before being committed
- Cite file paths and line numbers for every finding
- Don't manufacture findings — if the code is secure, say so
- When in doubt about severity, round up (treat MEDIUM as HIGH)
- Dependencies: `pnpm audit` is the baseline, but also check for unmaintained packages
- Track every finding — the audit report is the record, but TODOS.md and docs are the lifecycle
