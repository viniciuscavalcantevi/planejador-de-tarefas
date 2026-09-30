-- Migração para suporte a Cadastro Completo de Usuários e Permissões
alter table profiles
  add column if not exists matricula text,
  add column if not exists login text,
  add column if not exists email text,
  add column if not exists operations text[] default array['TODAS']::text[],
  add column if not exists active boolean not null default true,
  add column if not exists permissions jsonb default '{"canViewAllTasks": true, "canCreateTasks": true, "canEditTasks": true, "canDeleteTasks": false, "canCreateTeams": false, "canManageUsers": false}'::jsonb;

create index if not exists idx_profiles_matricula on profiles (matricula);
create index if not exists idx_profiles_login on profiles (login);
create index if not exists idx_profiles_email on profiles (email);
