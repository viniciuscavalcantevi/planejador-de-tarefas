-- Planejador de Tarefas: esquema base
-- Requer a extensão pgcrypto (para gen_random_uuid), já habilitada por padrão em projetos Supabase.

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  avatar_url text,
  -- Administrador do sistema: só quem tem essa marcação pode criar novos times
  -- (ver policy workspaces_insert_admin em 0003_rls.sql). O primeiro administrador
  -- de um projeto novo precisa ser marcado manualmente via SQL Editor:
  --   update profiles set is_admin = true where id = '<uuid-do-usuário>';
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);

create type workspace_role as enum ('owner', 'member');

create table if not exists workspace_members (
  workspace_id uuid not null references workspaces (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index if not exists idx_workspace_members_user on workspace_members (user_id);

create type task_status as enum ('nao_iniciado', 'em_andamento', 'concluido');
create type task_priority as enum ('baixa', 'media', 'alta', 'urgente');
create type task_source as enum ('email', 'manual', 'equipe');

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  title text not null check (char_length(btrim(title)) > 0),
  description text,
  source task_source not null default 'manual',
  priority task_priority not null default 'media',
  status task_status not null default 'nao_iniciado',
  start_date date,
  due_date date,
  completed_date date,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint due_after_start check (start_date is null or due_date is null or due_date >= start_date),
  constraint completed_after_start check (start_date is null or completed_date is null or completed_date >= start_date),
  constraint completed_requires_status check (
    (status = 'concluido' and completed_date is not null) or
    (status <> 'concluido' and completed_date is null)
  )
);

create index if not exists idx_tasks_workspace on tasks (workspace_id);
create index if not exists idx_tasks_status on tasks (workspace_id, status);
create index if not exists idx_tasks_due_date on tasks (workspace_id, due_date);

-- Até 3 responsáveis por tarefa (ver trigger enforce_task_assignee_limits abaixo).
create table if not exists task_assignees (
  task_id uuid not null references tasks (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, user_id)
);

create index if not exists idx_task_assignees_user on task_assignees (user_id);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  author_id uuid not null references profiles (id),
  body text not null check (char_length(btrim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_comments_task on comments (task_id, created_at);

create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  uploaded_by uuid not null references profiles (id),
  file_name text not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10 * 1024 * 1024),
  created_at timestamptz not null default now()
);

create index if not exists idx_attachments_task on attachments (task_id, created_at);

create type task_activity_action as enum (
  'created',
  'status_changed',
  'priority_changed',
  'field_changed',
  'attachment_added',
  'attachment_removed',
  'comment_added'
);

create table if not exists task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  actor_id uuid not null references profiles (id),
  action task_activity_action not null,
  changes jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_task_activity_task on task_activity (task_id, created_at desc);

-- Cada responsável de uma tarefa precisa pertencer ao mesmo workspace da tarefa,
-- e uma tarefa pode ter no máximo 3 responsáveis.
create or replace function enforce_task_assignee_limits()
returns trigger
language plpgsql
as $$
declare
  v_workspace_id uuid;
  v_count int;
begin
  select workspace_id into v_workspace_id from tasks where id = new.task_id;

  if not exists (
    select 1 from workspace_members
    where workspace_id = v_workspace_id and user_id = new.user_id
  ) then
    raise exception 'O responsável precisa ser membro do workspace da tarefa.';
  end if;

  select count(*) into v_count from task_assignees where task_id = new.task_id;
  if v_count >= 3 then
    raise exception 'Uma tarefa pode ter no máximo 3 responsáveis.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_task_assignee_limits on task_assignees;
create trigger trg_enforce_task_assignee_limits
  before insert on task_assignees
  for each row execute function enforce_task_assignee_limits();

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tasks_updated_at on tasks;
create trigger trg_tasks_updated_at
  before update on tasks
  for each row execute function set_updated_at();
