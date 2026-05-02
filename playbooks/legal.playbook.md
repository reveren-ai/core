# Playbook: Legal Review

> Cognitive mode: Compliance-aware reviewer
> **NOT a substitute for professional legal advice.** This playbook flags potential issues for human review by a qualified domain-specialist lawyer. Regulated environments (financial services, healthcare, regulated AI uses, consumer privacy) are too nuanced for AI-only review.

---

## When to use

This playbook is **on-demand** — it is not wired into the default pipeline. Invoke it explicitly for changes that touch any of the surfaces configured in `playbooks.config.ts → compliance.triggerPaths`, and add it as a pipeline step (before `ship`) for releases that ship user-visible regulatory copy.

**Configure your trigger surfaces** in `playbooks.config.ts`:

```ts
export default definePlaybooksConfig({
  // ...
  compliance: {
    domain: "finance",          // or "healthcare", "ai-product", "consumer", "generic"
    triggerPaths: [
      "app/(public)/privacy/**",
      "app/(public)/terms/**",
      "app/(public)/pricing/**",
      // add any paths that ship regulated copy
    ],
    partnerNamingPaths: [],     // any code paths that mention regulated partners
    disclaimerCopy: "...",      // your project's required disclaimer text, if any
    brokerAttribution: "...",   // for finance projects: required broker/AFSL attribution string
    jurisdictions: ["AU", "UK", "US"]
  }
})
```

If the diff touches none of the configured surfaces, do not run the playbook — it has real opportunity cost, and running it on every change produces noise that erodes signal when it matters.

## How to think

You are a compliance-conscious reviewer who knows enough to flag risks but not enough to give legal opinions. Your job is to **identify issues and escalate** — never to declare something "legally compliant."

## Review Checklist

The checklist sections below are organised by domain. Run only the sections matching `compliance.domain` from `playbooks.config.ts`; skip the rest.

### Domain: `finance` — Financial Services Compliance

- [ ] **No personal financial advice** — Does the content avoid making specific investment recommendations to individual users? General market commentary and analysis is fine; "you should buy X" is not.
- [ ] **Disclaimer present** — Does the page include `compliance.disclaimerCopy` from config? Required pattern: "[Project] does not provide personal financial advice. All analysis, predictions, and AI-generated content are for informational purposes only."
- [ ] **Broker attribution** — If trade execution is mentioned, is `compliance.brokerAttribution` properly applied? Required pattern: "Trades executed by [Broker] (AFSL [number])" or "powered by [Broker]."
- [ ] **No return promises** — Does the content avoid promising, implying, or suggesting guaranteed investment returns?
- [ ] **AI disclosure** — Is AI-generated content clearly labeled as such?
- [ ] **Risk acknowledgment** — If discussing investments, is risk mentioned? ("Past performance is not indicative of future results," "All investments carry risk.")

### Domain: `healthcare` — Health/Medical Compliance

- [ ] **No medical advice** — Generic health information is fine; "you have condition X, take medication Y" is not.
- [ ] **HIPAA / equivalent privacy** — Are PHI handling claims accurate?
- [ ] **FDA / TGA / MHRA disclosure** — If discussing medical devices or therapies, is regulatory status accurate?

### Domain: `ai-product` — AI/ML Disclosure

- [ ] **AI disclosure** — Is AI-generated content clearly labeled?
- [ ] **Model behaviour caveats** — Are limitations of AI outputs disclosed (hallucination, training-data cutoffs, bias)?
- [ ] **Training data claims** — Are claims about training data and provenance accurate?

### Domain: `consumer` — Consumer Protection (all domains)

- [ ] **No misleading claims** — Avoid superlatives like "guaranteed," "risk-free," "always works"
- [ ] **"Coming Soon" for unbuilt features** — Don't present planned features as currently available
- [ ] **Partner descriptions accurate** — Don't overstate the nature of partner relationships

### Data & Privacy (all domains)

- [ ] **Consent language clear** — If collecting data, is the purpose clearly stated?
- [ ] **Anonymization claims accurate** — Don't claim data is "anonymized" unless it truly cannot be re-identified. Prefer "aggregated" for combined statistics.
- [ ] **Third-party sharing disclosed** — If data goes to external services, is this mentioned in the privacy context?
- [ ] **Opt-out available** — For non-essential data processing (analytics, model training), is there an opt-out path?
- [ ] **Cross-border transfer noted** — If data is processed outside the user's jurisdiction, is this disclosed?

### Terms & Conditions (all domains)

- [ ] **User content licensing clear** — If users submit content, are the licensing terms clear?
- [ ] **Refund policy present** — For paid subscriptions, is the refund/cancellation process described?
- [ ] **Dispute resolution specified** — Is governing law and dispute resolution process stated?
- [ ] **Age restriction** — Is the minimum age stated for the platform?

## Jurisdictional Notes

Run the sections matching `compliance.jurisdictions` from config.

### Australia (`AU`)
- Australian Privacy Principles (APPs) under Privacy Act 1988
- For finance: AFSL regime — many products operate under a partner AFSL as a Corporate Authorised Representative (CAR)
- ACCC consumer protection — no misleading or deceptive conduct
- For finance: Design and distribution obligations (DDO) for financial products

### United Kingdom (`UK`)
- UK GDPR (post-Brexit Data Protection Act 2018)
- For finance: FCA rules — Appointed Representative model
- Consumer Duty (FCA PS22/9) — outcomes-focused consumer protection
- For finance: Financial promotions regime — any content that could be a "financial promotion" needs FCA approval

### United States (`US`)
- For finance: SEC regulations — depends on product classification
- State-level privacy laws (CCPA, state-by-state)
- For finance: Broker-dealer registration requirements

## Output Format

After reviewing, produce a structured report:

```markdown
## Legal Review — [Page/Feature Name]

### Findings

| # | Severity | Issue | Location | Recommendation |
|---|----------|-------|----------|----------------|
| 1 | HIGH | [description] | [file:line or section] | [action needed] |

### Summary
[1-2 sentence summary: safe to ship, needs fixes before ship, or needs lawyer review]

### Escalate to Lawyer?
[YES/NO — and why]
```

**Severity levels:**
- **HIGH** — Must fix before shipping. Legal risk, regulatory non-compliance, or misleading content.
- **MEDIUM** — Should fix. Not immediately dangerous but could create issues at scale or in specific jurisdictions.
- **LOW** — Best practice improvement. No immediate legal risk but would strengthen compliance posture.
- **ESCALATE** — Cannot determine risk level. Needs qualified legal review.

## Reference Documents

Configure paths to your project's regulatory documents in `playbooks.config.ts → compliance.referenceDocs`. Common entries:

- Terms of Service page route
- Privacy Policy page route
- Any partnership / CAR / Appointed-Representative agreements
- Data licensing review
- Monetisation / pricing policy

## Quality Signals

- Every finding has a specific location (file:line or section reference)
- HIGH findings never ship without resolution
- ESCALATE findings are routed to a human lawyer, not resolved by AI
- The playbook never declares content "legally compliant" — only "no issues found by this review"
- False negatives (missing a real issue) are worse than false positives (flagging a non-issue)
