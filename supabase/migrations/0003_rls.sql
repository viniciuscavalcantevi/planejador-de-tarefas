-- Row Level Security: isolamento entre workspaces e permissões por papel.

alter table profiles enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table tasks enable row level security;
alter table task_assignees enable row level security;
alter table comments enable row level security;
alter table attachments enable row level security;
alter table task_activity enable row level security;

-- Função auxiliar: o usuário atual pertence ao workspace informado?
create or replace function is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = p_workspace_id and user_id = auth.uid()
  );
$$;

create or replace function is_workspace_owner(p_workspace_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = p_workspace_id and user_id = auth.uid() and role = 'owner'
  );
$$;

-- profiles: qualquer usuário autenticado pode ler perfis de membros dos seus workspaces;
-- cada usuário só edita o próprio perfil.
create policy "profiles_select_same_workspace" on profiles
  for select using (
    id = auth.uid()
    or exists (
      select 1 from workspace_members wm1
      join workspace_members wm2 on wm1.workspace_id = wm2.workspace_id
      where wm1.user_id = auth.uid() and wm2.user_id = profiles.id
    )
  );

create policy "profiles_update_self" on profiles
  for update using (id = auth.uid());

-- A policy acima permite atualizar a própria linha, mas ninguém deve poder se
-- autopromover a administrador por um update direto. A coluna is_admin só muda
-- através da função set_user_admin (security definer, ver 0002_functions.sql),
-- que roda como dono da tabela e ignora este revoke.
revoke update (is_admin) on profiles from authenticated;

create policy "profiles_insert_self" on profiles
  for insert with check (id = auth.uid());

-- workspaces: visíveis apenas para membros.
create policy "workspaces_select_member" on workspaces
  for select using (is_workspace_member(id));

-- Só administradores (profiles.is_admin) podem criar novos times. O workspace inicial
-- criado no primeiro acesso (ensure_initial_workspace, ver 0002_functions.sql) é
-- security definer e não passa por esta policy.
create policy "workspaces_insert_admin" on workspaces
  for insert with check (
    created_by = auth.uid()
    and exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- workspace_members: visível para membros do mesmo workspace; só o owner gerencia.
create policy "workspace_members_select" on workspace_members
  for select using (is_workspace_member(workspace_id));

create policy "workspace_members_delete_owner" on workspace_members
  for delete using (is_workspace_owner(workspace_id));

-- tasks: membros do workspace podem ver, criar e editar; exclusão é do proprietário ou criador.
create policy "tasks_select_member" on tasks
  for select using (is_workspace_member(workspace_id));

create policy "tasks_insert_member" on tasks
  for insert with check (is_workspace_member(workspace_id) and created_by = auth.uid());

create policy "tasks_update_member" on tasks
  for update using (is_workspace_member(workspace_id));

create policy "tasks_delete_owner_or_creator" on tasks
  for delete using (created_by = auth.uid() or is_workspace_owner(workspace_id));

-- task_assignees: membros do workspace da tarefa podem ver e atribuir responsáveis
-- (o limite de 3 e a checagem de pertencimento ao workspace ficam no trigger da tabela).
create policy "task_assignees_select_member" on task_assignees
  for select using (
    exists (select 1 from tasks t where t.id = task_assignees.task_id and is_workspace_member(t.workspace_id))
  );

create policy "task_assignees_insert_member" on task_assignees
  for insert with check (
    exists (select 1 from tasks t where t.id = task_assignees.task_id and is_workspace_member(t.workspace_id))
  );

create policy "task_assignees_delete_member" on task_assignees
  for delete using (
    exists (select 1 from tasks t where t.id = task_assignees.task_id and is_workspace_member(t.workspace_id))
  );

-- comments: membros do workspace da tarefa podem ver e comentar; exclusão é do autor ou do owner.
create policy "comments_select_member" on comments
  for select using (
    exists (select 1 from tasks t where t.id = comments.task_id and is_workspace_member(t.workspace_id))
  );

create policy "comments_insert_member" on comments
  for insert with check (
    author_id = auth.uid()
    and exists (select 1 from tasks t where t.id = comments.task_id and is_workspace_member(t.workspace_id))
  );

create policy "comments_delete_author_or_owner" on comments
  for delete using (
    author_id = auth.uid()
    or exists (select 1 from tasks t where t.id = comments.task_id and is_workspace_owner(t.workspace_id))
  );

-- attachments: mesma regra de comments, com exclusão pelo autor do upload ou owner.
create policy "attachments_select_member" on attachments
  for select using (
    exists (select 1 from tasks t where t.id = attachments.task_id and is_workspace_member(t.workspace_id))
  );

create policy "attachments_insert_member" on attachments
  for insert with check (
    uploaded_by = auth.uid()
    and exists (select 1 from tasks t where t.id = attachments.task_id and is_workspace_member(t.workspace_id))
  );

create policy "attachments_delete_uploader_or_owner" on attachments
  for delete using (
    uploaded_by = auth.uid()
    or exists (select 1 from tasks t where t.id = attachments.task_id and is_workspace_owner(t.workspace_id))
  );

-- task_activity: somente leitura para membros; toda escrita acontece via triggers (security definer).
create policy "task_activity_select_member" on task_activity
  for select using (
    exists (select 1 from tasks t where t.id = task_activity.task_id and is_workspace_member(t.workspace_id))
  );
