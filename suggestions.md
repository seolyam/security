# 📘 Improving Risk Scoring for Email Phishing Detection

## 1. Introduction

A robust phishing-detection system must balance two competing goals:

1. **High sensitivity** (catch as many phishing emails as possible)
2. **High specificity** (avoid misclassifying legitimate emails as phishing)

Research shows that static rules alone no longer suffice, because attackers use AI, look-alike domains, and other evasive tactics. ([TechRadar][1])
Therefore, risk scoring must integrate multiple signals, use layered analysis, and adapt to evolving threats.

---

## 2. Core Components of a Good Risk Score

To improve your risk scoring, consider combining the following components:

### A. Email Authentication Signals

- Check whether the domain passes **SPF**, **DKIM**, and **DMARC**. If any fail or are missing, it raises risk. ([Wikipedia][2])
- Analyse the `Return-Path`, `From` header mismatch, and presence of suspicious intermediate hops.
- Assign weights: e.g., SPF fail = +20 risk points, DKIM invalid = +25, DMARC missing = +15.

### B. Sender & Domain Reputation

- Is the sender domain new, rarely used, or seen in block-lists?
- Does the display name match the actual domain (e.g., “Apple Support” but domain is `apple-verify.example.com`)?
- Domain lookalike/homograph detection (e.g., Cyrillic “a” vs Latin “a”) should add extra risk.
  Research into modern phishing emphasises this. ([TechRadar][1])

### C. Content / Heuristic Analysis

- Keyword patterns: “urgent”, “verify now”, “account suspended”, “payment required”.
- Link analysis: shortened URLs, embedded redirect chains, domains not matching brand.
- Attachment analysis: embedded executables, macros, unusual file extensions (e.g., `.scr`, `.exe`, `.zip`).
- HTML content: embedded forms, iframes, scripts inside body.
- Contextual cues: Does the email request unexpected action (e.g., wire transfer, credential submission) from the user?
  Research confirms the value of combining these cues. ([arXiv][3])

### D. Machine-Learning / Statistical Signals

- Use trained models (e.g., client-side with TensorFlow.js) that take text features, header features, link features, etc.
- Provide a “confidence” score from the model (e.g., 0.92 = very likely phishing).
- Use hybrid scoring: combine rule-based score + ML score into final risk metric. This is aligned with research showing hybrid systems perform better. ([arXiv][4])

### E. Behavioural / Contextual Signals

- Is the email unexpected for the recipient? (e.g., first time they get this type of request)
- Does the user normally interact with that sender?
- Is the timing odd (e.g., weekend, late night, outside business hours)?
- Are there previous interactions with the same sender domain?

---

## 3. Risk Score Framework & Weighting

Define a **scoring model** so your system produces a understandable risk score (e.g., 0-100). Example:

| Component                      | Weight (%) |
| ------------------------------ | ---------- |
| Authentication signals         | 20%        |
| Sender / Domain reputation     | 20%        |
| Heuristic content analysis     | 30%        |
| ML model confidence            | 20%        |
| Behavioural/contextual signals | 10%        |

You can tune weights based on your dataset and false-positive/false-negative tradeoffs.
Ensure you **calibrate** the score thresholds: e.g.,

- <30 = Low risk
- 30-60 = Medium risk
- > 60 = High risk

Include explanation for users: Why this email got the score it did (e.g., “DKIM failed”, “Shortened URL”, “ML confidence 0.92”).

---

## 4. Minimising False Positives (Legit emails flagged)

- Use **whitelisting** for known senders or domains (e.g., internal domain, trusted partners).
- Use user-specific history: if user regularly receives that type of email and has interacted safely, apply lower weight to “unknown sender” signal.
- Set more relaxed thresholds for internal communications (e.g., internal domain + valid DKIM maybe skip high risk).
- Provide user feedback: allow marking as “legit”, then use that to adjust weights/patterns (client-side learning).
- Avoid over-penalising legitimate bulk mails (newsletters, notifications) by categorising them separately.

---

## 5. Minimising False Negatives (Phishing emails missed)

- Regularly update rule patterns (`patterns.json`) from threat intel feeds.
- Use **adversarial training** in ML: simulate new phishing tactics, use synthetic data (research supports this). ([arXiv][5])
- Monitor classifier performance: track false-negative cases, incorporate user reports of missed phishing.
- Integrate external threat intelligence: phishing domain lists, URL blacklists, etc.
- Validate attachments and embedded URLs with sandbox or threat-feed lookup.

---

## 6. Explainability & User Trust

- Show breakdown: e.g., “Authentication: FAIL (DKIM) → +20 points”, “Short URL → +15 points”, “ML confidence 0.88 → +18 points”.
- Visual gauges or charts help users understand risk rather than just show “High Risk”.
- Provide “Why flagged” section for each suspicious attribute. This builds trust and helps users learn.

---

## 7. Implementation Tips for Your Next.js/React App

- **Modular engine design**: separate file for each engine (authEngine.ts, senderEngine.ts, contentEngine.ts, mlEngine.ts) so you can easily update weights.
- **Configurable weights**: allow user or admin to adjust sensitivity thresholds and weights in settings (persist via Supabase).
- **Batch mode & history**: allow scanning multiple emails and aggregate results to spot patterns.
- **Performance optimization**: run heavy ML inference in **Web Workers** so UI stays responsive.
- **Offline/Cache dataset**: load rule patterns from local storage but allow update fetch from server when online.

---

## 8. Evaluation & Metrics

Track metrics to continuously improve your system:

- False positive rate (%)
- False negative rate (%)
- Average risk score of true phishing vs true legit
- Precision, Recall, F1-score for ML model
- Time to detection (latency)
- User-reported overrides (legit emails flagged or phishing missed)

Use this data for tuning and documentation in your project report.

---

## 9. Future Improvement Areas

- **Adaptive weighting**: automatically adjust weights based on classifier performance.
- **Behavioral modelling**: learn normal user communication patterns and flag deviations.
- **Multilingual support**: detect phishing in different languages and local contexts.
- **Image/attachment-based phishing**: detect login forms embedded within images or attachments.
- **LLM explanation module**: use lightweight LLM to “summarise why this is phishing” for end-user suggestions (research supports this). ([arXiv][6])

---

## 10. Summary

By combining authentication checks, sender reputation, content heuristics, ML confidence, and behavioural context — and doing so in a transparent, explainable way — you can significantly improve your phishing detector’s accuracy, reduce both false positives and false negatives, and deliver a high-quality project for your exam.
Remember to calibrate thresholds, monitor performance, and continuously update your rule base.

[1]: https://www.techradar.com/pro/security/ai-is-making-phishing-emails-far-more-convincing-with-fewer-typos-and-better-formatting-heres-how-to-stay-safe?utm_source=chatgpt.com "AI is making phishing emails far more convincing with fewer typos and better formatting: Here's how to stay safe"
[2]: https://en.wikipedia.org/wiki/Sender_Policy_Framework?utm_source=chatgpt.com "Sender Policy Framework"
[3]: https://arxiv.org/abs/2105.07582?utm_source=chatgpt.com "RAIDER: Reinforcement-aided Spear Phishing Detector"
[4]: https://arxiv.org/abs/2505.23803?utm_source=chatgpt.com "MultiPhishGuard: An LLM-based Multi-Agent System for Phishing Email Detection"
[5]: https://arxiv.org/abs/2509.21129?utm_source=chatgpt.com "EvoMail: Self-Evolving Cognitive Agents for Adaptive Spam and Phishing Email Defense"
[6]: https://arxiv.org/abs/2402.18093?utm_source=chatgpt.com "ChatSpamDetector: Leveraging Large Language Models for Effective Phishing Email Detection"
