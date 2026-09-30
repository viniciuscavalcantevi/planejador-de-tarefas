import { MAX_TASK_ASSIGNEES, type Task, type TaskFilterState, type TaskPriority, type TaskStatus } from "../types";

export function validateAssigneeIds(assigneeIds: string[]): string | null {
  if (assigneeIds.length > MAX_TASK_ASSIGNEES) {
    return `É possível adicionar no máximo ${MAX_TASK_ASSIGNEES} responsáveis por tarefa.`;
  }
  if (new Set(assigneeIds).size !== assigneeIds.length) {
    return "Cada responsável só pode ser adicionado uma vez.";
  }
  return null;
}

/** Calendar-only date string (no time), avoids timezone shift bugs. */
export function todayDateOnly(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Parses a YYYY-MM-DD string as a local calendar date (midnight local), never UTC. */
export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateBR(value: string | null | undefined): string {
  if (!value) return "Sem prazo";
  const d = parseDateOnly(value);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function dateLabel(value: string | null | undefined, status: TaskStatus): string {
  if (!value) return "Sem prazo";
  if (status === "concluido") return formatDateBR(value);
  const today = todayDateOnly();
  const tomorrow = addDaysToDateOnly(today, 1);
  if (value === today) return "Hoje";
  if (value === tomorrow) return "Amanhã";
  if (isOverdue(value, status)) return `${formatDateBR(value)} · Atrasada`;
  return formatDateBR(value);
}

export function addDaysToDateOnly(value: string, days: number): string {
  const d = parseDateOnly(value);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isOverdue(dueDate: string | null | undefined, status: TaskStatus): boolean {
  if (!dueDate) return false;
  if (status === "concluido") return false;
  return dueDate < todayDateOnly();
}

/** Enforces the single source of truth: status <-> completion checkbox <-> completedDate. */
export function applyStatusChange(
  task: Pick<Task, "status" | "completedDate">,
  nextStatus: TaskStatus
): { status: TaskStatus; completedDate: string | null } {
  if (nextStatus === "concluido") {
    return { status: "concluido", completedDate: task.completedDate ?? todayDateOnly() };
  }
  return { status: nextStatus, completedDate: null };
}

export function applyCheckboxChange(
  task: Pick<Task, "status" | "completedDate">,
  checked: boolean
): { status: TaskStatus; completedDate: string | null } {
  return applyStatusChange(task, checked ? "concluido" : "nao_iniciado");
}

export function isImportant(priority: TaskPriority): boolean {
  return priority === "alta" || priority === "urgente";
}

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgente: 0,
  alta: 1,
  media: 2,
  baixa: 3,
};

export function filterTasks(
  tasks: Task[],
  filters: TaskFilterState,
  currentUserId: string
): Task[] {
  let result = tasks;

  switch (filters.view) {
    case "minhas":
      result = result.filter((t) => t.assigneeIds.includes(currentUserId));
      break;
    case "importantes":
      result = result.filter((t) => isImportant(t.priority));
      break;
    case "planejadas":
      result = result.filter((t) => !!t.dueDate);
      break;
    case "concluidas":
      result = result.filter((t) => t.status === "concluido");
      break;
    default:
      break;
  }

  if (!filters.showCompleted && filters.view !== "concluidas") {
    result = result.filter((t) => t.status !== "concluido");
  }

  if (filters.status.length > 0) {
    result = result.filter((t) => filters.status.includes(t.status));
  }
  if (filters.priority.length > 0) {
    result = result.filter((t) => filters.priority.includes(t.priority));
  }
  if (filters.assigneeId && filters.assigneeId.length > 0) {
    result = result.filter((t) => t.assigneeIds.some((id) => filters.assigneeId!.includes(id)));
  }

  const q = filters.search.trim().toLowerCase();
  if (q) {
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q)
    );
  }

  const dir = filters.sortDir === "asc" ? 1 : -1;
  result = [...result].sort((a, b) => {
    switch (filters.sortBy) {
      case "nome":
        return a.title.localeCompare(b.title, "pt-BR") * dir;
      case "vencimento": {
        const av = a.dueDate ?? "9999-99-99";
        const bv = b.dueDate ?? "9999-99-99";
        return av.localeCompare(bv) * dir;
      }
      case "prioridade":
        return (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) * dir;
      case "criacao":
      default:
        return a.createdAt.localeCompare(b.createdAt) * dir;
    }
  });

  return result;
}

export function validateTaskDates(input: {
  startDate?: string | null;
  dueDate?: string | null;
  completedDate?: string | null;
}): string | null {
  const { startDate, dueDate, completedDate } = input;
  if (startDate && dueDate && dueDate < startDate) {
    return "A data prevista não pode ser anterior à data de início.";
  }
  if (startDate && completedDate && completedDate < startDate) {
    return "A data fim não pode ser anterior à data de início.";
  }
  return null;
}
