# `.playbooks/` File Format Specification — Version 1.0

*Editor: Innocent Muisha (reveren.ai Pty Ltd) · Status: Draft · Last revised: 2026-05-02*

> This specification describes the `.playbooks/` directory format: a portable, agent-agnostic way to ship structured cognitive-mode instructions alongside source code. Any agent, IDE, CLI, or workflow runner can read or write this format; the format itself is open.

---

## License

This specification document is licensed under the **W3C Software and Document License 2 (SDL2)**, available at:

> https://www.w3.org/Consortium/Legal/2023/copyright-software-and-document/

Schemas, JSON Schema files, TypeScript type definitions, and code examples embedded in or distributed alongside this specification (including any file under `examples/` or `schemas/` in the canonical specification repository) are licensed under the **MIT License**:

> Copyright (c) 2026 reveren.ai Pty Ltd
> See `LICENSE.MIT` distributed with the specification source for the full text.

### Attribution

When implementing this specification, please cite it as:

> reveren.ai Pty Ltd (2026). The .playbooks/ File Format Specification, Version 1.0. Available at https://reveren.ai/spec/playbooks-1.0

Citation is required by the W3C SDL2 for redistribution of the specification text; it is not required for runtime use of the format itself.

### Patent Grant

The format described herein is intended to be implementable by any agent, IDE, CLI, or workflow runner. reveren.ai Pty Ltd retains no patent claim over the format and grants a non-exclusive, royalty-free, worldwide license to all patents necessary to implement the format under this specification's license terms.

---

## 1. Conformance Terminology

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, **MAY** in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) when, and only when, they appear in all capitals.

A **conformant implementation** of this specification:

- **MUST** read and write `.playbooks/` directories per Section 2.
- **MUST** parse playbook frontmatter per Section 3.
- **MUST** support the four core CLI verbs (`init`, `run`, `list`, `sync`) per Section 6, OR clearly document which subset it supports.
- **MAY** add proprietary extensions, provided they do not conflict with reserved names in Section 2 or reserved frontmatter fields in Section 3.

---

## 2. Directory Layout

A conformant `.playbooks/` directory:

```
.playbooks/
├── EVOLUTION.md            # RESERVED — amendment audit log (Section 5)
├── INDEX.md                # RESERVED — human-readable list (optional)
├── <playbook-id>.playbook.md
├── <playbook-id>.playbook.md
└── <category>/             # OPTIONAL — namespacing subdirectories
    └── <playbook-id>.playbook.md
```

### 2.1 Reserved files

The following file names at the root of `.playbooks/` are **reserved** and **MUST NOT** be used for playbooks:

| File | Purpose |
|------|---------|
| `EVOLUTION.md` | Amendment audit log (see Section 5) |
| `INDEX.md` | Optional human-readable directory listing |
| `README.md` | Optional contributor guide |

### 2.2 File naming

Playbook files **MUST** end in `.playbook.md`. The portion before `.playbook.md` is the **playbook id** and **MUST** match the regex `^[a-z][a-z0-9-]*$`. Subdirectories **MAY** be used for namespacing (e.g., `architecture/migration.playbook.md`); the namespace is the path relative to `.playbooks/` minus the `.playbook.md` suffix.

### 2.3 Configuration file

A conformant project **SHOULD** include a `playbooks.config.ts` (or `.js` / `.json` / `.yaml`) at the root of the project alongside `.playbooks/`. The schema is defined in Section 7.

---

## 3. Playbook File Format

A playbook file is a Markdown document with a **YAML frontmatter block** at the top, separated by `---` fences.

### 3.1 Frontmatter — required fields

```yaml
---
name: plan-engineering            # MUST match the playbook id
kind: playbook                    # MUST be the literal string "playbook"
version: 1.0.0                    # MUST be a semver string per https://semver.org
---
```

### 3.2 Frontmatter — optional fields

```yaml
tags: [planning, architecture]    # MAY be present; for INDEX.md grouping
appliesTo:                        # MAY restrict the playbook to specific stacks
  - next
  - vite-react
defaultActive: true               # MAY indicate it should be active by default
license: MIT                      # MAY override the project's default license
agents:                           # MAY restrict which agents the playbook targets
  - claude
  - cursor
  - copilot
  - windsurf
  - any
quality_signals:                  # MAY embed quality rubric inline (Section 4)
  - signal: "edge cases listed"
    good: "found in implementation"
    poor: "found in QA after merge"
```

A conformant reader **MUST** ignore unknown frontmatter fields (forward compatibility).

### 3.3 Body heading hierarchy

The Markdown body **SHOULD** follow this heading hierarchy. Conformant implementations **MAY** offer playbooks that deviate, but tooling SHOULD warn when a body is missing one of the recommended top-level sections:

```markdown
# Playbook: <Title>

## When to use
...

## How to think
...

## Workflow
### Step 1: ...
### Step 2: ...

## Output Format
...

## Quality Signals
...

## Handoff Contract        # OPTIONAL — see Section 4
...
```

The literal title prefix `# Playbook: ` is **RECOMMENDED** for visual consistency but **NOT REQUIRED**.

---

## 4. Pipeline Composition Contract

Playbooks **MAY** be composed into pipelines (e.g., `plan-product` → `plan-engineering` → `engineer` → `qa` → `ship`). Composition is governed by **handoff contracts**.

### 4.1 Handoff declaration

A playbook that produces a structured artefact for a downstream playbook **SHOULD** declare it in a `## Handoff Contract` section:

```markdown
## Handoff Contract

### Produces
- `RecommendedScope` — markdown table of in-scope vs out-of-scope items
- `OpenQuestions` — bulleted list of unresolved decisions

### Consumed by
- `plan-engineering` (RecommendedScope → File Plan input)
- `plan-ux` (RecommendedScope → user scenarios input)
```

### 4.2 Quality signals format

Each playbook **SHOULD** end with a Quality Signals table. The recommended schema:

| Field | Required | Type |
|-------|----------|------|
| `signal` | Yes | string — short name for the signal |
| `good` | Yes | string — observable indicator the playbook performed well |
| `poor` | Yes | string — observable indicator the playbook performed poorly |
| `correlates_with` | No | string — what downstream metric this predicts |

---

## 5. Versioning

### 5.1 Per-playbook semver

Each playbook is independently versioned via the `version` frontmatter field. Bumping rules:

- **MAJOR** — handoff contract changes (downstream playbooks need to re-read produced artefacts)
- **MINOR** — new sections, new optional frontmatter, body content additions
- **PATCH** — wording fixes, typo corrections, link updates

### 5.2 Amendment log (`EVOLUTION.md`)

A `.playbooks/EVOLUTION.md` file **MAY** be present and, when present, **MUST** be append-only. Each entry records a change to one or more playbooks:

```markdown
## 2026-05-02 — storybook playbook v1.1.0

**Amendment.** Added the three-mode contract (full / hosted-gallery / disabled) and the auto-generation contract for non-technical-user mode.

**Trigger.** New requirement to support Lovable / Bolt / v0 founders.

**Files changed.** `.playbooks/storybook.playbook.md` (1.0.0 → 1.1.0)

**Reviewed by.** Innocent Muisha
```

### 5.3 Schema versioning

The frontmatter schema itself is versioned via `playbooks.config.ts → $schemaVersion`. v1.x is forward-compatible (readers MUST ignore unknown fields). v2.x reserves the right to break the YAML frontmatter shape.

---

## 6. CLI Contract

A conformant CLI implementation **MUST** support these verbs (or clearly document which subset it supports):

| Verb | Purpose | Required? |
|------|---------|-----------|
| `init` | Scaffold `playbooks.config.ts` + `.playbooks/` in the current project | MUST |
| `run <playbook>` | Resolve a playbook by id and emit its content for an agent to ingest | MUST |
| `list` | Enumerate active and available playbooks | MUST |
| `sync` | Pull updates from a registry | MAY |

### 6.1 Non-interactive mode

`init` **MUST** accept a `--non-interactive` flag and a `--preset <name>` flag. When either is set, the CLI **MUST**:

1. Suppress all interactive prompts.
2. Emit structured JSON progress events to `stdout`, one per line. Recommended event shape:
   ```json
   { "event": "file-write", "path": ".playbooks/storybook.playbook.md" }
   { "event": "complete", "status": "ok" }
   ```
3. Exit `0` on success, non-zero on any error, with a final JSON line: `{ "event": "error", "message": "..." }`.

This is the contract that no-code / web-UI front-ends call.

### 6.2 Skill resolution order

When `run <playbook>` is invoked, the CLI **MUST** resolve the playbook in this order:

1. Host-project override at `.playbooks/<id>.playbook.md`
2. Bundled playbook in the CLI's distribution
3. Registry pull (if `sync` has populated `.playbooks/` from a remote)

A host-project file always takes precedence — this enables per-project customisation without forking the CLI.

---

## 7. `playbooks.config.ts` Schema

The configuration file declares which stack the project uses, which playbooks are active, and any per-playbook configuration. Reference Zod schema (TypeScript):

```ts
import { z } from "zod"

const PlaybooksConfig = z.object({
  $schemaVersion: z.literal(1).default(1),
  stack: z.enum(["next", "vite-react", "remix", "sveltekit", "astro", "generic"]),
  agent: z.enum(["claude", "cursor", "copilot", "windsurf", "multiple"]),
  language: z.enum(["ts", "js"]),
  packageManager: z.enum(["pnpm", "npm", "yarn", "bun"]),
  testing: z.enum(["vitest", "jest", "playwright", "none"]),
  activePlaybooks: z.array(z.string()),
  storybook: z.object({
    mode: z.enum(["full", "hosted-gallery", "disabled"]),
    autoGenerateStories: z.boolean(),
    deployTarget: z.enum(["github-pages", "chromatic", "none"])
  }).optional(),
  compliance: z.object({
    domain: z.enum(["finance", "healthcare", "ai-product", "consumer", "generic"]),
    triggerPaths: z.array(z.string()),
    jurisdictions: z.array(z.string())
  }).optional(),
  registry: z.object({
    url: z.string().url(),
    token: z.string().optional()
  }).optional()
})
```

Conformant implementations **MUST** validate `playbooks.config.ts` against the schema (or its v1.0 JSON Schema equivalent) before reading any playbook.

---

## 8. Agent-Binding Metadata

A playbook **MAY** declare that it expects to be invoked by a specific agent or model class via the optional `agents` frontmatter field:

```yaml
agents:
  - claude
  - cursor
```

When unset, the playbook is agent-agnostic. When set, conformant runners **SHOULD** warn if invoked under a different agent — but **MUST NOT** refuse to run (deferring final policy to the host project).

---

## 9. Stability Guarantees

The reveren.ai project commits to the following stability guarantees for v1.x of this specification:

- **Frontmatter shape**: required fields (`name`, `kind`, `version`) will not change in v1.x.
- **Reserved file names**: `EVOLUTION.md`, `INDEX.md`, `README.md` will remain reserved; no new reserved names will be added without a minor version bump and a 6-month deprecation window.
- **CLI verbs**: `init`, `run`, `list` will keep their semantics; `sync` may evolve as the registry matures.
- **Schema evolution**: `playbooks.config.ts` schema changes follow semver — additive fields are MINOR, breaking changes are MAJOR ($schemaVersion bumps).

A v2.0 of this specification reserves the right to change any of the above. v1.x and v2.x will coexist for a transition window of at least 12 months.

---

## 10. Reference Implementation

The reference implementation is `@reveren-ai/core`, distributed at:

- **CLI source + bundled playbooks**: https://github.com/reveren-ai/core (BSL 1.1 + Additional Use Grant for the runtime; MIT for the bundled playbook copies)
- **Canonical playbook library**: https://github.com/reveren-ai/playbooks (MIT)
- **Specification source**: https://github.com/reveren-ai/spec (this document; W3C SDL2 + MIT)

Implementations of this specification by other vendors are encouraged. See Section 6 for the conformance bar.

---

## 11. Adoption checklist (informative)

- [ ] Add `.playbooks/` directory at project root.
- [ ] Add `playbooks.config.ts` with at least the required fields.
- [ ] For each playbook, ensure frontmatter includes `name`, `kind: playbook`, `version`.
- [ ] Wire the CLI into `package.json` scripts (e.g. `"playbooks": "rvr run"`).
- [ ] Reference the spec from your project's CONTRIBUTING.md if contributors author new playbooks.
- [ ] Track amendments in `.playbooks/EVOLUTION.md` (recommended).

---

*End of specification — version 1.0 · 2026-05-02.*
