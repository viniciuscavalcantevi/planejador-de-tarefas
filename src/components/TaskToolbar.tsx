import { Calendar, Download, List, Plus, Search } from "lucide-react";
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
  displayMode: "lista" | "calendario";
  onToggleDisplayMode: (mode: "lista" | "calendario") => void;
  onExport: () => void;
}

export function TaskToolbar({
  filters,
  members,
  resultCount,
  onChangeFilters,
  onClearFilters,
  onNewTask,
  displayMode,
  onToggleDisplayMode,
  onExport,
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

        <div className="flex items-center gap-2">
          {/* Alternador Lista / Calendário */}
          <div className="flex items-center rounded-md border border-gray-200 bg-gray-50/80 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => onToggleDisplayMode("lista")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-semibold transition-all ${
                displayMode === "lista"
                  ? "bg-white text-[#0066CC] shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <List size={14} />
              Lista
            </button>
            <button
              type="button"
              onClick={() => onToggleDisplayMode("calendario")}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-semibold transition-all ${
                displayMode === "calendario"
                  ? "bg-white text-[#0066CC] shadow-2xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Calendar size={14} />
              Calendário
            </button>
          </div>

          {/* Exportar Excel / CSV */}
          <button
            type="button"
            onClick={onExport}
            title="Exportar tarefas para planilha Excel (.csv)"
            className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors"
          >
            <Download size={14} className="text-[#0066CC]" />
            Exportar
          </button>

          <button
            type="button"
            onClick={onNewTask}
            className="flex items-center gap-1.5 rounded-md bg-[#0066CC] px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-2xs hover:bg-[#00529b] transition-colors"
          >
            <Plus size={15} strokeWidth={2.5} />
            Nova tarefa
          </button>
        </div>
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
