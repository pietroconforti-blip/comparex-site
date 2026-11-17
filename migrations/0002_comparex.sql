create table if not exists profiles (
  user_id text primary key,
  display_name text not null default '',
  university text not null default '',
  city text not null default 'vienna',
  monthly_budget integer not null default 600,
  share_consent boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists saved_packages (
  id text primary key,
  user_id text not null,
  name text not null,
  city text not null,
  budget integer not null,
  items text not null,
  created_at timestamptz not null default now()
);

create index if not exists saved_packages_user_idx on saved_packages (user_id, created_at desc);

create table if not exists favorites (
  user_id text not null,
  offer_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, offer_id)
);

create table if not exists service_status (
  user_id text not null,
  offer_id text not null,
  status text not null check (status in ('saved', 'handoff')),
  updated_at timestamptz not null default now(),
  primary key (user_id, offer_id)
);

create table if not exists account_notes (
  id text primary key,
  user_id text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists account_notes_user_idx on account_notes (user_id, created_at desc);
