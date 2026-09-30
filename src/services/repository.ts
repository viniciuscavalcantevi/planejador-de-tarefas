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

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

/**
 * Shared contract implemented by both the demo (localStorage) and Supabase
 * backends, so UI and business-logic code never branch on which mode is active.
 */
export interface TaskRepository {
  readonly mode: "demo" | "supabase";

  getCurrentUser(): Promise<AuthUser | null>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signUp(email: string, password: string, name: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;

  listMembers(workspaceId: string): Promise<WorkspaceMember[]>;
  addMemberByEmail(workspaceId: string, email: string): Promise<WorkspaceMember>;
  removeMember(workspaceId: string, userId: string): Promise<void>;
  getMyWorkspaceId(): Promise<string>;

  /** Times (workspaces) dos quais o usuário atual é membro. */
  listMyTeams(): Promise<Workspace[]>;
  /** Cria um novo time e torna o usuário atual seu responsável (owner). Requer actor.isAdmin. */
  createTeam(name: string, actor: Profile): Promise<Workspace>;

  /** Todos os perfis conhecidos pelo app — usado na tela de administradores e cadastro de usuários. */
  listAllProfiles(): Promise<Profile[]>;
  /** Concede ou revoga a permissão de Administrador. Requer que quem chama já seja admin. */
  setUserAdmin(userId: string, isAdmin: boolean, actor: Profile): Promise<void>;
  /** Cria um novo usuário no sistema com permissões e operações */
  createUser(input: CreateUserInput, actor: Profile): Promise<Profile>;
  /** Atualiza dados, operações e permissões de um usuário */
  updateUser(userId: string, input: UpdateUserInput, actor: Profile): Promise<Profile>;
  /** Exclui um usuário do sistema */
  deleteUser(userId: string, actor: Profile): Promise<void>;

  listTasks(workspaceId: string): Promise<Task[]>;
  createTask(workspaceId: string, input: CreateTaskInput, actor: Profile): Promise<Task>;
  updateTask(taskId: string, input: UpdateTaskInput, actor: Profile): Promise<Task>;
  duplicateTask(taskId: string, actor: Profile): Promise<Task>;
  deleteTask(taskId: string, actor: Profile): Promise<void>;

  listComments(taskId: string): Promise<Comment[]>;
  addComment(taskId: string, body: string, actor: Profile): Promise<Comment>;
  deleteComment(commentId: string, actor: Profile): Promise<void>;

  listAttachments(taskId: string): Promise<Attachment[]>;
  uploadAttachment(taskId: string, file: File, actor: Profile): Promise<Attachment>;
  deleteAttachment(attachmentId: string, actor: Profile): Promise<void>;
  getAttachmentUrl(attachment: Attachment): Promise<string>;

  listActivity(taskId: string): Promise<ActivityEntry[]>;
}

export const ALLOWED_ATTACHMENT_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export function validateAttachment(file: File): string | null {
  if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
    return "Tipo de arquivo não permitido. Use PDF, PNG, JPEG, DOCX ou XLSX.";
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return "Arquivo maior que 10 MB.";
  }
  return null;
}
