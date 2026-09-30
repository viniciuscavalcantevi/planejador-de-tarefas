-- Bucket privado para anexos de tarefas. Os arquivos são acessados via URLs assinadas
-- e temporárias (createSignedUrl), nunca por URL pública.
insert into storage.buckets (id, name, public, file_size_limit)
values ('task-attachments', 'task-attachments', false, 10 * 1024 * 1024)
on conflict (id) do nothing;

-- Caminho de armazenamento esperado: "<task_id>/<uuid>-<nome-do-arquivo>".
-- A política usa o primeiro segmento do caminho para checar se o usuário é
-- membro do workspace dono da tarefa correspondente.
create policy "task_attachments_select_member" on storage.objects
  for select using (
    bucket_id = 'task-attachments'
    and exists (
      select 1 from tasks t
      where t.id::text = (storage.foldername(name))[1]
        and is_workspace_member(t.workspace_id)
    )
  );

create policy "task_attachments_insert_member" on storage.objects
  for insert with check (
    bucket_id = 'task-attachments'
    and exists (
      select 1 from tasks t
      where t.id::text = (storage.foldername(name))[1]
        and is_workspace_member(t.workspace_id)
    )
  );

create policy "task_attachments_delete_uploader_or_owner" on storage.objects
  for delete using (
    bucket_id = 'task-attachments'
    and exists (
      select 1 from attachments a
      join tasks t on t.id = a.task_id
      where a.storage_path = storage.objects.name
        and (a.uploaded_by = auth.uid() or is_workspace_owner(t.workspace_id))
    )
  );
