## 🧠 **Database Enhancements & Reference SQL**

The following script provisions every table, policy, view, and helper function the app expects (including the optional ideas discussed earlier). Run it once in your Supabase SQL editor or psql shell.

```sql
-- Ensure UUID utilities are available
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------
-- Trusted senders table: cross-device allow-list
-- ------------------------------------------------------------------
create table if not exists public.trusted_senders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sender text not null,
  domain text not null,
  subject text,
  notes text,
  confirmation_count integer not null default 1,
  auth_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_confirmed_at timestamptz not null default now(),
  constraint trusted_senders_user_sender_key unique (user_id, sender)
);

create index if not exists trusted_senders_domain_idx on public.trusted_senders (domain);
create index if not exists trusted_senders_last_confirmed_idx on public.trusted_senders (last_confirmed_at);

create or replace function public.set_trusted_senders_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_trusted_senders_updated_at on public.trusted_senders;
create trigger trg_trusted_senders_updated_at
before update on public.trusted_senders
for each row execute function public.set_trusted_senders_updated_at();

alter table public.trusted_senders enable row level security;

-- Policies (split insert/update for clarity & upsert support)
drop policy if exists "Trusted senders: owners can read" on public.trusted_senders;
drop policy if exists "Trusted senders: owners can insert" on public.trusted_senders;
drop policy if exists "Trusted senders: owners can update" on public.trusted_senders;

create policy "Trusted senders: owners can read"
  on public.trusted_senders for select
  using (auth.uid() = user_id);

create policy "Trusted senders: owners can insert"
  on public.trusted_senders for insert
  with check (auth.uid() = user_id);

create policy "Trusted senders: owners can update"
  on public.trusted_senders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------------
-- Sender behavior table: interaction history & scoring context
-- ------------------------------------------------------------------
create table if not exists public.sender_behavior (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sender text not null,
  domain text not null,
  total_interactions integer not null default 0,
  phishing_interactions integer not null default 0,
  safe_interactions integer not null default 0,
  suspicious_interactions integer not null default 0,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sender_behavior_user_sender_key unique (user_id, sender)
);

create index if not exists sender_behavior_domain_idx on public.sender_behavior (domain);
create index if not exists sender_behavior_updated_idx on public.sender_behavior (updated_at);

create or replace function public.set_sender_behavior_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_sender_behavior_updated_at on public.sender_behavior;
create trigger trg_sender_behavior_updated_at
before update on public.sender_behavior
for each row execute function public.set_sender_behavior_updated_at();

alter table public.sender_behavior enable row level security;

-- Policies supporting inserts/updates and RPC usage
drop policy if exists "Sender behavior: owners can read" on public.sender_behavior;
drop policy if exists "Sender behavior RPC guard" on public.sender_behavior;
drop policy if exists "Sender behavior RPC update guard" on public.sender_behavior;

create policy "Sender behavior: owners can read"
  on public.sender_behavior for select
  using (auth.uid() = user_id);

create policy "Sender behavior RPC guard"
  on public.sender_behavior for insert
  with check (auth.uid() = user_id);

create policy "Sender behavior RPC update guard"
  on public.sender_behavior for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------------
-- Read-only views for ordered listing (optional quality-of-life)
-- ------------------------------------------------------------------
create or replace view public.v_trusted_senders as
select *
from public.trusted_senders
order by last_confirmed_at desc;

create or replace view public.v_sender_behavior as
select *
from public.sender_behavior
order by last_seen desc;

-- ------------------------------------------------------------------
-- Optional RPC helper: increment counts server-side
-- ------------------------------------------------------------------
create or replace function public.increment_behavior_count(
  user_id uuid,
  sender_addr text,
  sender_domain text,
  verdict text
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.sender_behavior (
    id, user_id, sender, domain,
    total_interactions, phishing_interactions,
    safe_interactions, suspicious_interactions,
    first_seen, last_seen, updated_at
  )
  values (
    uuid_generate_v4(), user_id, sender_addr, sender_domain,
    1,
    case when verdict = 'phishing' then 1 else 0 end,
    case when verdict = 'safe' then 1 else 0 end,
    case when verdict = 'suspicious' then 1 else 0 end,
    now(), now(), now()
  )
  on conflict (user_id, sender) do update
    set total_interactions = public.sender_behavior.total_interactions + 1,
        phishing_interactions = public.sender_behavior.phishing_interactions + (case when verdict = 'phishing' then 1 else 0 end),
        safe_interactions = public.sender_behavior.safe_interactions + (case when verdict = 'safe' then 1 else 0 end),
        suspicious_interactions = public.sender_behavior.suspicious_interactions + (case when verdict = 'suspicious' then 1 else 0 end),
        last_seen = now(),
        updated_at = now();
end;
$$;

grant execute on function public.increment_behavior_count(uuid, text, text, text) to authenticated;
```

After running the script:

- Your UI/API can read `v_trusted_senders` and `v_sender_behavior` directly (already sorted).
- Client code may still perform local updates; the optional `increment_behavior_count` RPC lets you update behavior counts via `supabase.rpc('increment_behavior_count', { user_id, sender_addr, sender_domain, verdict: 'safe' })` when you prefer to keep logic server-side.

---

## 🧩 **How This Fits Your App**

| Action                        | Table / View        | Example                                                     |
| ----------------------------- | ------------------- | ----------------------------------------------------------- |
| Mark sender as trusted        | `trusted_senders`   | upsert `{ user_id, sender, domain, notes }`                 |
| Update trust across devices   | `trusted_senders`   | Supabase sync via RLS; views give ordered listings          |
| Record analysis behavior      | `sender_behavior`   | increment counts after each verdict (RPC or direct update)  |
| Adjust risk score dynamically | `sender_behavior`   | ML/heuristic engines read totals, last_seen, trusted status |
```
