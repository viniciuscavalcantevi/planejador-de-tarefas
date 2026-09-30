import { ClipboardList, Plus, SearchX } from "lucide-react";
import type { CreateTaskInput, Task, TaskFilterState, WorkspaceMember } from "../types";
import { TaskRow } from "./TaskRow";
import { TaskQuickAdd } from "./TaskQuickAdd";
import { EmptyState } from "./EmptyState";

interface TaskTableProps {
  tasks: Task[];
  members: WorkspaceMember[];
  hasAnyTasks: boolean;
  filters: TaskFilterState;
  onOpen: (taskId: string) => void;
  onToggleComplete: (task: Task, checked: boolean) => void;
  onUpdate: (taskId: string, input: Partial<Task>) => void;
  onDuplicate: (task: Task) => void;
  onDelete: (task: Task) => void;
  onCreate: (input: CreateTaskInput) => Promise<unknown>;
  onClearFilters: () => void;
}

const COLUMNS = [
  { key: "done", label: "Conclusão" },
  { key: "title", label: "Nome" },
  { key: "source", label: "Origem" },
  { key: "due", label: "Vencimento" },
  { key: "priority", label: "Prioridade" },
  { key: "status", label: "Status" },
  { key: "assignee", label: "Responsável" },
  { key: "attachments", label: "Anexos" },
  { key: "actions", label: "Ações" },
];

export function TaskTable(props: TaskTableProps) {
  const { tasks, members, hasAnyTasks, onOpen, onToggleComplete, onUpdate, onDuplicate, onDelete, onCreate, onClearFilters } = props;

  return (
    <div className="hidden flex-1 flex-col overflow-hidden md:flex">
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-app-bg">
            <tr className="border-b border-border">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-text-subtle"
                >
                  {col.key === "attachments" || col.key === "actions" ? (
                    <span className="sr-only">{col.label}</span>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                members={members}
                onOpen={onOpen}
                onToggleComplete={onToggleComplete}
                onUpdate={onUpdate}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>

        {tasks.length === 0 && hasAnyTasks && (
          <EmptyState
            icon={<SearchX size={32} />}
            title="Nenhuma tarefa encontrada"
            description="Ajuste a busca ou os filtros para ver outras tarefas."
            action={
              <button
                type="button"
                onClick={onClearFilters}
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-black/5"
              >
                Limpar filtros
              </button>
            }
          />
        )}

        {tasks.length === 0 && !hasAnyTasks && (
          <EmptyState
            icon={<ClipboardList size={32} />}
            title="Nenhuma tarefa por aqui ainda"
            description="Crie sua primeira tarefa para começar a organizar o trabalho."
            action={
              <button
                type="button"
                onClick={() => onCreate({ title: "Nova tarefa" })}
                className="flex items-center gap-1.5 rounded-md bg-accent-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-600"
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
