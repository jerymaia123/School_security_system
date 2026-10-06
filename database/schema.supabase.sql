-- Run this in Supabase: SQL Editor > New query > paste > Run
-- (Supabase uses PostgreSQL, so this replaces schema.sql)

create table if not exists users (
  id bigint generated always as identity primary key,
  username varchar(60) not null unique,
  password varchar(255) not null,
  role text not null check (role in ('student','faculty','guard')),
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamp not null default now()
);

create table if not exists students (
  id bigint generated always as identity primary key,
  user_id bigint unique references users(id) on delete set null,
  student_id varchar(40) not null unique,
  first_name varchar(80) not null,
  middle_name varchar(80),
  last_name varchar(80) not null,
  birth_date date,
  gender text check (gender in ('Male','Female')),
  grade_level varchar(40),
  section varchar(40),
  contact_number varchar(30),
  email varchar(120),
  address text,
  photo varchar(255),
  enrollment_status text not null default 'active' check (enrollment_status in ('active','inactive')),
  qr_token varchar(80) not null unique,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists announcements (
  id bigint generated always as identity primary key,
  title varchar(150) not null,
  content text not null,
  posted_by bigint references users(id) on delete set null,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create table if not exists gate_logs (
  id bigint generated always as identity primary key,
  student_id bigint not null references students(id) on delete cascade,
  guard_id bigint references users(id) on delete set null,
  action text not null check (action in ('entry','exit')),
  gate varchar(60) not null default 'Main Gate',
  status text not null check (status in ('allowed','denied')),
  scanned_at timestamp not null default now()
);
create index if not exists idx_gate_logs_scanned on gate_logs (scanned_at);

-- IMPORTANT: Supabase exposes public tables through a public REST API.
-- Turning on Row Level Security with NO policies blocks that API completely.
-- Your PHP backend connects directly as the database owner, so it still works.
alter table users         enable row level security;
alter table students      enable row level security;
alter table announcements enable row level security;
alter table gate_logs     enable row level security;
