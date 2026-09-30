export type TaskStatus = "nao_iniciado" | "em_andamento" | "concluido";
export type TaskPriority = "baixa" | "media" | "alta" | "urgente";
export type TaskSource = "email" | "manual" | "equipe";

export type UserOperation = "TODAS" | "SAUDE" | "PME" | "COBRANCA" | "ODONTO";

export interface UserPermissions {
  /** Se pode ver todas as tarefas ou somente as atribuídas a ele */
  canViewAllTasks: boolean;
  canCreateTasks: boolean;
  canEditTasks: boolean;
  canDeleteTasks: boolean;
  canCreateTeams: boolean;
  canManageUsers: boolean;
}

export const DEFAULT_USER_PERMISSIONS: UserPermissions = {
  canViewAllTasks: true,
  canCreateTasks: true,
  canEditTasks: true,
  canDeleteTasks: false,
  canCreateTeams: false,
  canManageUsers: false,
};

export const ADMIN_USER_PERMISSIONS: UserPermissions = {
  canViewAllTasks: true,
  canCreateTasks: true,
  canEditTasks: true,
  canDeleteTasks: true,
  canCreateTeams: true,
  canManageUsers: true,
};

export interface Profile {
  id: string;
  name: string;
  matricula?: string;
  login?: string;
  avatarUrl?: string | null;
  email?: string;
  operations?: string[];
  active?: boolean;
  permissions?: UserPermissions;
  /** Administrador do sistema: só quem tem essa marcação pode criar novos times e gerenciar usuários. */
  isAdmin?: boolean;
  createdAt?: string;
}

export interface CreateUserInput {
  name: string;
  matricula?: string;
  login?: string;
  email?: string;
  operations: string[];
  active: boolean;
  isAdmin: boolean;
  permissions: UserPermissions;
}

export type UpdateUserInput = Partial<CreateUserInput>;

export interface Workspace {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export type WorkspaceRole = "owner" | "member";

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  profile: Profile;
}

export const MAX_TASK_ASSIGNEES = 3;

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export const PRESET_TAGS = [
  { id: "urgencia", name: "Urgência", color: "bg-red-50 text-red-700 border-red-200" },
  { id: "saude", name: "Saúde", color: "bg-blue-50 text-[#0066CC] border-blue-200" },
  { id: "odonto", name: "Odonto", color: "bg-teal-50 text-teal-700 border-teal-200" },
  { id: "financeiro", name: "Financeiro", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "regulatorio", name: "Regulatório", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "ti", name: "Tecnologia", color: "bg-amber-50 text-amber-700 border-amber-200" },
];

export interface Task {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  source: TaskSource;
  priority: TaskPriority;
  status: TaskStatus;
  /** Até MAX_TASK_ASSIGNEES responsáveis por tarefa. */
  assigneeIds: string[];
  assignees?: Profile[];
  startDate: string | null;
  dueDate: string | null;
  completedDate: string | null;
  checklist?: ChecklistItem[];
  tags?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  author?: Profile;
  body: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  uploadedBy: string;
  uploader?: Profile;
  fileName: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  isLocalDemo?: boolean;
  localUrl?: string;
}

export type ActivityAction =
  | "created"
  | "status_changed"
  | "priority_changed"
  | "field_changed"
  | "attachment_added"
  | "attachment_removed"
  | "comment_added";

export interface ActivityEntry {
  id: string;
  taskId: string;
  actorId: string;
  actor?: Profile;
  action: ActivityAction;
  changes: Record<string, { from: unknown; to: unknown }> | null;
  createdAt: string;
}

export interface TaskFilterState {
  view: "todas" | "minhas" | "importantes" | "planejadas" | "concluidas";
  search: string;
  status: TaskStatus[];
  priority: TaskPriority[];
  assigneeId: string[] | null;
  showCompleted: boolean;
  sortBy: "nome" | "vencimento" | "prioridade" | "criacao";
  sortDir: "asc" | "desc";
}

export const DEFAULT_FILTERS: TaskFilterState = {
  view: "todas",
  search: "",
  status: [],
  priority: [],
  assigneeId: null,
  showCompleted: true,
  sortBy: "criacao",
  sortDir: "desc",
};

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  source?: TaskSource;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigneeIds?: string[];
  startDate?: string | null;
  dueDate?: string | null;
  checklist?: ChecklistItem[];
  tags?: string[];
}

export type UpdateTaskInput = Partial<
  Pick<
    Task,
    | "title"
    | "description"
    | "source"
    | "priority"
    | "status"
    | "assigneeIds"
    | "startDate"
    | "dueDate"
    | "completedDate"
    | "checklist"
    | "tags"
  >
>;
