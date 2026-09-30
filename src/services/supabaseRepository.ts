import type {
  ActivityEntry,
  Attachment,
  Comment,
  CreateTaskInput,
  CreateUserInput,
  Profile,
  Task,
  TaskPriority,
  TaskSource,
  TaskStatus,
  UpdateTaskInput,
  UpdateUserInput,
  Workspace,
  WorkspaceMember,
} from "../types";
import { validateAssigneeIds, validateTaskDates } from "../lib/taskRules";
import { ATTACHMENTS_BUCKET, supabase } from "./supabaseClient";
import type { AuthUser, TaskRepository } from "./repository";
import { validateAttachment } from "./repository";

/**
 * Implements TaskRepository against a Supabase project matching
 * supabase/migrations. Requires VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
 * Not exercised in this build (no Supabase project was provisioned) — see README.
 */
export class SupabaseRepository implements TaskRepository {
  readonly mode = "supabase" as const;

  private get client() {
    if (!supabase) throw new Error("Supabase não está configurado.");
    return supabase;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data } = await this.client.auth.getUser();
    if (!data.user) return null;
    const { data: profile } = await this.client
      .from("profiles")
      .select("name, is_admin")
      .eq("id", data.user.id)
      .single();
    return {
      id: data.user.id,
      email: data.user.email ?? "",
      name: profile?.name ?? data.user.email ?? "",
      isAdmin: profile?.is_admin ?? false,
    };
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: profile } = await this.client
      .from("profiles")
      .select("name, is_admin")
      .eq("id", data.user!.id)
      .single();
    return {
      id: data.user!.id,
      email: data.user!.email ?? "",
      name: profile?.name ?? email,
      isAdmin: profile?.is_admin ?? false,
    };
  }

  async signUp(email: string, password: string, name: string): Promise<AuthUser> {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
    if (data.user) {
      await this.client.from("profiles").upsert({ id: data.user.id, name });
      await this.client.rpc("ensure_initial_workspace", { p_user_id: data.user.id });
    }
    return { id: data.user?.id ?? "", email, name, isAdmin: false };
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }

  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    if (error) throw error;
  }

  async getMyWorkspaceId(): Promise<string> {
    const teams = await this.listMyTeams();
    return teams[0]?.id ?? "";
  }

  async listMyTeams(): Promise<Workspace[]> {
    const { data, error } = await this.client
      .from("workspace_members")
      .select("workspaces(id, name, created_by, created_at)");
    if (error) throw error;
    return (data ?? [])
      .map((row: any) => row.workspaces)
      .filter(Boolean)
      .map((w: any) => ({
        id: w.id,
        name: w.name,
        createdBy: w.created_by,
        createdAt: w.created_at,
      }));
  }

  async createTeam(name: string, actor: Profile): Promise<Workspace> {
    if (!name.trim()) throw new Error("O nome do time é obrigatório.");
    const { data, error } = await this.client
      .from("workspaces")
      .insert({ name: name.trim(), created_by: actor.id })
      .select()
      .single();
    if (error) throw error;
    const { error: memberError } = await this.client
      .from("workspace_members")
      .insert({ workspace_id: data.id, user_id: actor.id, role: "owner" });
    if (memberError) throw memberError;
    return { id: data.id, name: data.name, createdBy: data.created_by, createdAt: data.created_at };
  }

  async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const { data, error } = await this.client
      .from("workspace_members")
      .select("workspace_id, user_id, role, profiles(id, name, avatar_url, is_admin)")
      .eq("workspace_id", workspaceId);
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      workspaceId: row.workspace_id,
      userId: row.user_id,
      role: row.role,
      profile: {
        id: row.profiles.id,
        name: row.profiles.name,
        avatarUrl: row.profiles.avatar_url,
        isAdmin: row.profiles.is_admin,
      },
    }));
  }

  async addMemberByEmail(workspaceId: string, email: string): Promise<WorkspaceMember> {
    const { data, error } = await this.client.rpc("add_workspace_member_by_email", {
      p_workspace_id: workspaceId,
      p_email: email,
    });
    if (error) throw error;
    return data as WorkspaceMember;
  }

  async listAllProfiles(): Promise<Profile[]> {
    const { data, error } = await this.client
      .from("profiles")
      .select("id, name, avatar_url, is_admin, matricula, login, email, operations, active, permissions, created_at");
    if (error) {
      // Fallback gracioso se as colunas ainda não foram migradas no Supabase
      const fallback = await this.client.from("profiles").select("id, name, avatar_url, is_admin");
      if (fallback.error) throw fallback.error;
      return (fallback.data ?? []).map((row: any) => ({
        id: row.id,
        name: row.name,
        avatarUrl: row.avatar_url,
        isAdmin: row.is_admin,
        active: true,
        operations: ["TODAS"],
      }));
    }
    return (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      avatarUrl: row.avatar_url,
      isAdmin: row.is_admin,
      matricula: row.matricula,
      login: row.login,
      email: row.email,
      operations: row.operations ?? ["TODAS"],
      active: row.active ?? true,
      permissions: row.permissions,
      createdAt: row.created_at,
    }));
  }

  async setUserAdmin(userId: string, isAdmin: boolean): Promise<void> {
    const { error } = await this.client.rpc("set_user_admin", {
      p_user_id: userId,
      p_is_admin: isAdmin,
    });
    if (error) throw error;
  }

  async createUser(input: CreateUserInput): Promise<Profile> {
    const { data, error } = await this.client
      .from("profiles")
      .insert({
        name: input.name.trim(),
        matricula: input.matricula?.trim() || null,
        login: input.login?.trim() || null,
        email: input.email?.trim() || null,
        operations: input.operations,
        active: input.active,
        is_admin: input.isAdmin,
        permissions: input.permissions,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      avatarUrl: data.avatar_url,
      matricula: data.matricula,
      login: data.login,
      email: data.email,
      operations: data.operations,
      active: data.active,
      isAdmin: data.is_admin,
      permissions: data.permissions,
      createdAt: data.created_at,
    };
  }

  async updateUser(userId: string, input: UpdateUserInput): Promise<Profile> {
    const payload: Record<string, unknown> = {};
    if (input.name !== undefined) payload.name = input.name.trim();
    if (input.matricula !== undefined) payload.matricula = input.matricula.trim() || null;
    if (input.login !== undefined) payload.login = input.login.trim() || null;
    if (input.email !== undefined) payload.email = input.email.trim() || null;
    if (input.operations !== undefined) payload.operations = input.operations;
    if (input.active !== undefined) payload.active = input.active;
    if (input.isAdmin !== undefined) payload.is_admin = input.isAdmin;
    if (input.permissions !== undefined) payload.permissions = input.permissions;

    const { data, error } = await this.client
      .from("profiles")
      .update(payload)
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      avatarUrl: data.avatar_url,
      matricula: data.matricula,
      login: data.login,
      email: data.email,
      operations: data.operations,
      active: data.active,
      isAdmin: data.is_admin,
      permissions: data.permissions,
      createdAt: data.created_at,
    };
  }

  async deleteUser(userId: string): Promise<void> {
    const { error } = await this.client.from("profiles").delete().eq("id", userId);
    if (error) throw error;
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from("workspace_members")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);
    if (error) throw error;
  }

  async listTasks(workspaceId: string): Promise<Task[]> {
    const { data, error } = await this.client
      .from("tasks")
      .select("*, task_assignees(profiles(id, name, avatar_url))")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapTaskRow);
  }

  private async setTaskAssignees(taskId: string, assigneeIds: string[]): Promise<void> {
    const { error: deleteError } = await this.client
      .from("task_assignees")
      .delete()
      .eq("task_id", taskId);
    if (deleteError) throw deleteError;
    if (assigneeIds.length === 0) return;
    const { error: insertError } = await this.client
      .from("task_assignees")
      .insert(assigneeIds.map((userId) => ({ task_id: taskId, user_id: userId })));
    if (insertError) throw insertError;
  }

  async createTask(workspaceId: string, input: CreateTaskInput, actor: Profile): Promise<Task> {
    if (!input.title.trim()) throw new Error("O nome da tarefa é obrigatório.");
    const dateError = validateTaskDates({ startDate: null, dueDate: input.dueDate ?? null });
    if (dateError) throw new Error(dateError);
    const assigneeIds = input.assigneeIds ?? [];
    const assigneeError = validateAssigneeIds(assigneeIds);
    if (assigneeError) throw new Error(assigneeError);

    const { data, error } = await this.client
      .from("tasks")
      .insert({
        workspace_id: workspaceId,
        title: input.title.trim(),
        description: input.description ?? null,
        source: input.source ?? "manual",
        priority: input.priority ?? "media",
        status: input.status ?? "nao_iniciado",
        start_date: input.startDate ?? null,
        due_date: input.dueDate ?? null,
        created_by: actor.id,
      })
      .select()
      .single();
    if (error) throw error;
    if (assigneeIds.length > 0) {
      await this.setTaskAssignees(data.id, assigneeIds);
      return this.fetchTask(data.id);
    }
    return mapTaskRow({ ...data, task_assignees: [] });
  }

  private async fetchTask(taskId: string): Promise<Task> {
    const { data, error } = await this.client
      .from("tasks")
      .select("*, task_assignees(profiles(id, name, avatar_url))")
      .eq("id", taskId)
      .single();
    if (error) throw error;
    return mapTaskRow(data);
  }

  async updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
    const dateError = validateTaskDates({
      startDate: input.startDate,
      dueDate: input.dueDate,
      completedDate: input.completedDate,
    });
    if (dateError) throw new Error(dateError);
    if (input.title !== undefined && !input.title.trim()) {
      throw new Error("O nome da tarefa é obrigatório.");
    }
    if (input.assigneeIds !== undefined) {
      const assigneeError = validateAssigneeIds(input.assigneeIds);
      if (assigneeError) throw new Error(assigneeError);
    }

    const payload: Record<string, unknown> = {};
    if (input.title !== undefined) payload.title = input.title;
    if (input.description !== undefined) payload.description = input.description;
    if (input.source !== undefined) payload.source = input.source;
    if (input.priority !== undefined) payload.priority = input.priority;
    if (input.startDate !== undefined) payload.start_date = input.startDate;
    if (input.dueDate !== undefined) payload.due_date = input.dueDate;

    if (input.status !== undefined) {
      payload.status = input.status;
      payload.completed_date = input.status === "concluido"
        ? new Date().toISOString().slice(0, 10)
        : null;
    }

    if (input.assigneeIds !== undefined) {
      await this.setTaskAssignees(taskId, input.assigneeIds);
    }

    const { data, error } = await this.client
      .from("tasks")
      .update(payload)
      .eq("id", taskId)
      .select("*, task_assignees(profiles(id, name, avatar_url))")
      .single();
    if (error) throw error;
    return mapTaskRow(data);
  }

  async duplicateTask(taskId: string, actor: Profile): Promise<Task> {
    const { data: original, error: fetchError } = await this.client
      .from("tasks")
      .select("*, task_assignees(user_id)")
      .eq("id", taskId)
      .single();
    if (fetchError) throw fetchError;
    const { data, error } = await this.client
      .from("tasks")
      .insert({
        workspace_id: original.workspace_id,
        title: `${original.title} (cópia)`,
        description: original.description,
        source: original.source,
        priority: original.priority,
        status: "nao_iniciado",
        start_date: original.start_date,
        due_date: original.due_date,
        created_by: actor.id,
      })
      .select()
      .single();
    if (error) throw error;
    // Duplicar não copia anexos, comentários ou histórico — mas mantém os responsáveis.
    const originalAssigneeIds = (original.task_assignees ?? []).map((r: any) => r.user_id as string);
    if (originalAssigneeIds.length > 0) {
      await this.setTaskAssignees(data.id, originalAssigneeIds);
      return this.fetchTask(data.id);
    }
    return mapTaskRow({ ...data, task_assignees: [] });
  }

  async deleteTask(taskId: string): Promise<void> {
    const { error } = await this.client.from("tasks").delete().eq("id", taskId);
    if (error) throw error;
  }

  async listComments(taskId: string): Promise<Comment[]> {
    const { data, error } = await this.client
      .from("comments")
      .select("*, author:profiles(id, name, avatar_url)")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.id,
      taskId: row.task_id,
      authorId: row.author_id,
      author: row.author
        ? { id: row.author.id, name: row.author.name, avatarUrl: row.author.avatar_url }
        : undefined,
      body: row.body,
      createdAt: row.created_at,
    }));
  }

  async addComment(taskId: string, body: string, actor: Profile): Promise<Comment> {
    if (!body.trim()) throw new Error("O comentário não pode ficar vazio.");
    const { data, error } = await this.client
      .from("comments")
      .insert({ task_id: taskId, author_id: actor.id, body: body.trim() })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      taskId: data.task_id,
      authorId: data.author_id,
      author: actor,
      body: data.body,
      createdAt: data.created_at,
    };
  }

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await this.client.from("comments").delete().eq("id", commentId);
    if (error) throw error;
  }

  async listAttachments(taskId: string): Promise<Attachment[]> {
    const { data, error } = await this.client
      .from("attachments")
      .select("*, uploader:profiles(id, name, avatar_url)")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.id,
      taskId: row.task_id,
      uploadedBy: row.uploaded_by,
      uploader: row.uploader
        ? { id: row.uploader.id, name: row.uploader.name, avatarUrl: row.uploader.avatar_url }
        : undefined,
      fileName: row.file_name,
      storagePath: row.storage_path,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      createdAt: row.created_at,
    }));
  }

  async uploadAttachment(taskId: string, file: File, actor: Profile): Promise<Attachment> {
    const validationError = validateAttachment(file);
    if (validationError) throw new Error(validationError);

    const storagePath = `${taskId}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await this.client.storage
      .from(ATTACHMENTS_BUCKET)
      .upload(storagePath, file, { upsert: false });
    if (uploadError) throw uploadError;

    const { data, error } = await this.client
      .from("attachments")
      .insert({
        task_id: taskId,
        uploaded_by: actor.id,
        file_name: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        size_bytes: file.size,
      })
      .select()
      .single();
    if (error) {
      await this.client.storage.from(ATTACHMENTS_BUCKET).remove([storagePath]);
      throw error;
    }
    return {
      id: data.id,
      taskId: data.task_id,
      uploadedBy: data.uploaded_by,
      fileName: data.file_name,
      storagePath: data.storage_path,
      mimeType: data.mime_type,
      sizeBytes: data.size_bytes,
      createdAt: data.created_at,
    };
  }

  async deleteAttachment(attachmentId: string): Promise<void> {
    const { data: att, error: fetchError } = await this.client
      .from("attachments")
      .select("storage_path")
      .eq("id", attachmentId)
      .single();
    if (fetchError) throw fetchError;
    const { error } = await this.client.from("attachments").delete().eq("id", attachmentId);
    if (error) throw error;
    await this.client.storage.from(ATTACHMENTS_BUCKET).remove([att.storage_path]);
  }

  async getAttachmentUrl(attachment: Attachment): Promise<string> {
    const { data, error } = await this.client.storage
      .from(ATTACHMENTS_BUCKET)
      .createSignedUrl(attachment.storagePath, 60 * 5);
    if (error) throw error;
    return data.signedUrl;
  }

  async listActivity(taskId: string): Promise<ActivityEntry[]> {
    const { data, error } = await this.client
      .from("task_activity")
      .select("*, actor:profiles(id, name, avatar_url)")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.id,
      taskId: row.task_id,
      actorId: row.actor_id,
      actor: row.actor
        ? { id: row.actor.id, name: row.actor.name, avatarUrl: row.actor.avatar_url }
        : undefined,
      action: row.action,
      changes: row.changes,
      createdAt: row.created_at,
    }));
  }
}

function mapTaskRow(row: any): Task {
  const assignees: Profile[] = (row.task_assignees ?? [])
    .map((r: any) => r.profiles)
    .filter(Boolean)
    .map((p: any) => ({ id: p.id, name: p.name, avatarUrl: p.avatar_url }));
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    description: row.description,
    source: row.source as TaskSource,
    priority: row.priority as TaskPriority,
    status: row.status as TaskStatus,
    assigneeIds: assignees.map((p) => p.id),
    assignees,
    startDate: row.start_date,
    dueDate: row.due_date,
    completedDate: row.completed_date,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
