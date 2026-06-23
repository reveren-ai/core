import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  BUNDLED_PROTOCOLS,
  ProtocolsConfigSchema,
  type ProtocolsConfig
} from '../config/schema.js'

/**
 * Deterministic repo scan that powers `rvr init --preset vibe-coder`.
 *
 * 100% local, no model, no network — it reads files synchronously off disk
 * (same posture as `detectPackageManager()`), infers a `ProtocolsConfig`,
 * selects a subset of the bundled protocols, and surfaces the raw signals so
 * the emitted generation brief can explain itself to the user's agent.
 *
 * Every rule is "if signal present → value; else → default". Nothing here calls
 * a model — that stays the job of the user's own agent.
 */

type Domain = ProtocolsConfig['compliance']['domain']

export interface ScanSignals {
  projectName: string | null
  stackTell: string | null
  detectedRunners: string[]
  agentFamilies: string[]
  domain: Domain
  domainTells: string[]
  triggerPaths: string[]
  hasUiSurface: boolean
  hasPublicWebRoutes: boolean
  hasAuth: boolean
  hasDb: boolean
  hasPayments: boolean
  hasAnalytics: boolean
  hasDeployConfig: boolean
}

export interface ScanResult {
  config: ProtocolsConfig
  selectedProtocols: string[]
  skippedProtocols: string[]
  signals: ScanSignals
}

interface Probe {
  deps: Set<string>
  scripts: Record<string, string>
  pkgRaw: Record<string, unknown> | null
  fileExists: (rel: string) => boolean
  dirExists: (rel: string) => boolean
}

function buildProbe(cwd: string): Probe {
  let pkgRaw: Record<string, unknown> | null = null
  const deps = new Set<string>()
  let scripts: Record<string, string> = {}
  const pkgPath = path.join(cwd, 'package.json')
  if (existsSync(pkgPath)) {
    try {
      pkgRaw = JSON.parse(readFileSync(pkgPath, 'utf8')) as Record<string, unknown>
      const d = (pkgRaw.dependencies ?? {}) as Record<string, string>
      const dd = (pkgRaw.devDependencies ?? {}) as Record<string, string>
      for (const name of [...Object.keys(d), ...Object.keys(dd)]) deps.add(name)
      scripts = (pkgRaw.scripts ?? {}) as Record<string, string>
    } catch {
      // Malformed package.json — treat as absent rather than crashing init.
      pkgRaw = null
    }
  }
  const fileExists = (rel: string): boolean => existsSync(path.join(cwd, rel))
  const dirExists = fileExists
  return { deps, scripts, pkgRaw, fileExists, dirExists }
}

/** True if any dependency name matches one of the given names. */
function hasDep(probe: Probe, ...names: string[]): boolean {
  return names.some((n) => probe.deps.has(n))
}

/** True if any dependency name starts with one of the given scope prefixes. */
function hasDepPrefix(probe: Probe, ...prefixes: string[]): boolean {
  for (const dep of probe.deps) {
    if (prefixes.some((p) => dep.startsWith(p))) return true
  }
  return false
}

function inferStack(probe: Probe): { stack: ProtocolsConfig['stack']; tell: string | null } {
  if (hasDep(probe, 'next') || probe.fileExists('next.config.js') || probe.fileExists('next.config.mjs') || probe.fileExists('next.config.ts')) {
    return { stack: 'next', tell: 'next' }
  }
  if (hasDep(probe, '@remix-run/react', '@remix-run/node') || probe.fileExists('remix.config.js')) {
    return { stack: 'remix', tell: '@remix-run' }
  }
  if (hasDep(probe, '@sveltejs/kit') || probe.fileExists('svelte.config.js')) {
    return { stack: 'sveltekit', tell: '@sveltejs/kit' }
  }
  if (hasDep(probe, 'astro') || probe.fileExists('astro.config.mjs') || probe.fileExists('astro.config.ts')) {
    return { stack: 'astro', tell: 'astro' }
  }
  if ((hasDep(probe, 'vite') && hasDep(probe, 'react', 'react-dom')) || hasDep(probe, 'react', 'react-dom')) {
    return { stack: 'vite-react', tell: 'react' }
  }
  // No framework tell. With no manifest at all, default to the modal vibe-coder
  // output (Next.js, matching defaultConfig); a present manifest with no
  // framework is genuinely generic.
  return { stack: probe.pkgRaw ? 'generic' : 'next', tell: null }
}

function inferLanguage(probe: Probe): ProtocolsConfig['language'] {
  if (probe.fileExists('tsconfig.json') || hasDep(probe, 'typescript')) return 'ts'
  // No TypeScript tell. Treat a real (parsed) package.json as a JS project;
  // fall back to the schema default of 'ts' only when there's no manifest.
  return probe.pkgRaw ? 'js' : 'ts'
}

function inferPackageManager(cwd: string, probe: Probe): ProtocolsConfig['packageManager'] {
  const pm = typeof probe.pkgRaw?.packageManager === 'string' ? (probe.pkgRaw.packageManager as string) : ''
  if (pm.startsWith('pnpm@')) return 'pnpm'
  if (pm.startsWith('npm@')) return 'npm'
  if (pm.startsWith('yarn@')) return 'yarn'
  if (pm.startsWith('bun@')) return 'bun'
  if (existsSync(path.join(cwd, 'pnpm-lock.yaml'))) return 'pnpm'
  if (existsSync(path.join(cwd, 'package-lock.json'))) return 'npm'
  if (existsSync(path.join(cwd, 'yarn.lock'))) return 'yarn'
  if (existsSync(path.join(cwd, 'bun.lockb')) || existsSync(path.join(cwd, 'bun.lock'))) return 'bun'
  return 'pnpm'
}

function inferTesting(probe: Probe): { testing: ProtocolsConfig['testing']; runners: string[] } {
  const runners: string[] = []
  if (hasDep(probe, 'vitest')) runners.push('vitest')
  if (hasDep(probe, 'jest', 'ts-jest')) runners.push('jest')
  if (hasDep(probe, '@playwright/test')) runners.push('playwright')
  if (runners.includes('vitest')) return { testing: 'vitest', runners }
  if (runners.includes('jest')) return { testing: 'jest', runners }
  if (runners.includes('playwright')) return { testing: 'playwright', runners }
  return { testing: 'vitest', runners }
}

function inferAgent(probe: Probe): { agent: ProtocolsConfig['agent']; families: string[] } {
  const families: string[] = []
  if (probe.fileExists('.cursorrules') || probe.dirExists('.cursor/rules')) families.push('cursor')
  if (probe.fileExists('CLAUDE.md') || probe.fileExists('.clinerules')) families.push('claude')
  if (probe.fileExists('.github/copilot-instructions.md')) families.push('copilot')
  if (probe.fileExists('.windsurfrules')) families.push('windsurf')
  if (families.length === 1) {
    return { agent: families[0] as ProtocolsConfig['agent'], families }
  }
  if (families.length >= 2) return { agent: 'multiple', families }
  return { agent: 'claude', families }
}

const FINANCE_TELLS = ['stripe', '@stripe/stripe-js', '@stripe/react-stripe-js', 'plaid', 'react-plaid-link', 'dinero.js', 'currency.js', 'big.js', 'decimal.js', 'ccxt']
const HEALTH_TELLS = ['fhir', 'fhir-kit-client', 'hl7', 'node-hl7-client', '@medplum/core']
const AI_TELLS = ['openai', '@anthropic-ai/sdk', '@google/generative-ai', 'cohere-ai', 'mistralai', 'ai', 'langchain', 'llamaindex', 'chromadb']
const CONSUMER_TELLS = ['next-auth', '@clerk/nextjs', '@supabase/supabase-js', 'firebase', '@auth0/nextjs-auth0', 'posthog-js', 'mixpanel-browser', '@sentry/nextjs', 'resend', '@shopify/hydrogen']

function inferDomain(probe: Probe): { domain: Domain; tells: string[] } {
  const matched = (list: string[]): string[] => list.filter((n) => probe.deps.has(n))
  const fin = matched(FINANCE_TELLS)
  if (fin.length) return { domain: 'finance', tells: fin }
  const health = matched(HEALTH_TELLS)
  if (health.length) return { domain: 'healthcare', tells: health }
  const ai = matched(AI_TELLS)
  if (ai.length || hasDepPrefix(probe, '@ai-sdk/', '@langchain/', '@huggingface/')) {
    return { domain: 'ai-product', tells: ai.length ? ai : ['@ai-sdk/*'] }
  }
  const consumer = matched(CONSUMER_TELLS)
  if (consumer.length || hasDepPrefix(probe, '@clerk/', '@auth/', '@segment/')) {
    return { domain: 'consumer', tells: consumer.length ? consumer : ['@clerk/*'] }
  }
  return { domain: 'generic', tells: [] }
}

function collectTriggerPaths(probe: Probe): string[] {
  const candidates = ['prisma/schema.prisma', 'drizzle.config.ts', 'app/api', 'src/app/api']
  return candidates.filter((p) => probe.fileExists(p))
}

function inferStorybook(probe: Probe, stack: ProtocolsConfig['stack']): ProtocolsConfig['storybook'] {
  const hasSb = hasDep(probe, 'storybook') || hasDepPrefix(probe, '@storybook/') || probe.dirExists('.storybook')
  if (hasSb) {
    return {
      mode: 'full',
      autoGenerateStories: true,
      deployTarget: hasDep(probe, 'chromatic') ? 'chromatic' : 'github-pages'
    }
  }
  if (stack === 'generic') {
    return { mode: 'disabled', autoGenerateStories: false, deployTarget: 'none' }
  }
  return { mode: 'hosted-gallery', autoGenerateStories: true, deployTarget: 'github-pages' }
}

const BASELINE: string[] = [
  'plan-product',
  'plan-engineering',
  'review',
  'qa',
  'ship',
  'document',
  'improve'
]

function selectProtocols(probe: Probe, stack: ProtocolsConfig['stack'], domain: Domain): string[] {
  // No package.json at all → ship the full set; the agent prunes during review.
  if (!probe.pkgRaw) return [...BUNDLED_PROTOCOLS]

  const selected = new Set<string>(BASELINE)
  selected.add('capture-learnings')
  selected.add('audit-protocols')

  const rendersUi = stack !== 'generic'
  const hasUiDeps = hasDep(probe, 'tailwindcss') || hasDepPrefix(probe, '@mui/', '@chakra-ui/', '@radix-ui/', '@shadcn/')
  if (rendersUi || hasUiDeps) selected.add('plan-ux')

  const hasContent = probe.fileExists('content') || hasDep(probe, 'next-intl', 'react-i18next')
  if (selected.has('plan-ux') || hasContent) selected.add('copywriter')

  const isWebStack = ['next', 'remix', 'sveltekit', 'astro'].includes(stack)
  if (isWebStack && (probe.dirExists('app') || probe.dirExists('src/app') || probe.dirExists('pages') || hasDep(probe, 'next-sitemap'))) {
    selected.add('seo')
  }

  const hasAuth = hasDep(probe, 'next-auth', 'lucia', '@auth0/nextjs-auth0') || hasDepPrefix(probe, '@clerk/', '@auth/')
  const hasDb = hasDep(probe, 'prisma', '@prisma/client', 'drizzle-orm', 'pg', 'mysql2')
  const hasPayments = hasDep(probe, 'stripe', 'plaid')
  if (domain === 'finance' || domain === 'healthcare' || hasAuth || hasDb || hasPayments) {
    selected.add('cyber')
  }

  const hasDeploy = probe.fileExists('vercel.json') || probe.fileExists('netlify.toml') || probe.fileExists('Dockerfile') || probe.dirExists('.github/workflows')
  if (hasDeploy || hasDb) selected.add('pre-production')

  const hasAnalytics = hasDep(probe, 'posthog-js', 'mixpanel-browser', 'canny') || hasDepPrefix(probe, '@sentry/', '@segment/')
  if (hasAnalytics || ['consumer', 'finance', 'ai-product'].includes(domain)) {
    selected.add('learn-from-users')
  }

  // Preserve canonical bundled order.
  return BUNDLED_PROTOCOLS.filter((p) => selected.has(p))
}

export function scanRepo(cwd: string): ScanResult {
  const probe = buildProbe(cwd)
  const { stack, tell } = inferStack(probe)
  const language = inferLanguage(probe)
  const packageManager = inferPackageManager(cwd, probe)
  const { testing, runners } = inferTesting(probe)
  const { agent, families } = inferAgent(probe)
  const { domain, tells } = inferDomain(probe)
  const triggerPaths = collectTriggerPaths(probe)
  const storybook = inferStorybook(probe, stack)
  const selectedProtocols = selectProtocols(probe, stack, domain)

  const config = ProtocolsConfigSchema.parse({
    stack,
    agent,
    language,
    packageManager,
    testing,
    activeProtocols: selectedProtocols,
    storybook,
    compliance: { domain, triggerPaths, jurisdictions: [] }
  })

  const signals: ScanSignals = {
    projectName: typeof probe.pkgRaw?.name === 'string' ? (probe.pkgRaw.name as string) : null,
    stackTell: tell,
    detectedRunners: runners,
    agentFamilies: families,
    domain,
    domainTells: tells,
    triggerPaths,
    hasUiSurface: stack !== 'generic' || hasDep(probe, 'tailwindcss'),
    hasPublicWebRoutes: ['next', 'remix', 'sveltekit', 'astro'].includes(stack),
    hasAuth: hasDep(probe, 'next-auth', 'lucia') || hasDepPrefix(probe, '@clerk/', '@auth/'),
    hasDb: hasDep(probe, 'prisma', '@prisma/client', 'drizzle-orm', 'pg', 'mysql2'),
    hasPayments: hasDep(probe, 'stripe', 'plaid'),
    hasAnalytics: hasDep(probe, 'posthog-js', 'mixpanel-browser') || hasDepPrefix(probe, '@sentry/'),
    hasDeployConfig: probe.fileExists('vercel.json') || probe.dirExists('.github/workflows')
  }

  const skippedProtocols = BUNDLED_PROTOCOLS.filter((p) => !selectedProtocols.includes(p))
  return { config, selectedProtocols, skippedProtocols, signals }
}
