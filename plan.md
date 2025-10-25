Nice choice — phishing email detection is practical, visually impressive, and very doable with your stack. Below is a **comprehensive documentation & implementation plan** tailored for **TypeScript + Next.js (App Router) + React + Tailwind + shadcn/ui**. It covers architecture, data, rule-based + ML-lite options, UI/UX, API endpoints, folder structure, sample code, testing, deployment, timeline, deliverables, and ethics.

# Project summary

**Name:** Phishsense — Phishing Email Detection 
**Goal:** Build a browser-first web app that accepts an email (raw text or headers), analyzes it using rule-based heuristics and an optional lightweight ML model, then shows a clear risk score, highlighted suspicious parts, and remediation tips. No mandatory backend required — can run fully client-side; server-side inference option included.

---

# High-level features

1. Paste or upload email (raw source, .eml, or plain text).
2. Rule-based analyzer (keywords, links, sender checks, suspicious attachments, headers).
3. Lightweight ML classifier (optional) — TF.js model in-browser or a small server-side model via Next.js API.
4. Visual risk score + color-coded verdict (Safe / Suspicious / Phishing).
5. Highlight suspicious phrases, links, and header warnings.
6. Explainability: show which rules fired and why.
7. Save recent analyses (localStorage).
8. Export report (JSON / PDF) for demos.
9. Nice UI built with Tailwind + shadcn components.

---

# Architecture (text diagram)

```
User Browser (React + TF.js optional)
  ├─ UI: Input form, Results, Highlights, History
  ├─ Rule Engine (client)
  └─ ML Inference (option A: client TF.js) OR (option B: Next.js API server -> Node/TF)
Next.js App Router (serverless pages, API routes) -- optional for server-side inference or dataset upload
Static Storage: localStorage for history
Deployment: Vercel (frontend + optional serverless API)
```

---

# Tech stack & libs

- Next.js (13+ App Router) with TypeScript
- React + shadcn/ui components
- Tailwind CSS
- TensorFlow.js (for client-side ML) **or** Node + @tensorflow/tfjs-node for server-side training/inference
- `natural` or `ml-naivebayes` (optional) for a quick Naive Bayes classifier in Node
- `react-markdown` + `rehype` for safe rendering of email content highlights
- `dompurify` for sanitizing HTML (if displaying email HTML)
- `swr` or React Query for client data fetching (if using API)
- `jsPDF` or `html-to-pdf` for report export (client-side)
- Testing: Jest + React Testing Library, and simple evaluation scripts for ML metrics

---

# Data sources (for training / demo)

- Public phishing datasets: Enron Spam dataset (spam/ham), PhishTank (phish URLs), Kaggle phishing corpora. (Be sure to cite and follow dataset licenses.)
- For initial demo, create a small hand-labeled dataset (50–200 examples) containing:

  - genuine emails (bank notifications, receipts, newsletters)
  - phishing samples (data exfiltration, credential prompts)
  - ambiguous/suspicious
    This small dataset is enough to demonstrate ML-lite and compare with rule-based outputs.

---

# Detection approach (recommended path)

**Phase 1 (MVP)** — Rule-based (client-side only)

- Reasons: fastest to build, explainable, no model training required.
- Rules:

  - Suspicious keywords in subject/body (`urgent`, `verify`, `password`, `suspend`, `click here`, `bank`, `account`).
  - URLs: presence of shortened links, mismatched domain vs. displayed text, `javascript:` links.
  - Sender domain anomalies (display name vs. email mismatch).
  - Missing SPF/DKIM/DMARC results in headers (if user pastes raw headers).
  - Attachments with risky extensions (`.exe`, `.scr`, `.zip` without context).
  - HTML indicators: inline JS, `onerror`, excessive `<iframe>` or `<meta refresh>`.
  - Form elements that ask for credentials.

- Scoring: assign weights for rules and compute a 0–100 risk score.

**Phase 2 (Optional)** — ML-lite augmentation

- Use TF-IDF + Logistic Regression or simple Naive Bayes trained on small dataset.
- Train offline (Node) and export model or train in-browser with TF.js if dataset is small.
- Combine rule score and ML probability into a final score (e.g., weighted average).

**Explainability:** always present the activated rules and ML contribution (e.g., ML prob = 0.85).

---

# UX / UI design

Pages / components:

- `/` — Home / Quick Scan input (textarea, file upload, paste raw headers toggle)
- `/analyze` — Results page (risk score, list of findings, highlighted email view, remediation)
- `components/AnalyzerForm.tsx` — Input form
- `components/ResultCard.tsx` — Score + summary
- `components/FindingList.tsx` — Each finding with severity + suggestion
- `components/EmailHighlighter.tsx` — Highlights suspicious tokens/links
- `components/HistoryPanel.tsx` — Recent scans (localStorage)
- Use shadcn `Card`, `Button`, `Progress`, `Badge`, `Toast` for nice visuals.

Design rules:

- Color-coded score: green (>70 safe), yellow (40–70 suspicious), red (<40 phishing) — or invert as you prefer.
- Show a prominent “Explainability” box listing fired rules and suggested fixes.
- Provide a small “Demo data” button that loads preset phishing examples.

---

# Folder structure (Next.js App Router + API)

```
/security
  /app
    /page.tsx               # Home / Analyzer
    /analyze
      /page.tsx             # Result view (optional route)
  /components
    AnalyzerForm.tsx
    ResultCard.tsx
    FindingList.tsx
    EmailHighlighter.tsx
    HistoryPanel.tsx
  /lib
    ruleEngine.ts           # rule-based detection logic
    ml/                    # helper for model loading / TF.js utility
      model.ts
      tfHelpers.ts
  /pages (if using pages router or for api)
    /api
      /predict.ts           # optional server-side inference
  /scripts
    train_model.ts          # Node script to train offline and export
  /public
    demo-emails/*.txt
  /styles
    globals.css
  package.json
  README.md
```

---

# Core implementation details & sample code

### 1) Rule engine (TypeScript) — `lib/ruleEngine.ts`

```ts
// lib/ruleEngine.ts
export type Finding = {
  id: string;
  severity: "low" | "medium" | "high";
  text: string;
  meta?: any;
};

const phishingKeywords = [
  "urgent",
  "verify",
  "password",
  "account suspended",
  "click here",
  "update your account",
  "confirm your account",
  "security alert",
];

function findKeywords(text: string) {
  const found: string[] = [];
  const lower = text.toLowerCase();
  phishingKeywords.forEach((k) => {
    if (lower.includes(k)) found.push(k);
  });
  return found;
}

export function analyzeEmail({
  subject = "",
  body = "",
  from = "",
  headers = "",
}: {
  subject?: string;
  body?: string;
  from?: string;
  headers?: string;
}) {
  const findings: Finding[] = [];

  // 1) suspicious keywords
  const keys = findKeywords((subject || "") + " " + (body || ""));
  if (keys.length > 0) {
    findings.push({
      id: "keywords",
      severity: keys.length > 3 ? "high" : "medium",
      text: `Found suspicious keywords: ${keys.join(", ")}`,
      meta: { keys },
    });
  }

  // 2) URLs: simple regex
  const urlRegex = /https?:\/\/[^\s)"]+/gi;
  const urls = (body || "").match(urlRegex) || [];
  if (urls.length > 0) {
    const suspicious = urls.filter(
      (u) =>
        /bit\.ly|tinyurl|goo\.gl|t\.co|tiny\.cc/.test(u) ||
        /\d+\.\d+\.\d+\.\d+/.test(u)
    );
    if (suspicious.length) {
      findings.push({
        id: "short-url",
        severity: "medium",
        text: `Found suspicious short/IP URLs: ${suspicious.join(", ")}`,
        meta: { suspicious },
      });
    }
    // check mismatched anchor text is harder without HTML; skip for plaintext
  }

  // 3) sender mismatch (heuristic)
  const displayNameMatch = /"?.+"?\s*<(.+)>/.exec(from || "");
  if (displayNameMatch) {
    const email = displayNameMatch[1];
    // crude check: sender domain suspicious (free email used by banks)
    if (/(paypal|bank|service)\./i.test(email)) {
      // maybe ok; just push medium
      findings.push({
        id: "sender-domain",
        severity: "medium",
        text: `Sender email looks suspicious: ${email}`,
        meta: { email },
      });
    }
  } else if (from && !from.includes("@")) {
    findings.push({
      id: "sender-format",
      severity: "high",
      text: "Sender header malformed",
    });
  }

  // 4) attachments and forms: (if email HTML contains <form> or attachments flagged)
  if (/\.exe|\.scr|\.zip|\.scr/i.test(body || "")) {
    findings.push({
      id: "attachment",
      severity: "high",
      text: "Suspicious attachment extension found",
    });
  }

  // compute score (baseline 100)
  let score = 100;
  findings.forEach((f) => {
    if (f.severity === "high") score -= 35;
    else if (f.severity === "medium") score -= 15;
    else score -= 5;
  });
  if (score < 0) score = 0;

  return {
    findings,
    score,
    summary:
      score < 40 ? "Phishing" : score < 70 ? "Suspicious" : "Likely safe",
  };
}
```

### 2) Simple client-side inference usage (React)

```tsx
// components/AnalyzerForm.tsx
import { useState } from "react";
import { analyzeEmail } from "@/lib/ruleEngine";

export default function AnalyzerForm() {
  const [subject, setSubject] = useState("");
  const [from, setFrom] = useState("");
  const [body, setBody] = useState("");
  const [result, setResult] = useState<any>(null);

  function onAnalyze() {
    const res = analyzeEmail({ subject, body, from });
    setResult(res);
    // persist to localStorage history if desired
  }

  return (
    <div>
      <input
        placeholder="From"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
      />
      <input
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      <textarea
        placeholder="Paste email body here"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button onClick={onAnalyze}>Analyze</button>

      {result && (
        <div>
          <div>Score: {result.score}</div>
          <div>Verdict: {result.summary}</div>
          <ul>
            {result.findings.map((f: any) => (
              <li key={f.id}>
                {f.text} — {f.severity}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### 3) Optional: TF.js model integration (client)

- Train a TF.js model offline or in Node with TF-IDF vectors → Logistic Regression (or a small dense NN).
- Export weights and load them with `@tensorflow/tfjs` in the browser.
- Use `lib/ml/model.ts` to wrap model load and `predict(text)` → probability.

**Note:** For a demo, a rule-based system + a tiny in-browser NaiveBayes implemented in JS is simpler.

---

# Next.js API (optional) — `/pages/api/predict.ts`

Use this if you prefer server-side inference (e.g., bigger model or trained node model).

```ts
// pages/api/predict.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { analyzeEmail } from "../../lib/ruleEngine";
// optional: import server ML model loader

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();
  const { subject, body, from } = req.body;
  if (!body) return res.status(400).json({ error: "body required" });

  const ruleRes = analyzeEmail({ subject, body, from });
  // optional: run ML server-side -> mlProb
  // combine -> final score
  res.status(200).json({ ...ruleRes });
}
```

# README template (short)

````md
# Phishsense

Phishsense is a lightweight phishing email detection demo built with Next.js, TypeScript, Tailwind CSS, and shadcn.

## Features

- Paste email body/headers and get a risk score
- Explainable rule-based findings
- Highlight suspicious text and links
- Export analysis report (JSON/PDF)
- No backend required (client-only). Optional Next.js API for server inference.

---

# Ethics & safety notes (must include in presentation)

- State clearly: **This tool is educational only** — not a replacement for professional email security.
- Never scan or ingest private emails without consent.
- Do not encourage misuse (phishing creation, exploitation).
- Report false positives/negatives and include a disclaimer.

---

# Optional stretch ideas (if extra time)

- Integrate DNS/SPF/DMARC checks by parsing `Received` headers (requires network lookups; server-side).
- Use embeddings + cosine similarity to detect template-based phishing (requires more data).
- Add user feedback loop to improve model (labeling UI).

---

```

```
````
