-- Funções de suporte: workspace inicial, convite de membros e histórico automático.

create or replace function ensure_initial_workspace(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
  v_name text;
begin
  select workspace_id into v_workspace_id
  from workspace_members
  where user_id = p_user_id
  limit 1;

  if v_workspace_id is not null then
    return v_workspace_id;
  end if;

  select coalesce(name, 'Meu workspace') into v_name from profiles where id = p_user_id;

  insert into workspaces (name, created_by)
  values (coalesce(v_name, 'Meu workspace') || ' · Workspace', p_user_id)
  returning id into v_workspace_id;

  insert into workspace_members (workspace_id, user_id, role)
  values (v_workspace_id, p_user_id, 'owner');

  return v_workspace_id;
end;
$$;

revoke all on function ensure_initial_workspace(uuid) from public;
grant execute on function ensure_initial_workspace(uuid) to authenticated;

-- Concede ou revoga a permissão de Administrador (que controla quem pode criar times).
-- Só quem já é administrador pode chamar esta função, e ninguém pode remover a própria
-- permissão (evita que o sistema fique sem nenhum administrador por engano).
create or replace function set_user_admin(p_user_id uuid, p_is_admin boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
begin
  if not exists (select 1 from profiles where id = v_caller and is_admin = true) then
    raise exception 'Apenas administradores podem conceder ou revogar essa permissão.';
  end if;

  if p_user_id = v_caller and p_is_admin = false then
    raise exception 'Você não pode remover sua própria permissão de administrador.';
  end if;

  update profiles set is_admin = p_is_admin where id = p_user_id;
end;
$$;

revoke all on function set_user_admin(uuid, boolean) from public;
grant execute on function set_user_admin(uuid, boolean) to authenticated;

-- Adiciona um usuário já cadastrado a um workspace pelo email exato.
-- Só o proprietário do workspace pode chamar esta função; não expõe lista pública de emails.
create or replace function add_workspace_member_by_email(p_workspace_id uuid, p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_target_user_id uuid;
  v_target_name text;
begin
  if not exists (
    select 1 from workspace_members
    where workspace_id = p_workspace_id and user_id = v_caller and role = 'owner'
  ) then
    raise exception 'Apenas o proprietário pode adicionar membros a este workspace.';
  end if;

  select u.id, p.name into v_target_user_id, v_target_name
  from auth.users u
  join profiles p on p.id = u.id
  where lower(u.email) = lower(p_email)
  limit 1;

  if v_target_user_id is null then
    raise exception 'Nenhum usuário cadastrado com este email.';
  end if;

  insert into workspace_members (workspace_id, user_id, role)
  values (p_workspace_id, v_target_user_id, 'member')
  on conflict (workspace_id, user_id) do nothing;

  return jsonb_build_object(
    'workspaceId', p_workspace_id,
    'userId', v_target_user_id,
    'role', 'member',
    'profile', jsonb_build_object('id', v_target_user_id, 'name', v_target_name)
  );
end;
$$;

revoke all on function add_workspace_member_by_email(uuid, text) from public;
grant execute on function add_workspace_member_by_email(uuid, text) to authenticated;

-- Histórico gerado automaticamente pelo banco; a interface nunca escreve em task_activity diretamente.
create or replace function log_task_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into task_activity (task_id, actor_id, action, changes)
  values (new.id, coalesce(auth.uid(), new.created_by), 'created', null);
  return new;
end;
$$;

drop trigger if exists trg_log_task_created on tasks;
create trigger trg_log_task_created
  after insert on tasks
  for each row execute function log_task_created();

create or replace function log_task_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := coalesce(auth.uid(), new.created_by);
begin
  if new.status is distinct from old.status then
    insert into task_activity (task_id, actor_id, action, changes)
    values (new.id, v_actor, 'status_changed',
      jsonb_build_object('status', jsonb_build_object('from', old.status, 'to', new.status)));
  end if;

  if new.priority is distinct from old.priority then
    insert into task_activity (task_id, actor_id, action, changes)
    values (new.id, v_actor, 'priority_changed',
      jsonb_build_object('priority', jsonb_build_object('from', old.priority, 'to', new.priority)));
  end if;

  return new;
end;
$$;

drop trigger if exists trg_log_task_updated on tasks;
create trigger trg_log_task_updated
  after update on tasks
  for each row execute function log_task_updated();

create or replace function log_comment_added()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into task_activity (task_id, actor_id, action, changes)
  values (new.task_id, coalesce(auth.uid(), new.author_id), 'comment_added', null);
  return new;
end;
$$;

drop trigger if exists trg_log_comment_added on comments;
create trigger trg_log_comment_added
  after insert on comments
  for each row execute function log_comment_added();

create or replace function log_attachment_added()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into task_activity (task_id, actor_id, action, changes)
  values (new.task_id, coalesce(auth.uid(), new.uploaded_by), 'attachment_added',
    jsonb_build_object('fileName', jsonb_build_object('from', null, 'to', new.file_name)));
  return new;
end;
$$;

drop trigger if exists trg_log_attachment_added on attachments;
create trigger trg_log_attachment_added
  after insert on attachments
  for each row execute function log_attachment_added();

create or replace function log_attachment_removed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into task_activity (task_id, actor_id, action, changes)
  values (old.task_id, coalesce(auth.uid(), old.uploaded_by), 'attachment_removed',
    jsonb_build_object('fileName', jsonb_build_object('from', old.file_name, 'to', null)));
  return old;
end;
$$;

drop trigger if exists trg_log_attachment_removed on attachments;
create trigger trg_log_attachment_removed
  after delete on attachments
  for each row execute function log_attachment_removed();
