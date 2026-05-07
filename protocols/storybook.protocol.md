# Protocol: Storybook

> Cognitive mode: Component-gallery curator + design-system steward
> Co-skill of `plan-engineering` (scaffolds story files alongside components) and `ship` (verifies stories exist before release).

---

## When to use

- Whenever a new component folder is created under `components/`
- Whenever a component's public API (props, variants, slots) changes
- As a `ship` skill gate — block the release if a touched component lacks an up-to-date `.stories.tsx`
- During the `document` skill, to confirm component stories exist for every component referenced in the feature doc

## 0. Permissions Pre-flight

Before starting, confirm every non-destructive command this skill runs is in
`.claude/settings.local.json` → `permissions.allow`. Missing entries will
interrupt the run with approval prompts.

- Typical commands used here: `pnpm storybook`, `pnpm build-storybook`, `pnpm storybook:test`, `git diff`, `git status`.
- If prompts fire, run the **`/fewer-permission-prompts`** skill to bulk-grant.

## How to think

A component without a story is a component nobody can find. Stories are the
**contract** between the design intent and the running code — they document
every variant, every state, every prop combination, in a place a non-technical
collaborator can click through without running a build.

Stories are not tests, but they cover the same ground from the other side: a
test asserts behaviour, a story exhibits behaviour. If a designer or PM can't
reach the running variant in under 30 seconds, the component is invisible.

## Configuration modes

This skill is configured via `protocols.config.ts`'s `storybook` section. The mode
determines what the skill scaffolds and verifies.

```ts
// protocols.config.ts
export default defineProtocolsConfig({
  storybook: {
    mode: "full" | "hosted-gallery" | "disabled",
    autoGenerateStories: boolean,        // default true
    deployTarget: "github-pages" | "chromatic" | "none", // hosted-gallery only
  }
})
```

### Mode: `full` (default for engineering teams)

- `.storybook/` config committed; `pnpm storybook` runs locally on port 6006
- Engineer hand-writes (or AI-generates) `*.stories.tsx` files
- `ship` skill runs `pnpm build-storybook` as a smoke check
- No hosted deploy required

### Mode: `hosted-gallery` (default for non-technical / no-code users)

- `.storybook/` config committed
- **Stories auto-generated** from component TS prop types whenever a new
  component file lands; the user never writes a story by hand
- `.github/workflows/storybook.yml` deploys the built Storybook to **GitHub
  Pages** on every push to `main` (or to Chromatic if `deployTarget`
  is `chromatic`)
- The deployed URL is posted as a PR check so non-technical users get a
  clickable preview without ever running anything locally
- This is the mode `rvr init --preset=no-code` selects automatically

### Mode: `disabled`

- No `.storybook/` directory; no stories generated; no CI workflow
- The `document` skill falls back to markdown-only component docs
- For solo hackers who have explicitly opted out

## Workflow

### Step 1: Detect mode

Read `protocols.config.ts` (or fall back to `MODELS.md` Stack section). If `mode`
is `disabled`, skip the rest of this skill — return early.

### Step 2: For every changed component

Run `git diff --name-only HEAD~1 -- components/` (or the equivalent against the
base branch). For each component file added or modified:

1. **Locate the matching story file** using the component-folder convention
   from `MODELS.md` → "Component Folder Structure":

   - Single-component folder (`components/Foo/index.tsx`) → `components/Foo/index.stories.tsx`
   - Multi-component folder (`components/Foo/FooBar.tsx`) → `components/Foo/FooBar.stories.tsx`

2. **If the story file does not exist:**
   - In `full` mode: scaffold a minimal story (see Story Template below) and
     commit it alongside the component change
   - In `hosted-gallery` mode: auto-generate the story from the component's TS
     prop types — see "Auto-generation contract" below
   - In `disabled` mode: skip

3. **If the story file exists but the component's public props changed:**
   - Compare the props in the component to the args declared in the story
   - Add stories for newly-introduced variants/states
   - Remove stories for props that no longer exist
   - Never silently leave stale stories — they mislead designers and rot fast

### Step 3: Build smoke

Run `pnpm build-storybook` and confirm it exits `0`. If it fails, fix the broken
story before declaring the skill complete. A failing Storybook build means a
broken component contract, not a Storybook problem.

### Step 4: Verification

- **Full mode:** open `pnpm storybook` locally, click through every story added
  in this change, confirm each variant renders
- **Hosted-gallery mode:** push to a PR branch, wait for the GH Pages /
  Chromatic check to pass, open the deployed URL, click through new stories
- **Either mode:** the `ship` skill will block release if any component touched
  in the diff lacks a story

## Story Template (CSF 3.0 / MUI v7)

Drop into `components/[Name]/[Name].stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { ComponentName } from "./ComponentName";

const meta: Meta<typeof ComponentName> = {
  title: "Components/[FeatureGroup]/ComponentName",
  component: ComponentName,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    // Map every prop. Use `control: false` for refs / event handlers.
  },
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

export const Default: Story = {
  args: {
    // Sensible defaults — every required prop populated
  },
};

// One story per meaningful variant: empty, loading, error, populated, edge cases
export const Empty: Story = { args: {} };
export const Loading: Story = { args: { loading: true } };
export const Error: Story = { args: { error: new Error("Sample") } };
```

**Required stories per component:**

- `Default` — the happy path
- `Empty` — no data / empty state, if applicable
- `Loading` — async / skeleton, if the component fetches or waits
- `Error` — failure state, if the component can show one
- `Long` — overflow / truncation behaviour, if the component renders text or lists

**Optional but encouraged:** one story per discrete `variant` / `size` / `tone`
prop value, so designers can scan all variants at a glance.

## Auto-generation contract (hosted-gallery mode only)

When `autoGenerateStories: true` and a component file is created without a
matching story, the skill (or the CLI hook in reveren) writes a story
automatically using:

1. **Prop discovery:** parse the component's exported props type via
   `react-docgen-typescript` or the TS compiler API
2. **Default args:** synthesise reasonable defaults — strings get a placeholder
   sentence, numbers get `1`, booleans get `false`, enums get the first member,
   functions get `fn()` actions
3. **Variant stories:** for every union / enum prop, emit one story per member
4. **Slot stories:** for every `children` or `slots` prop, emit a `WithChildren`
   story with placeholder content

The auto-generated story file is always editable by the user — once they touch
it, the auto-generator stops re-writing it (uses a `// @reveren-auto-generated`
header that gets removed on first manual edit).

## Hosted-gallery deployment (GitHub Pages)

`.github/workflows/storybook.yml`:

```yaml
name: Deploy Storybook
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build-storybook -o storybook-static
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with: { path: storybook-static }
      - id: deployment
        uses: actions/deploy-pages@v4
```

The user enables GitHub Pages → Source: GitHub Actions, **once**, in the repo
UI. After that the gallery URL is `https://<org>.github.io/<repo>/` and shows up
on every PR as a check.

For **Chromatic** (paid tier, but better diff review):

```yaml
- run: pnpm dlx chromatic --project-token=${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

…requires the user to set `CHROMATIC_PROJECT_TOKEN` as a repo secret. This step
blocks non-technical users — that's why GitHub Pages is the default for
`hosted-gallery` mode.

## Quality Signals

| Signal                       | ✅ Good                                                                                  | ❌ Poor                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Story coverage**           | Every component in `components/` has a `.stories.tsx` next to it                         | Components added without stories; designers can't preview variants            |
| **Story freshness**          | Stories reflect the current prop API — no stale args, no orphaned variants               | Story args reference props the component no longer accepts; stories crash     |
| **Build smoke**              | `pnpm build-storybook` exits 0 on every commit that touches a component                  | Storybook build broken on `main`; PRs blocked until someone bisects manually  |
| **Variant completeness**     | Required stories present (Default, Empty, Loading, Error, Long where applicable)         | Only `Default` shipped; designers find missing states the hard way            |
| **Hosted-gallery freshness** | In `hosted-gallery` mode: deployed URL on every PR, never older than the PR's last commit | Deployed Storybook lags behind `main`; designers reviewing stale variants     |
| **Auto-gen accuracy**        | In `hosted-gallery` mode: auto-generated stories render without manual fix-up            | Auto-gen produces stories that crash because props couldn't be inferred       |

> If signals trend ⚠️ or ❌, use the **improve skill** (`.protocols/improve.protocol.md`) to amend.

---

## Rules

- One `.stories.tsx` per `.tsx` component file — colocated, never in a separate `stories/` directory
- Story `title` must match the component's path under `Components/` (e.g., `components/Pricing/PricingCards/index.tsx` → `title: "Components/Pricing/PricingCards"`)
- Every story exports the `meta` as default and named `Story` constants — no anonymous default-export pattern
- Stories must be **deterministic** — never call `Date.now()`, `Math.random()`, or hit network without a Mock Service Worker handler
- For MUI v7 components, wrap the global Storybook `decorators` with the project's `ThemeProvider` and `CssVarsProvider` (configured once in `.storybook/preview.tsx`) so stories render with real theming, not Storybook defaults
- Stories must not import from `app/` — components must be self-sufficient. If a component depends on app context (auth, router, params), the story stubs that context via decorators
- The `ship` skill blocks release if any touched component lacks an up-to-date story — this is non-negotiable in `full` and `hosted-gallery` modes
- In `hosted-gallery` mode, never edit an auto-generated story file in this skill — only generate it. User edits remove the `@reveren-auto-generated` header and take ownership
- Never delete a story file when removing a component — move the story to `archive/` so historical variants stay browseable
