# `.protocols/` File Format Specification — Version 1.0

*Editor: Innocent Muisha (reveren.ai Pty Ltd) · Status: Draft · Last revised: 2026-05-02*

> This specification describes the `.protocols/` directory format: a portable, agent-agnostic way to ship structured cognitive-mode instructions alongside source code. Any agent, IDE, CLI, or workflow runner can read or write this format; the format itself is open.

---

## License

This specification document is licensed under the **W3C Software and Document License 2 (SDL2)**, available at:

> https://www.w3.org/Consortium/Legal/2023/copyright-software-and-document/

Schemas, JSON Schema files, TypeScript type definitions, and code examples embedded in or distributed alongside this specification (including any file under `examples/` or `schemas/` in the canonical specification repository) are licensed under the **MIT License**:

> Copyright (c) 2026 reveren.ai Pty Ltd
> See `LICENSE.MIT` distributed with the specification source for the full text.

### Attribution

When implementing this specification, please cite it as:

> reveren.ai Pty Ltd (2026). The .protocols/ File Format Specification, Version 1.0. Available at https://reveren.ai/spec/protocols-1.0

Citation is required by the W3C SDL2 for redistribution of the specification text; it is not required for runtime use of the format itself.

### Patent Grant

The format described herein is intended to be implementable by any agent, IDE, CLI, or workflow runner. reveren.ai Pty Ltd retains no patent claim over the format and grants a non-exclusive, royalty-free, worldwide license to all patents necessary to implement the format under this specification's license terms.

---

## 1. Conformance Terminology

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, **MAY** in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) when, and only when, they appear in all capitals.

A **conformant implementation** of this specification:

- **MUST** read and write `.protocols/` directories per Section 2.
- **MUST** parse protocol frontmatter per Section 3.
- **MUST** support the four core CLI verbs (`init`, `run`, `list`, `sync`) per Section 6, OR clearly document which subset it supports.
- **MAY** add proprietary extensions, provided they do not conflict with reserved names in Section 2 or reserved frontmatter fields in Section 3.

---

## 2. Directory Layout

A conformant `.protocols/` directory:

```
.protocols/
├── EVOLUTION.md            # RESERVED — amendment audit log (Section 5)
├── INDEX.md                # RESERVED — human-readable list (optional)
├── <protocol-id>.protocol.md
├── <protocol-id>.protocol.md
└── <category>/             # OPTIONAL — namespacing subdirectories
    └── <protocol-id>.protocol.md
```

### 2.1 Reserved files

The following file names at the root of `.protocols/` are **reserved** and **MUST NOT** be used for protocols:

| File | Purpose |
|------|---------|
| `EVOLUTION.md` | Amendment audit log (see Section 5) |
| `INDEX.md` | Optional human-readable directory listing |
| `README.md` | Optional contributor guide |

### 2.2 File naming

Protocol files **MUST** end in `.protocol.md`. The portion before `.protocol.md` is the **protocol id** and **MUST** match the regex `^[a-z][a-z0-9-]*$`. Subdirectories **MAY** be used for namespacing (e.g., `architecture/migration.protocol.md`); the namespace is the path relative to `.protocols/` minus the `.protocol.md` suffix.

### 2.3 Configuration file

A conformant project **SHOULD** include a `protocols.config.ts` (or `.js` / `.json` / `.yaml`) at the root of the project alongside `.protocols/`. The schema is defined in Section 7.

### 2.4 Configurable terminology

The default noun is **protocol** (directory `.protocols/`, extension `.protocol.md`). A host project **MAY** override the noun, plural, directory, and file extension via the `terminology` field of `protocols.config.ts` (see Section 7). Common overrides include `playbook`, `skill`, `rule`, and `recipe`. When `terminology` is set:

- Conformant tooling **MUST** read and write files at the configured `directory` with the configured `extension`.
- Conformant tooling **SHOULD** use the configured singular/plural nouns in user-facing CLI output (e.g. `rvr list` → "Bundled <plural>:").
- The `kind:` frontmatter value (Section 3.1) **MUST** still be the literal string `protocol` — terminology is a presentation concern, not a schema concern. This keeps cross-project tooling and the EVOLUTION.md format interoperable regardless of which noun a project chose.

---

## 3. Protocol File Format

A protocol file is a Markdown document with a **YAML frontmatter block** at the top, separated by `---` fences.

### 3.1 Frontmatter — required fields

```yaml
---
name: plan-engineering            # MUST match the protocol id
kind: protocol                    # MUST be the literal string "protocol"
version: 1.0.0                    # MUST be a semver string per https://semver.org
---
```

### 3.2 Frontmatter — optional fields

```yaml
tags: [planning, architecture]    # MAY be present; for INDEX.md grouping
appliesTo:                        # MAY restrict the protocol to specific stacks
  - next
  - vite-react
defaultActive: true               # MAY indicate it should be active by default
license: MIT                      # MAY override the project's default license
agents:                           # MAY restrict which agents the protocol targets
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

The Markdown body **SHOULD** follow this heading hierarchy. Conformant implementations **MAY** offer protocols that deviate, but tooling SHOULD warn when a body is missing one of the recommended top-level sections:

```markdown
# Protocol: <Title>

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

The literal title prefix `# Protocol: ` is **RECOMMENDED** for visual consistency but **NOT REQUIRED**.

---

## 4. Pipeline Composition Contract

Protocols **MAY** be composed into pipelines (e.g., `plan-product` → `plan-engineering` → `engineer` → `qa` → `ship`). Composition is governed by **handoff contracts**.

### 4.1 Handoff declaration

A protocol that produces a structured artefact for a downstream protocol **SHOULD** declare it in a `## Handoff Contract` section:

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

Each protocol **SHOULD** end with a Quality Signals table. The recommended schema:

| Field | Required | Type |
|-------|----------|------|
| `signal` | Yes | string — short name for the signal |
| `good` | Yes | string — observable indicator the protocol performed well |
| `poor` | Yes | string — observable indicator the protocol performed poorly |
| `correlates_with` | No | string — what downstream metric this predicts |

---

## 5. Versioning

### 5.1 Per-protocol semver

Each protocol is independently versioned via the `version` frontmatter field. Bumping rules:

- **MAJOR** — handoff contract changes (downstream protocols need to re-read produced artefacts)
- **MINOR** — new sections, new optional frontmatter, body content additions
- **PATCH** — wording fixes, typo corrections, link updates

### 5.2 Amendment log (`EVOLUTION.md`)

A `.protocols/EVOLUTION.md` file **MAY** be present and, when present, **MUST** be append-only. Each entry records a change to one or more protocols:

```markdown
## 2026-05-02 — storybook protocol v1.1.0

**Amendment.** Added the three-mode contract (full / hosted-gallery / disabled) and the auto-generation contract for non-technical-user mode.

**Trigger.** New requirement to support Lovable / Bolt / v0 founders.

**Files changed.** `.protocols/storybook.protocol.md` (1.0.0 → 1.1.0)

**Reviewed by.** Innocent Muisha
```

### 5.3 Schema versioning

The frontmatter schema itself is versioned via `protocols.config.ts → $schemaVersion`. v1.x is forward-compatible (readers MUST ignore unknown fields). v2.x reserves the right to break the YAML frontmatter shape.

---

## 6. CLI Contract

A conformant CLI implementation **MUST** support these verbs (or clearly document which subset it supports):

| Verb | Purpose | Required? |
|------|---------|-----------|
| `init` | Scaffold `protocols.config.ts` + `.protocols/` in the current project | MUST |
| `run <protocol>` | Resolve a protocol by id and emit its content for an agent to ingest | MUST |
| `list` | Enumerate active and available protocols | MUST |
| `sync` | Pull updates from a registry | MAY |

### 6.1 Non-interactive mode

`init` **MUST** accept a `--non-interactive` flag and a `--preset <name>` flag. When either is set, the CLI **MUST**:

1. Suppress all interactive prompts.
2. Emit structured JSON progress events to `stdout`, one per line. Recommended event shape:
   ```json
   { "event": "file-write", "path": ".protocols/storybook.protocol.md" }
   { "event": "complete", "status": "ok" }
   ```
3. Exit `0` on success, non-zero on any error, with a final JSON line: `{ "event": "error", "message": "..." }`.

This is the contract that no-code / web-UI front-ends call.

### 6.2 Skill resolution order

When `run <protocol>` is invoked, the CLI **MUST** resolve the protocol in this order:

1. Host-project override at `.protocols/<id>.protocol.md`
2. Bundled protocol in the CLI's distribution
3. Registry pull (if `sync` has populated `.protocols/` from a remote)

A host-project file always takes precedence — this enables per-project customisation without forking the CLI.

---

## 7. `protocols.config.ts` Schema

The configuration file declares which stack the project uses, which protocols are active, and any per-protocol configuration. Reference Zod schema (TypeScript):

```ts
import { z } from "zod"

const ProtocolsConfig = z.object({
  $schemaVersion: z.literal(1).default(1),
  stack: z.enum(["next", "vite-react", "remix", "sveltekit", "astro", "generic"]),
  agent: z.enum(["claude", "cursor", "copilot", "windsurf", "multiple"]),
  language: z.enum(["ts", "js"]),
  packageManager: z.enum(["pnpm", "npm", "yarn", "bun"]),
  testing: z.enum(["vitest", "jest", "playwright", "none"]),
  // Terminology is configurable. Defaults to protocol/protocols/.protocols/.protocol.md
  // but can be set to "playbook", "skill", "rule", or any term the host project prefers.
  // Conformant tooling MUST honour the configured directory + extension when reading
  // and writing files; the singular/plural nouns are used in user-facing CLI output.
  terminology: z.object({
    singular: z.string().default("protocol"),
    plural: z.string().default("protocols"),
    directory: z.string().default(".protocols"),
    extension: z.string().default(".protocol.md")
  }).optional(),
  activeProtocols: z.array(z.string()),
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

Conformant implementations **MUST** validate `protocols.config.ts` against the schema (or its v1.0 JSON Schema equivalent) before reading any protocol.

---

## 8. Agent-Binding Metadata

A protocol **MAY** declare that it expects to be invoked by a specific agent or model class via the optional `agents` frontmatter field:

```yaml
agents:
  - claude
  - cursor
```

When unset, the protocol is agent-agnostic. When set, conformant runners **SHOULD** warn if invoked under a different agent — but **MUST NOT** refuse to run (deferring final policy to the host project).

---

## 9. Stability Guarantees

The reveren.ai project commits to the following stability guarantees for v1.x of this specification:

- **Frontmatter shape**: required fields (`name`, `kind`, `version`) will not change in v1.x.
- **Reserved file names**: `EVOLUTION.md`, `INDEX.md`, `README.md` will remain reserved; no new reserved names will be added without a minor version bump and a 6-month deprecation window.
- **CLI verbs**: `init`, `run`, `list` will keep their semantics; `sync` may evolve as the registry matures.
- **Schema evolution**: `protocols.config.ts` schema changes follow semver — additive fields are MINOR, breaking changes are MAJOR ($schemaVersion bumps).

A v2.0 of this specification reserves the right to change any of the above. v1.x and v2.x will coexist for a transition window of at least 12 months.

---

## 10. Reference Implementation

The reference implementation is `@reveren-ai/core`, distributed at:

- **CLI source + bundled protocols**: https://github.com/reveren-ai/core (BSL 1.1 + Additional Use Grant for the runtime; MIT for the bundled protocol copies)
- **Canonical protocol library**: https://github.com/reveren-ai/protocols (MIT)
- **Specification source**: https://github.com/reveren-ai/spec (this document; W3C SDL2 + MIT)

Implementations of this specification by other vendors are encouraged. See Section 6 for the conformance bar.

---

## 11. Adoption checklist (informative)

- [ ] Add `.protocols/` directory at project root.
- [ ] Add `protocols.config.ts` with at least the required fields.
- [ ] For each protocol, ensure frontmatter includes `name`, `kind: protocol`, `version`.
- [ ] Wire the CLI into `package.json` scripts (e.g. `"protocols": "rvr run"`).
- [ ] Reference the spec from your project's CONTRIBUTING.md if contributors author new protocols.
- [ ] Track amendments in `.protocols/EVOLUTION.md` (recommended).

---

*End of specification — version 1.0 · 2026-05-02.*
