import { Plus, Search } from "lucide-react";
import type { TaskFilterState, WorkspaceMember } from "../types";
import { TaskFilters } from "./TaskFilters";

const VIEW_TITLES: Record<TaskFilterState["view"], string> = {
  todas: "Todas as tarefas",
  minhas: "Minhas tarefas",
  importantes: "Importantes",
  planejadas: "Planejadas",
  concluidas: "Concluídas",
};

interface TaskToolbarProps {
  filters: TaskFilterState;
  members: WorkspaceMember[];
  resultCount: number;
  onChangeFilters: (updater: (prev: TaskFilterState) => TaskFilterState) => void;
  onClearFilters: () => void;
  onNewTask: () => void;
}

export function TaskToolbar({
  filters,
  members,
  resultCount,
  onChangeFilters,
  onClearFilters,
  onNewTask,
}: TaskToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-border bg-surface px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-text">{VIEW_TITLES[filters.view]}</h1>
          <p className="text-sm text-text-muted">
            {resultCount} {resultCount === 1 ? "tarefa encontrada" : "tarefas encontradas"}
          </p>
        </div>
        <button
          type="button"
          onClick={onNewTask}
          className="flex items-center gap-1.5 rounded-md bg-accent-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-accent-600"
        >
          <Plus size={16} />
          Nova tarefa
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => onChangeFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Buscar por nome ou descrição..."
            aria-label="Buscar tarefas"
            className="w-full rounded-md border border-border bg-surface py-1.5 pl-8 pr-3 text-sm outline-none focus-visible:border-accent-500"
          />
        </div>
      </div>

      <TaskFilters
        filters={filters}
        members={members}
        onChange={onChangeFilters}
        onClear={onClearFilters}
      />
    </div>
  );
}
