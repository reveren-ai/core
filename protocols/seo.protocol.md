# Protocol: SEO

> Cognitive mode: Technical SEO engineer + content strategist
> A specialized audit protocol — runs alongside review/qa/cyber, not in place of them.

---

## When to use

- Before launching any new public route or marketing surface
- After a change to routing, page metadata, sitemap, robots, or canonical URL strategy
- Before a content push (blog series, landing pages, programmatic SEO)
- Periodically — every ~10 feature cycles, or before each marketing campaign
- After a noticeable drop in impressions, clicks, or indexed pages in Search Console
- When migrating domains, restructuring URLs, or merging subdomains into subpaths

SEO compounds. The cost of fixing indexability *after* Google has crawled the wrong shape of a site is much higher than getting it right on first crawl. Treat this protocol as cheap insurance.

## 0. Permissions Pre-flight

Before starting, confirm every non-destructive command this protocol runs is in
`.claude/settings.local.json` → `permissions.allow`. Missing entries will
interrupt the run with approval prompts and fracture the audit trail.

- Typical commands used here: `curl`, `grep`, `pnpm dev`, `pnpm build`,
  `pnpm exec next build`, `pnpm exec lighthouse`, `pnpm exec playwright`,
  `pkill`, `timeout`, `node` (for ad-hoc head probes), `gh` (for noting
  findings on the PR).
- External services this protocol *reads* from (Search Console, Bing
  Webmaster, Schema.org validator, PageSpeed Insights): linkable URLs only,
  no auto-fetch unless the project has the API keys wired up.
- If prompts keep firing, invoke `/fewer-permission-prompts` to batch-grant.
- Never auto-approve commands that mutate external state — submitting a
  sitemap, requesting indexing, or pushing schema changes should always
  prompt.

## How to think

You are a technical SEO engineer who has watched a site lose six months of
ranking because someone shipped `noindex` to production. You are also a
content strategist who knows that perfect technical SEO on a thin page still
ranks for nothing. Both lenses matter.

Two questions you ask on every page:

1. **Can a crawler reach, render, and understand this page?** (technical)
2. **Does this page deserve to rank for what it targets?** (content)

If either answer is no, the rest of the audit doesn't matter for that page.

Bias toward **evidence over intuition**. "This should rank" is not evidence;
`curl -A "Googlebot" https://…` returning the expected HTML, a valid
JSON-LD block, and a non-`noindex` directive *is* evidence.

---

## Workflow

### Step 1 — Inventory the indexable surface

Produce a single list of every URL that *should* be indexed, plus the
matching list of every URL that should be excluded.

For Next.js App Router (the most common case on this stack):

1. List every `app/**/page.tsx` and `app/**/route.ts`.
2. Drop dynamic segments down to representative URLs (one per `generateStaticParams` shape).
3. Cross-check against `app/sitemap.ts` (or `public/sitemap.xml`) output — every indexable URL should be in the sitemap and vice versa.
4. Cross-check against `app/robots.ts` (or `public/robots.txt`) — paths that
   should *not* be crawled (admin, auth, draft previews, gated content)
   must be `Disallow`-ed.

For other frameworks: enumerate the framework's route table, then apply the
same sitemap ↔ robots ↔ live response cross-check.

Output: `seo/inventory.md` (or an inline table in the final report) with
columns: `URL | Indexable? | In sitemap? | In robots disallow? | Canonical | Status`.

A row with `Indexable: yes / In sitemap: no` or `Indexable: no / In robots
disallow: no` is a finding — usually a high-severity one.

### Step 2 — Technical SEO audit (per route)

For each indexable URL, verify:

#### Metadata

- [ ] `<title>` is unique, descriptive, ≤ 60 characters (truncates around 580px at default zoom)
- [ ] `<meta name="description">` is unique, 120–160 characters, no keyword stuffing
- [ ] `<link rel="canonical">` is present and points to the correct URL
- [ ] `<meta name="robots">` is absent OR explicitly `index, follow` for indexable pages, `noindex, follow` for excluded ones
- [ ] `<meta name="viewport">` is present (`width=device-width, initial-scale=1`)
- [ ] `<html lang="…">` is set (and matches the page's actual language)
- [ ] No conflicting directives: `noindex` in HTML head + `Allow:` in robots.txt is a smell

For Next.js App Router specifically, prefer the `Metadata` API:

```ts
// app/foo/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "…",
  description: "…",
  alternates: { canonical: "/foo" },
  openGraph: { … },
  twitter: { … },
  robots: { index: true, follow: true },
};
```

For dynamic routes, use `generateMetadata` and ensure the function reads
real data, not placeholders.

#### Structured data (JSON-LD)

- [ ] Every content page has a JSON-LD `@type` matching its content (`Article`, `Product`, `FAQPage`, `BreadcrumbList`, `Organization`, `WebSite`, etc.)
- [ ] JSON-LD validates against [schema.org](https://schema.org) and Google's [Rich Results Test](https://search.google.com/test/rich-results)
- [ ] Required properties for the chosen type are present (e.g., `Article` needs `headline`, `datePublished`, `author`)
- [ ] No conflicting / duplicate schema (e.g., two `Article` blocks on one page)
- [ ] Schema reflects what the page *actually shows* — Google penalises mismatch

#### Open Graph / social preview

- [ ] `og:title`, `og:description`, `og:url`, `og:image` (≥ 1200×630, < 8MB), `og:type`
- [ ] `twitter:card` = `summary_large_image` for content pages, `summary` for thin pages
- [ ] Image is publicly fetchable (no auth wall, no CDN signature that expires)

#### Crawlability

- [ ] `curl -A "Mozilla/5.0 (compatible; Googlebot/2.1)" <url>` returns 200 with the *full* rendered HTML (not just the JS shell)
- [ ] If the page relies on client-side rendering, confirm Next.js / framework is server-rendering the SEO-critical content
- [ ] `robots.txt` is reachable at `/robots.txt` and references the sitemap (`Sitemap: https://example.com/sitemap.xml`)
- [ ] `sitemap.xml` validates against the [sitemap spec](https://www.sitemaps.org/protocol.html) and every URL returns 200
- [ ] Pagination, faceted nav, and infinite scroll are crawlable (real `<a href>` links, not click-only handlers)
- [ ] No accidentally-protected paths — `/auth/signin` shouldn't appear in the sitemap, but the public homepage shouldn't sit behind an auth wall either

#### URLs & redirects

- [ ] URLs are lowercase, hyphen-separated, free of session IDs and tracking params in the canonical form
- [ ] Trailing-slash policy is consistent across the whole site (either always-on or always-off — don't mix)
- [ ] 301s for permanent moves, 302s for temporary; no chains > 1 hop where avoidable
- [ ] No internal links pointing to redirected URLs (update the link, don't lean on the redirect)
- [ ] HTTPS everywhere; HTTP → HTTPS redirect is a 301, not a 302

### Step 3 — Content SEO audit (per route)

For each indexable URL with real content, verify:

#### Headings

- [ ] Exactly one `<h1>` per page, and it matches the search intent
- [ ] Heading order is hierarchical (no `<h1>` → `<h3>` skips)
- [ ] Headings describe sections; they are not styled paragraphs

#### Body content

- [ ] Page targets a specific search intent (informational / transactional / navigational) — and the content matches
- [ ] Primary keyword appears in the title, the H1, the first 100 words, and at least one subheading — but reads naturally
- [ ] Content is long enough to satisfy intent (no fixed word count — but a 200-word "ultimate guide" is rarely competitive)
- [ ] No duplicate content across multiple URLs (programmatic SEO traps)
- [ ] Internal links use descriptive anchor text (not "click here")
- [ ] Outbound links to authoritative sources use `rel="noopener"` (security) and `rel="nofollow"` or `rel="sponsored"` where appropriate

#### Images & media

- [ ] Every `<img>` has descriptive `alt` text (not the filename, not "image")
- [ ] Decorative images use `alt=""`
- [ ] Images use a CDN with responsive sizes (`srcset` / Next.js `Image`)
- [ ] Modern formats (AVIF, WebP) with PNG/JPG fallback
- [ ] Lazy-loading on below-the-fold images (`loading="lazy"`)
- [ ] Video has a transcript or text equivalent for the crawler

#### Internationalization (if applicable)

- [ ] `<link rel="alternate" hreflang="…">` tags on every translated page, including `x-default`
- [ ] hreflang URLs return 200, not 3xx/4xx
- [ ] Each language has its own canonical pointing to itself, not the default-locale version

### Step 4 — Performance audit (Core Web Vitals)

SEO ranking now factors Core Web Vitals. Run Lighthouse (or PageSpeed
Insights) against every template (homepage, list page, detail page, search
page) on a throttled mobile profile.

Targets (Google's "Good" threshold, 75th percentile of real users):

- [ ] **LCP** (Largest Contentful Paint) ≤ 2.5s
- [ ] **INP** (Interaction to Next Paint) ≤ 200ms — replaced FID in March 2024
- [ ] **CLS** (Cumulative Layout Shift) ≤ 0.1
- [ ] **TTFB** (Time to First Byte) ≤ 0.8s

If any metric is in the "Needs Improvement" or "Poor" band, capture the
specific cause:

- LCP regression → hero image not preloaded? font swap? slow server response?
- CLS regression → image without `width`/`height`? ad slot reflow? web font swap?
- INP regression → long task on main thread? expensive event handler? hydration cost?

Cross-reference with the `vercel:performance-optimizer` agent guidance when
the project is on Vercel — many of the fixes (font loading, image
optimisation, dynamic imports) overlap exactly.

### Step 5 — Indexability (real-world check)

Move from "what we shipped" to "what crawlers see":

- [ ] Google Search Console → Coverage report → no unexpected `Excluded` or `Error` URLs for indexable pages
- [ ] Search Console → URL Inspection → live test a representative URL; it should be `URL is on Google` (or `URL is available for Google` if not yet indexed)
- [ ] Bing Webmaster Tools → same crosscheck (Bing also powers DuckDuckGo, Yahoo, ChatGPT browse)
- [ ] `site:example.com` query in Google returns the expected URLs; spot-check that staging/preview URLs are *not* returned (if they are, the staging robots.txt is wrong)
- [ ] Coverage of low-priority paths in `noindex` (faceted nav, internal search results, tag pages with thin content)

If the project has Search Console API access wired up, automate this check;
otherwise run it manually and screenshot the result into the report.

### Step 6 — AI-crawler & answer-engine readiness

Search is fragmenting. Treat AI crawlers (GPTBot, ClaudeBot, PerplexityBot,
Google-Extended, etc.) as first-class clients of your content.

- [ ] `robots.txt` has explicit `Allow` / `Disallow` rules for AI crawlers based on the project's content-licensing stance (don't leave it ambiguous — silence is interpreted differently by each crawler)
- [ ] Structured data is rich enough that an LLM answering "what does X do" can pull a correct summary (FAQPage, HowTo, Article with `description`)
- [ ] Page content stands alone — answer-engines often quote the first paragraph, so the lede must contain the answer, not the setup
- [ ] No content gated by JavaScript that AI crawlers can't execute (most still don't render JS)

### Step 7 — Analytics & instrumentation audit

Every feature that ships an SEO-relevant surface must also ship the
analytics wiring that proves it works. This step runs alongside the
SEO checks, not after — the two outputs are stapled together so the
final report covers _both_ "is this discoverable" and "do we know how
it's performing."

Check for every audited route:

- **Event matrix completeness** — list every meaningful user action on
  the surface (CTA click, form submit, share, copy-to-clipboard,
  download, video play, search submit, etc.). Each must map to either
  (a) a named custom event that fires in the codebase, or (b) an
  explicit decision to rely on autocapture / `$pageview`. "Probably
  autocapture" is not a decision — write it down.
- **Event-name + property hygiene** — names follow the project's
  documented event matrix (snake_case verb_noun, e.g.
  `press_asset_downloaded`); properties carry the cardinality needed
  to slice the data later (`asset`, `format`, `stage`, `cta_location`,
  `boilerplate`). No PII in properties, no free-text strings that
  blow up the property dictionary.
- **Provider wiring** — confirm the analytics provider for the project
  (PostHog, Plausible, GA4, Vercel Analytics, etc.) is initialised on
  the route. New surfaces should not silently inherit "no analytics
  because the provider isn't mounted." Check the proxy / reverse-proxy
  setup if the project uses one (e.g. PostHog `/ingest`).
- **Conversion-relevant routes also surface SEO targets**: where a
  route is part of an acquisition funnel, the report must include both
  the SEO position (canonical, OG, indexability) AND the analytics
  events that prove the funnel works. Either one alone leaks half the
  story.
- **Outdated / dead events** — sweep the codebase for `posthog.capture`
  (or equivalent) calls whose event name no longer matches a documented
  matrix entry, or whose target surface was removed. Flag as Medium so
  they get cleaned up rather than rotting in the dashboard.

Findings from this step appear in the same severity buckets as the
SEO findings (🟥 / 🟧 / 🟨 / 🟩) and feed into the same report.

### Step 8 — Compile findings

Produce a report (template below) with every finding categorized by
severity. Hand it to `improve` if any finding reveals a gap in the
*review* or *qa* protocols themselves (e.g., "review never checks for
canonical tags — add it"). For analytics gaps that point at missing
documentation (no event matrix exists yet for a feature area), open a
follow-up to author or extend the project's event matrix before the
gap recurs on the next surface.

---

## Output format

```markdown
## SEO Audit Report: [Branch / Scope / Date]

### Scope
[What was audited: routes, templates, time window]

### Summary
- Indexable routes audited: [N]
- Findings by severity: 🟥 Critical [n] · 🟧 High [n] · 🟨 Medium [n] · 🟩 Low [n]
- Core Web Vitals (mobile, p75): LCP [Xs] · INP [Xms] · CLS [X]
- Net SEO health score: [X/100]

### Findings

#### 🟥 Critical — fix before merge
- [route] [issue + reproduction + impact]
- …

#### 🟧 High — fix this sprint
- …

#### 🟨 Medium — track in TODOS.md
- …

#### 🟩 Low — note in EVOLUTION.md
- …

### Inventory delta
[What changed since the last audit: new routes, removed routes, sitemap drift]

### Protocol gaps surfaced
[Any finding the review/qa/cyber protocols *should* have caught but didn't —
feeds into the improve protocol]

### Next-audit triggers
[What event should cause the next SEO audit: new route under /pricing, content
push planned, schema change, etc.]
```

Severity rubric:

- 🟥 **Critical** — page is unindexable, returns 5xx to Googlebot, has
  conflicting directives, leaks staging into prod index, or breaks a
  canonical chain. Blocks merge.
- 🟧 **High** — missing metadata on a money page, broken structured data,
  CWV in the "Poor" band, hreflang loops. Fix this sprint.
- 🟨 **Medium** — thin content on a target page, missing alt text on
  content images, internal links to redirected URLs. Track and batch.
- 🟩 **Low** — title-tag length suboptimal, OG image undersized, minor
  schema property gaps. Note and move on.

---

## Tools

- **Lighthouse** (CLI: `pnpm dlx lighthouse <url> --view`, or in DevTools): single-page audit covering performance, SEO, accessibility, best-practices.
- **PageSpeed Insights** (https://pagespeed.web.dev) — real-user CWV from CrUX plus lab data; the source of truth for ranking-relevant performance.
- **Google Search Console** — Coverage, Performance, URL Inspection, Sitemaps. Authoritative for "what Google sees".
- **Bing Webmaster Tools** — second-largest crawler; also influences ChatGPT browse.
- **Rich Results Test** (https://search.google.com/test/rich-results) — validates JSON-LD against Google's actual rich-result eligibility.
- **Schema.org Validator** (https://validator.schema.org) — generic JSON-LD validator (no Google-specific rules).
- **`curl` with crawler UA** — `curl -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" <url> -L -o -` to see exactly what Googlebot receives.
- **Screaming Frog** (or equivalent: Sitebulb, Ahrefs Site Audit) — full-site crawl; surfaces internal-link health, duplicate titles, redirect chains. Free up to 500 URLs.
- **Playwright** — for asserting that critical SEO surfaces (title, meta description, JSON-LD blob) actually render server-side.
- **Web Vitals library** (`web-vitals` npm) — wire into the app to send real-user CWV to your analytics / observability stack.

---

## Framework-specific notes

### Next.js (App Router)

- Use the `Metadata` / `generateMetadata` API in `app/**/page.tsx`. Avoid manual `<head>` JSX — it bypasses metadata merging and breaks `metadataBase` resolution.
- Use `app/sitemap.ts` exporting `MetadataRoute.Sitemap` — auto-served at `/sitemap.xml`, no manual XML.
- Use `app/robots.ts` exporting `MetadataRoute.Robots` for the same reason.
- For JSON-LD, render a `<script type="application/ld+json">` *inside* the page component (not in metadata) — the metadata API does not support script tags.
- `next/image` handles `srcset`, lazy-loading, and modern formats automatically. Configure `images.remotePatterns` in `next.config.ts` for any external CDN.
- For dynamic routes, ensure `generateStaticParams` covers the SEO-critical URLs so they render statically at build (much faster TTFB, cleaner crawl).
- Cache Components / PPR (Next.js 16): mark SEO-critical content as `use cache` so it ships from the static shell, not the dynamic island.

### Astro / SvelteKit / Nuxt

- ISR works on all three on Vercel — use it for content that updates daily but should serve from the cache.
- Each has its own metadata helper (`<MetaTags>`, `<svelte:head>`, `useHead`); do not hand-roll head tags in templates.
- Sitemap integrations exist as first-party plugins for each — prefer those over hand-rolled XML generators.

### Static sites

- Generate the sitemap and robots.txt at build time, commit the output to `public/`, and re-run on every deploy.
- Cache headers matter even more without a server — set long `max-age` with content-hashed filenames.

---

## Quality Signals

After this protocol is used, observe these signals to determine if it
performed well:

| Signal                              | ✅ Good                                                                                                              | ❌ Poor                                                                                          |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Indexability accuracy**           | Search Console coverage matches the audit's inventory within a week                                                  | Audit said "all indexable" but Search Console reports significant exclusions                     |
| **Finding actionability**           | Critical/High findings each had a clear fix and were merged within the sprint                                        | Findings were vague ("improve content") and got skipped                                          |
| **CWV trend**                       | Real-user CWV (CrUX / Vercel Speed Insights) improved or held after each audit                                       | Lab scores improved but field scores stayed flat or degraded                                     |
| **Protocol gap detection**          | Audit surfaced gaps the review/qa protocols should have caught, and `improve` was used to amend them                 | Same SEO finding shows up across multiple audits with no upstream protocol change                |
| **Cost of audit vs. value**         | Each audit completes in < 90 min and produces ≥ 1 actionable finding                                                 | Audits balloon to half a day and produce mostly "looks fine" entries                             |
| **AI-crawler readiness**            | Site appears in answer-engine citations (Perplexity, ChatGPT) for target queries when content is strong              | Content ranks in Google but is invisible to AI answer engines                                    |

> If signals trend ⚠️ or ❌, use the **improve protocol** (`.protocols/improve.protocol.md`) to amend.

---

## Rules

- **Never ship `noindex` to production without an explicit reason logged in EVOLUTION.md.** This is the #1 SEO incident shape.
- **Treat staging and preview deploys as `noindex` by default.** Vercel preview URLs are crawled by accident more often than people think.
- **Canonical tags point to absolute URLs**, not relative. Crawlers handle relative canonicals inconsistently.
- **One H1 per page. One canonical per page. One language per page.** Multiplicity here is always a bug.
- **Don't chase ranking with thin programmatic content** — Google's spam policy update (March 2024) and ongoing enforcement specifically targets it. Quality > coverage.
- **Don't fingerprint URLs with session IDs or tracking params in the canonical.** Strip them; let analytics handle attribution.
- **Test crawler-visibility, not just user-visibility.** A page that works for a logged-in user but 404s for Googlebot is invisible to search.
- **Run this protocol before, not after, a content push.** Fixing indexability after Google has crawled the wrong shape is expensive.
- **Findings flow back to the protocols that should have caught them.** If review missed a missing canonical, amend review — don't just fix the canonical.
