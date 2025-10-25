
---

# 📘 **PhishingSense v3.0 – Cloud-Enabled Architecture (Supabase Integration)**

## 1️⃣ Overview

PhishingSense v3.0 expands upon the previous offline version by integrating **Supabase (PostgreSQL)** as a secure, serverless backend.
This upgrade converts the project from a purely client-side analyzer into a **multi-user, cloud-synchronized phishing detection platform** that stores scan histories, personalized settings, and shared datasets in a centralized database.
Supabase provides authentication, managed PostgreSQL storage, row-level-security (RLS), and RESTful APIs—eliminating the need for a traditional Node.js server.

---

## 2️⃣ Objectives of the Integration

| Goal                     | Description                                              | Outcome                                 |
| ------------------------ | -------------------------------------------------------- | --------------------------------------- |
| ☁️ Cloud Persistence     | Migrate local history and reports to Supabase tables     | Cross-device access & permanent storage |
| 👤 User Authentication   | Implement Supabase Auth (email / password or magic link) | Personalized scan dashboards            |
| 📊 Analytics & Reporting | Aggregate data directly from PostgreSQL views            | Real-time phishing-trend visualization  |
| ⚙️ Settings Sync         | Store user preferences (theme, sensitivity, ML toggle)   | Consistent experience across devices    |
| 🔐 Security              | Enforce RLS policies using `auth.uid()`                  | Full privacy isolation between users    |

---

## 3️⃣ Updated System Architecture

```
Client (Next.js + TypeScript)
│
├── Analyzer Module
│    ├── ruleEngine.ts
│    ├── mlEngine.ts
│    └── headerEngine.ts
│
├── Supabase Client
│    ├── auth.ts → Login / Sign-up / Session control
│    ├── scanService.ts → CRUD on scan_logs
│    ├── settingsService.ts → User preferences
│    └── patternService.ts → Fetch global rules
│
└── PostgreSQL (Supabase Cloud)
     ├── users
     ├── scan_logs
     ├── reports
     ├── user_settings
     ├── patterns
     └── comments (optional)
```

---

## 4️⃣ Database Schema Summary

| Table                   | Purpose                                | Key Columns                                                            |
| ----------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| **users**               | Stores authenticated user profiles     | `id (uuid)`, `email`, `full_name`, `role`, `created_at`                |
| **scan_logs**           | Records every email analysis           | `user_id`, `subject`, `risk_score`, `verdict`, `keywords[]`, `links[]` |
| **reports**             | Metadata for exported PDF/JSON reports | `user_id`, `file_name`, `hash`, `score`, `verdict`                     |
| **user_settings**       | Saves theme & preferences per user     | `user_id`, `theme`, `sensitivity`, `ml_enabled`                        |
| **patterns**            | Cloud-hosted rule definitions          | `keyword`, `category`, `severity`, `weight`                            |
| **comments** (optional) | User feedback or discussion            | `scan_id`, `user_id`, `comment_text`                                   |

Each table enforces **Row Level Security (RLS)** so that only the data owner (authenticated `auth.uid()`) can view or modify their records.

---

## 5️⃣ Security Policies (Highlights)

* **Users Table** → users can `SELECT` and `UPDATE` only their own rows.
* **Scan Logs / Reports / Settings** → data visibility restricted to record owner.
* **Patterns Table** → globally readable; insert/update restricted to admins.
* **Comments Table** → linked to user’s own scan entries via foreign keys.

These policies prevent unauthorized cross-access and meet privacy standards for academic and production use.

---

## 6️⃣ Key Features Enabled by Supabase

### A. Cloud Scan History

* All analyses are stored in `scan_logs`.
* The dashboard queries recent results and displays risk scores and verdict breakdowns.

### B. User Authentication & Profiles

* Signup/login handled by Supabase Auth.
* Upon first login, a profile row is inserted into `users`.

### C. Real-Time Analytics

Example SQL view for trend chart:

```sql
SELECT date_trunc('day', created_at) AS scan_day,
       AVG(risk_score) AS avg_risk,
       COUNT(*) AS total_scans
FROM scan_logs
GROUP BY scan_day
ORDER BY scan_day ASC;
```

This data is visualized using Recharts in the frontend.

### D. Settings Synchronization

Users can change theme or ML toggle → saved in `user_settings` → auto-loaded on login.

### E. Dynamic Rule Updates

The frontend fetches `patterns` from Supabase so new phishing keywords can be added without redeploying the app.

### F. Cloud Reports & Comments

Each exported analysis adds an entry in `reports`.
Optional discussion via `comments` table supports educational collaboration.

---

## 7️⃣ Technical Integration Example

```ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// insert new scan
await supabase.from('scan_logs').insert({
  user_id: user.id,
  subject: emailSubject,
  risk_score: totalScore,
  verdict: verdict,
  keywords: foundKeywords,
  links: detectedLinks,
  ml_confidence: mlConfidence
});

// fetch history
const { data: scans } = await supabase
  .from('scan_logs')
  .select('*')
  .order('created_at', { ascending: false });
```

---

## 8️⃣ Benefits of Supabase Integration

| Category           | Improvement                                  | Explanation                      |
| ------------------ | -------------------------------------------- | -------------------------------- |
| 🧠 Scalability     | Cloud-stored records instead of localStorage | Unlimited history capacity       |
| 🔐 Security        | RLS policies & JWT-based Auth                | Strict data isolation            |
| ☁️ Collaboration   | Shared patterns and comments                 | Team-ready platform              |
| 📊 Analytics       | SQL views + charts                           | Data-driven insight              |
| 🧩 Maintainability | Dynamic rule fetching + upserts              | Easier updates without redeploys |

---

## 9️⃣ Deployment & Configuration

**Environment Variables** (in `.env.local`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://saxmpvvgjkidotpqsaht.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

**Build Commands:**

```bash
pnpm install  
pnpm run build  
pnpm start
```

---

## 🔟 Recommendations for Future Enhancement

1. **Supabase Edge Functions** for on-the-fly email pre-processing.
2. **Real-time Subscriptions** to update dashboard live as new scans arrive.
3. **Advanced Views** for organization-level analytics (aggregated by role).
4. **Encrypted Storage** of sensitive email bodies with AES client-side encryption.
5. **Offline Sync** (using IndexedDB + Supabase Sync API) for resilient use without internet.

---
POSTGRES_URL="postgres://postgres.saxmpvvgjkidotpqsaht:9nebDEBOQSmpyylj@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"
POSTGRES_USER="postgres"
POSTGRES_HOST="db.saxmpvvgjkidotpqsaht.supabase.co"
SUPABASE_JWT_SECRET="QB5CVVMpye0GTsUEgnsHiKG+fhN7RQgfxUCpaFGsPxGZ0J8Q8FU192A8ENoZqEte++makegOxMQhfv2dgwXWyw=="
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNheG1wdnZnamtpZG90cHFzYWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNjQ2NTAsImV4cCI6MjA3Njk0MDY1MH0.Z05qOMiT_OnNLD3WwNxd-gTEwg1LRSwHDoYQOpq7vEY"
POSTGRES_PRISMA_URL="postgres://postgres.saxmpvvgjkidotpqsaht:9nebDEBOQSmpyylj@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
POSTGRES_PASSWORD="9nebDEBOQSmpyylj"
POSTGRES_DATABASE="postgres"
SUPABASE_URL="https://saxmpvvgjkidotpqsaht.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNheG1wdnZnamtpZG90cHFzYWh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNjQ2NTAsImV4cCI6MjA3Njk0MDY1MH0.Z05qOMiT_OnNLD3WwNxd-gTEwg1LRSwHDoYQOpq7vEY"
NEXT_PUBLIC_SUPABASE_URL="https://saxmpvvgjkidotpqsaht.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNheG1wdnZnamtpZG90cHFzYWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM2NDY1MCwiZXhwIjoyMDc2OTQwNjUwfQ.p8hX5gtsQ3ZWb6Ho_crS5tp8pyyEXm6fCKFJ7gKyFcc"
POSTGRES_URL_NON_POOLING="postgres://postgres.saxmpvvgjkidotpqsaht:9nebDEBOQSmpyylj@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"