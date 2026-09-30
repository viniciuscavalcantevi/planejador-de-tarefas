import type {
  ActivityEntry,
  Attachment,
  Comment,
  CreateTaskInput,
  CreateUserInput,
  Profile,
  Task,
  UpdateTaskInput,
  UpdateUserInput,
  Workspace,
  WorkspaceMember,
} from "../types";
import { applyStatusChange, validateAssigneeIds, validateTaskDates } from "../lib/taskRules";
import { uid } from "../lib/utils";
import {
  buildDemoActivity,
  buildDemoAttachments,
  buildDemoComments,
  buildDemoMembers,
  buildDemoTasks,
  buildDemoWorkspaces,
  DEMO_PROFILES,
  DEMO_USER_ID,
  DEMO_WORKSPACE_ID,
} from "./demoSeed";
import type { AuthUser, TaskRepository } from "./repository";
import { validateAttachment } from "./repository";

const STORAGE_KEY = "hapvida-planner-clean-v2";

interface DemoState {
  /** Fonte da verdade da identidade de cada pessoa (nome, email, isAdmin). */
  profiles: Profile[];
  workspaces: Workspace[];
  members: WorkspaceMember[];
  tasks: Task[];
  comments: Comment[];
  attachments: Attachment[];
  activity: ActivityEntry[];
}

function buildInitialState(): DemoState {
  const tasks = buildDemoTasks();
  return {
    profiles: DEMO_PROFILES.map((p) => ({ ...p })),
    workspaces: buildDemoWorkspaces(),
    members: buildDemoMembers(),
    tasks,
    comments: buildDemoComments(),
    attachments: buildDemoAttachments(),
    activity: buildDemoActivity(tasks),
  };
}

function load(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = buildInitialState();
      save(initial);
      return initial;
    }
    return JSON.parse(raw) as DemoState;
  } catch {
    const initial = buildInitialState();
    save(initial);
    return initial;
  }
}

function save(state: DemoState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage indisponível (modo privado ou cota excedida): estado permanece só em memória.
  }
}

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export class DemoRepository implements TaskRepository {
  readonly mode = "demo" as const;
  private state: DemoState = load();

  resetToSampleData(): void {
    this.state = buildInitialState();
    save(this.state);
  }

  private findProfile(userId: string): Profile | undefined {
    return this.state.profiles.find((p) => p.id === userId);
  }

  private upsertProfile(profile: Profile) {
    const idx = this.state.profiles.findIndex((p) => p.id === profile.id);
    if (idx === -1) this.state.profiles.push(profile);
    else this.state.profiles[idx] = profile;
    // Mantém as cópias embutidas em cada membro de time sincronizadas com o perfil global.
    this.state.members = this.state.members.map((m) =>
      m.userId === profile.id ? { ...m, profile } : m
    );
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const profile = this.findProfile(DEMO_USER_ID);
    return delay({
      id: DEMO_USER_ID,
      email: profile?.email ?? "voce@demo.local",
      name: profile?.name ?? "Você (Demonstração)",
      isAdmin: profile?.isAdmin ?? false,
    });
  }

  async listAllProfiles(): Promise<Profile[]> {
    return delay([...this.state.profiles]);
  }

  async setUserAdmin(userId: string, isAdmin: boolean, actor: Profile): Promise<void> {
    const actingProfile = this.findProfile(actor.id);
    if (!actingProfile?.isAdmin) {
      throw new Error("Apenas administradores podem conceder ou revogar essa permissão.");
    }
    if (userId === actor.id && !isAdmin) {
      throw new Error("Você não pode remover sua própria permissão de administrador.");
    }
    const target = this.findProfile(userId);
    if (!target) throw new Error("Usuário não encontrado.");
    this.upsertProfile({ ...target, isAdmin });
    save(this.state);
  }

  async createUser(input: CreateUserInput, actor: Profile): Promise<Profile> {
    const actingProfile = this.findProfile(actor.id);
    if (!actingProfile?.isAdmin) {
      throw new Error("Apenas administradores podem cadastrar usuários.");
    }
    if (!input.name.trim()) {
      throw new Error("O nome completo é obrigatório.");
    }

    const newProfile: Profile = {
      id: uid(),
      name: input.name.trim(),
      matricula: input.matricula?.trim() || undefined,
      login: input.login?.trim() || undefined,
      email: input.email?.trim() || undefined,
      operations: input.operations.length > 0 ? input.operations : ["TODAS"],
      active: input.active ?? true,
      isAdmin: input.isAdmin ?? false,
      permissions: input.permissions,
      createdAt: new Date().toISOString(),
    };

    this.state.profiles.push(newProfile);

    // Vincula o novo usuário ao workspace atual para que possa ser selecionado em tarefas
    const currentWorkspaceId = this.state.workspaces[0]?.id || DEMO_WORKSPACE_ID;
    this.state.members.push({
      workspaceId: currentWorkspaceId,
      userId: newProfile.id,
      role: newProfile.isAdmin ? "owner" : "member",
      profile: newProfile,
    });

    save(this.state);
    return delay(newProfile);
  }

  async updateUser(userId: string, input: UpdateUserInput, actor: Profile): Promise<Profile> {
    const actingProfile = this.findProfile(actor.id);
    if (!actingProfile?.isAdmin) {
      throw new Error("Apenas administradores podem editar usuários.");
    }
    const target = this.findProfile(userId);
    if (!target) throw new Error("Usuário não encontrado.");

    if (userId === actor.id && input.isAdmin === false) {
      throw new Error("Você não pode remover sua própria permissão de administrador.");
    }

    const updated: Profile = {
      ...target,
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.matricula !== undefined ? { matricula: input.matricula.trim() } : {}),
      ...(input.login !== undefined ? { login: input.login.trim() } : {}),
      ...(input.email !== undefined ? { email: input.email.trim() } : {}),
      ...(input.operations !== undefined ? { operations: input.operations } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(input.isAdmin !== undefined ? { isAdmin: input.isAdmin } : {}),
      ...(input.permissions !== undefined ? { permissions: input.permissions } : {}),
    };

    this.upsertProfile(updated);
    save(this.state);
    return delay(updated);
  }

  async deleteUser(userId: string, actor: Profile): Promise<void> {
    const actingProfile = this.findProfile(actor.id);
    if (!actingProfile?.isAdmin) {
      throw new Error("Apenas administradores podem excluir usuários.");
    }
    if (userId === actor.id) {
      throw new Error("Você não pode excluir sua própria conta.");
    }

    this.state.profiles = this.state.profiles.filter((p) => p.id !== userId);
    this.state.members = this.state.members.filter((m) => m.userId !== userId);
    this.state.tasks = this.state.tasks.map((t) => ({
      ...t,
      assigneeIds: t.assigneeIds.filter((id) => id !== userId),
    }));

    save(this.state);
    return delay(undefined);
  }
  async signIn(): Promise<AuthUser> {
    return this.getCurrentUser() as Promise<AuthUser>;
  }
  async signUp(): Promise<AuthUser> {
    return this.getCurrentUser() as Promise<AuthUser>;
  }
  async signOut(): Promise<void> {
    return delay(undefined);
  }
  async requestPasswordReset(): Promise<void> {
    return delay(undefined);
  }

  async getMyWorkspaceId(): Promise<string> {
    const teams = await this.listMyTeams();
    return teams[0]?.id ?? "";
  }

  async listMyTeams(): Promise<Workspace[]> {
    const myWorkspaceIds = new Set(
      this.state.members.filter((m) => m.userId === DEMO_USER_ID).map((m) => m.workspaceId)
    );
    return delay(this.state.workspaces.filter((w) => myWorkspaceIds.has(w.id)));
  }

  async createTeam(name: string, actor: Profile): Promise<Workspace> {
    const actingProfile = this.findProfile(actor.id);
    if (!actingProfile?.isAdmin) {
      throw new Error("Apenas administradores podem criar novos times.");
    }
    if (!name.trim()) throw new Error("O nome do time é obrigatório.");
    const workspace: Workspace = {
      id: uid(),
      name: name.trim(),
      createdBy: actor.id,
      createdAt: new Date().toISOString(),
    };
    this.state.workspaces.push(workspace);
    this.state.members.push({
      workspaceId: workspace.id,
      userId: actor.id,
      role: "owner",
      profile: actingProfile,
    });
    save(this.state);
    return delay(workspace);
  }

  async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return delay(this.state.members.filter((m) => m.workspaceId === workspaceId));
  }

  async addMemberByEmail(workspaceId: string, email: string): Promise<WorkspaceMember> {
    const existing = this.state.members.find(
      (m) => m.workspaceId === workspaceId && m.profile.email === email
    );
    if (existing) return delay(existing);
    const knownProfile = this.state.profiles.find((p) => p.email === email);
    const profile: Profile = knownProfile ?? { id: uid(), name: email.split("@")[0], email };
    if (!knownProfile) this.upsertProfile(profile);
    const member: WorkspaceMember = { workspaceId, userId: profile.id, role: "member", profile };
    this.state.members.push(member);
    save(this.state);
    return delay(member);
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    this.state.members = this.state.members.filter(
      (m) => !(m.workspaceId === workspaceId && m.userId === userId)
    );
    // Remove o membro removido de qualquer tarefa do time em que ele era responsável.
    this.state.tasks = this.state.tasks.map((t) =>
      t.workspaceId === workspaceId
        ? { ...t, assigneeIds: t.assigneeIds.filter((id) => id !== userId) }
        : t
    );
    save(this.state);
    return delay(undefined);
  }

  private membersOf(workspaceId: string): WorkspaceMember[] {
    return this.state.members.filter((m) => m.workspaceId === workspaceId);
  }

  private withAssignees(task: Task): Task {
    const members = this.membersOf(task.workspaceId);
    return {
      ...task,
      assignees: task.assigneeIds
        .map((id) => members.find((m) => m.userId === id)?.profile)
        .filter((p): p is Profile => !!p),
    };
  }

  async listTasks(workspaceId: string): Promise<Task[]> {
    return delay(
      this.state.tasks.filter((t) => t.workspaceId === workspaceId).map((t) => this.withAssignees(t))
    );
  }

  private recordActivity(
    taskId: string,
    actor: Profile,
    action: ActivityEntry["action"],
    changes: ActivityEntry["changes"] = null
  ) {
    this.state.activity.unshift({
      id: uid(),
      taskId,
      actorId: actor.id,
      actor,
      action,
      changes,
      createdAt: new Date().toISOString(),
    });
  }

  async createTask(workspaceId: string, input: CreateTaskInput, actor: Profile): Promise<Task> {
    if (!input.title.trim()) throw new Error("O nome da tarefa é obrigatório.");
    const dateError = validateTaskDates({ startDate: null, dueDate: input.dueDate ?? null });
    if (dateError) throw new Error(dateError);
    const assigneeIds = input.assigneeIds ?? [];
    const assigneeError = validateAssigneeIds(assigneeIds);
    if (assigneeError) throw new Error(assigneeError);
    const now = new Date().toISOString();
    const task: Task = {
      id: uid(),
      workspaceId,
      title: input.title.trim(),
      description: input.description ?? null,
      source: input.source ?? "manual",
      priority: input.priority ?? "media",
      status: input.status ?? "nao_iniciado",
      assigneeIds,
      startDate: input.startDate ?? null,
      dueDate: input.dueDate ?? null,
      completedDate: null,
      createdBy: actor.id,
      createdAt: now,
      updatedAt: now,
    };
    this.state.tasks.unshift(task);
    this.recordActivity(task.id, actor, "created");
    save(this.state);
    return delay(this.withAssignees(task));
  }

  async updateTask(taskId: string, input: UpdateTaskInput, actor: Profile): Promise<Task> {
    const idx = this.state.tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) throw new Error("Tarefa não encontrada.");
    const current = this.state.tasks[idx];

    if (input.assigneeIds !== undefined) {
      const assigneeError = validateAssigneeIds(input.assigneeIds);
      if (assigneeError) throw new Error(assigneeError);
    }

    let next: Task = { ...current, ...input, updatedAt: new Date().toISOString() };

    if (input.status && input.status !== current.status) {
      const applied = applyStatusChange(current, input.status);
      next = { ...next, ...applied };
      this.recordActivity(taskId, actor, "status_changed", {
        status: { from: current.status, to: applied.status },
      });
    }

    const dateError = validateTaskDates({
      startDate: next.startDate,
      dueDate: next.dueDate,
      completedDate: next.completedDate,
    });
    if (dateError) throw new Error(dateError);

    if (input.title !== undefined && !next.title.trim()) {
      throw new Error("O nome da tarefa é obrigatório.");
    }

    if (input.priority && input.priority !== current.priority) {
      this.recordActivity(taskId, actor, "priority_changed", {
        priority: { from: current.priority, to: input.priority },
      });
    }

    this.state.tasks[idx] = next;
    save(this.state);
    return delay(this.withAssignees(next));
  }

  async duplicateTask(taskId: string, actor: Profile): Promise<Task> {
    const original = this.state.tasks.find((t) => t.id === taskId);
    if (!original) throw new Error("Tarefa não encontrada.");
    const now = new Date().toISOString();
    const copy: Task = {
      ...original,
      id: uid(),
      title: `${original.title} (cópia)`,
      status: "nao_iniciado",
      completedDate: null,
      createdBy: actor.id,
      createdAt: now,
      updatedAt: now,
    };
    this.state.tasks.unshift(copy);
    this.recordActivity(copy.id, actor, "created");
    save(this.state);
    return delay(this.withAssignees(copy));
  }

  async deleteTask(taskId: string): Promise<void> {
    this.state.tasks = this.state.tasks.filter((t) => t.id !== taskId);
    this.state.comments = this.state.comments.filter((c) => c.taskId !== taskId);
    this.state.attachments = this.state.attachments.filter((a) => a.taskId !== taskId);
    this.state.activity = this.state.activity.filter((a) => a.taskId !== taskId);
    save(this.state);
    return delay(undefined);
  }

  async listComments(taskId: string): Promise<Comment[]> {
    const members = this.state.members;
    return delay(
      this.state.comments
        .filter((c) => c.taskId === taskId)
        .map((c) => ({ ...c, author: members.find((m) => m.userId === c.authorId)?.profile }))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    );
  }

  async addComment(taskId: string, body: string, actor: Profile): Promise<Comment> {
    if (!body.trim()) throw new Error("O comentário não pode ficar vazio.");
    const comment: Comment = {
      id: uid(),
      taskId,
      authorId: actor.id,
      author: actor,
      body: body.trim(),
      createdAt: new Date().toISOString(),
    };
    this.state.comments.push(comment);
    this.recordActivity(taskId, actor, "comment_added");
    save(this.state);
    return delay(comment);
  }

  async deleteComment(commentId: string): Promise<void> {
    this.state.comments = this.state.comments.filter((c) => c.id !== commentId);
    save(this.state);
    return delay(undefined);
  }

  async listAttachments(taskId: string): Promise<Attachment[]> {
    return delay(this.state.attachments.filter((a) => a.taskId === taskId));
  }

  async uploadAttachment(taskId: string, file: File, actor: Profile): Promise<Attachment> {
    const error = validateAttachment(file);
    if (error) throw new Error(error);
    const localUrl = URL.createObjectURL(file);
    const attachment: Attachment = {
      id: uid(),
      taskId,
      uploadedBy: actor.id,
      uploader: actor,
      fileName: file.name,
      storagePath: "",
      mimeType: file.type,
      sizeBytes: file.size,
      createdAt: new Date().toISOString(),
      isLocalDemo: true,
      localUrl,
    };
    this.state.attachments.push(attachment);
    this.recordActivity(taskId, actor, "attachment_added", {
      fileName: { from: null, to: file.name },
    });
    save(this.state);
    return delay(attachment);
  }

  async deleteAttachment(attachmentId: string, actor: Profile): Promise<void> {
    const att = this.state.attachments.find((a) => a.id === attachmentId);
    this.state.attachments = this.state.attachments.filter((a) => a.id !== attachmentId);
    if (att) this.recordActivity(att.taskId, actor, "attachment_removed", {
      fileName: { from: att.fileName, to: null },
    });
    save(this.state);
    return delay(undefined);
  }

  async getAttachmentUrl(attachment: Attachment): Promise<string> {
    return delay(attachment.localUrl ?? "");
  }

  async listActivity(taskId: string): Promise<ActivityEntry[]> {
    const members = this.state.members;
    return delay(
      this.state.activity
        .filter((a) => a.taskId === taskId)
        .map((a) => ({ ...a, actor: members.find((m) => m.userId === a.actorId)?.profile }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    );
  }
}
