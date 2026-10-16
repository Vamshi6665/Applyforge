-- Optional: move ApplyForge history off the browser into Supabase (Postgres).
-- Today runs, approved examples, and outcomes live in localStorage on one device.
-- With these tables they persist across devices and can be analyzed (which role types get callbacks).

create table if not exists runs (
  id           bigint primary key,
  created_at   timestamptz not null default now(),
  role_title   text,
  company      text,
  archetype    text,
  jd           text not null,
  analysis     jsonb not null,
  resume       jsonb not null,
  outreach     jsonb,
  stretch      boolean not null default false,
  outcome      text check (outcome in ('Applied','Recruiter reply','Interview','Offer','Rejected'))
);

create table if not exists approved_examples (
  run_id       bigint primary key references runs(id) on delete cascade,
  approved_at  timestamptz not null default now(),
  archetype    text not null,
  resume       jsonb not null            -- the final version, including manual edits
);

create index if not exists runs_archetype_idx on runs (archetype);
create index if not exists examples_archetype_idx on approved_examples (archetype, approved_at desc);

-- Single-owner app: enable RLS and allow only the authenticated owner.
alter table runs enable row level security;
alter table approved_examples enable row level security;
create policy owner_all_runs on runs for all to authenticated using (true) with check (true);
create policy owner_all_examples on approved_examples for all to authenticated using (true) with check (true);

-- Which role types turn into conversations?
-- select archetype, count(*) filter (where outcome in ('Recruiter reply','Interview','Offer'))::float / count(*) as response_rate
-- from runs where outcome is not null group by archetype;
