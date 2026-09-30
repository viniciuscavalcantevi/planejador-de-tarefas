import { ClipboardList, Plus, SearchX } from "lucide-react";
import type { CreateTaskInput, Task, WorkspaceMember } from "../types";
import { cn, initials } from "../lib/utils";
import { CompletionCheckbox } from "./CompletionCheckbox";
import { PRIORITY_DOT_CLASS, PRIORITY_LABELS, STATUS_LABELS } from "../lib/taskLabels";
import { dateLabel, isOverdue } from "../lib/taskRules";
import { EmptyState } from "./EmptyState";
import { TaskQuickAdd } from "./TaskQuickAdd";

interface TaskCardListProps {
  tasks: Task[];
  members: WorkspaceMember[];
  hasAnyTasks: boolean;
  onOpen: (taskId: string) => void;
  onToggleComplete: (task: Task, checked: boolean) => void;
  onCreate: (input: CreateTaskInput) => Promise<unknown>;
  onClearFilters: () => void;
}

export function TaskCardList({
  tasks,
  members,
  hasAnyTasks,
  onOpen,
  onToggleComplete,
  onCreate,
  onClearFilters,
}: TaskCardListProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden md:hidden">
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="flex flex-col gap-2">
          {tasks.map((task) => {
            const done = task.status === "concluido";
            const assignees = task.assigneeIds
              .map((id) => members.find((m) => m.userId === id)?.profile)
              .filter((p): p is NonNullable<typeof p> => !!p);
            const overdue = isOverdue(task.dueDate, task.status);
            return (
              <li key={task.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpen(task.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOpen(task.id);
                    }
                  }}
                  className="flex w-full cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-3 text-left"
                >
                  <CompletionCheckbox
                    checked={done}
                    onChange={(checked) => onToggleComplete(task, checked)}
                    label={task.title}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm font-medium", done ? "text-text-subtle line-through" : "text-text")}>
                      {task.title}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                      <span className={cn("flex items-center gap-1", overdue && "text-danger-500")}>
                        {dateLabel(task.dueDate, task.status)}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_DOT_CLASS[task.priority])} />
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                      <span>{STATUS_LABELS[task.status]}</span>
                    </div>
                  </div>
                  {assignees.length > 0 && (
                    <span className="flex shrink-0 items-center -space-x-1.5">
                      {assignees.map((a) => (
                        <span
                          key={a.id}
                          title={a.name}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-surface bg-accent-100 text-[10px] font-medium text-accent-700"
                        >
                          {initials(a.name)}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {tasks.length === 0 && hasAnyTasks && (
          <EmptyState
            icon={<SearchX size={28} />}
            title="Nenhuma tarefa encontrada"
            description="Ajuste a busca ou os filtros."
            action={
              <button
                type="button"
                onClick={onClearFilters}
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium"
              >
                Limpar filtros
              </button>
            }
          />
        )}
        {tasks.length === 0 && !hasAnyTasks && (
          <EmptyState
            icon={<ClipboardList size={28} />}
            title="Nenhuma tarefa por aqui ainda"
            description="Crie sua primeira tarefa."
            action={
              <button
                type="button"
                onClick={() => onCreate({ title: "Nova tarefa" })}
                className="flex items-center gap-1.5 rounded-md bg-accent-500 px-3 py-1.5 text-sm font-medium text-white"
              >
                <Plus size={15} /> Criar tarefa
              </button>
            }
          />
        )}
      </div>
      <TaskQuickAdd onCreate={onCreate} />
    </div>
  );
}
