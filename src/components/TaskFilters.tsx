import * as Popover from "@radix-ui/react-popover";
import * as Checkbox from "@radix-ui/react-checkbox";
import { Check, ChevronDown, Filter } from "lucide-react";
import type { TaskFilterState, TaskPriority, TaskStatus, WorkspaceMember } from "../types";
import { PRIORITY_LABELS, STATUS_LABELS } from "../lib/taskLabels";
import { cn } from "../lib/utils";

const STATUS_OPTIONS: TaskStatus[] = ["nao_iniciado", "em_andamento", "concluido"];
const PRIORITY_OPTIONS: TaskPriority[] = ["baixa", "media", "alta", "urgente"];

interface TaskFiltersProps {
  filters: TaskFilterState;
  members: WorkspaceMember[];
  onChange: (updater: (prev: TaskFilterState) => TaskFilterState) => void;
  onClear: () => void;
}

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function TaskFilters({ filters, members, onChange, onClear }: TaskFiltersProps) {
  const activeCount =
    filters.status.length +
    filters.priority.length +
    (filters.assigneeId?.length ?? 0) +
    (filters.showCompleted ? 0 : 1);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterPopover
        label="Status"
        count={filters.status.length}
        renderContent={() => (
          <>
            {STATUS_OPTIONS.map((opt) => (
              <CheckboxRow
                key={opt}
                checked={filters.status.includes(opt)}
                label={STATUS_LABELS[opt]}
                onToggle={() =>
                  onChange((prev) => ({ ...prev, status: toggleValue(prev.status, opt) }))
                }
              />
            ))}
          </>
        )}
      />

      <FilterPopover
        label="Prioridade"
        count={filters.priority.length}
        renderContent={() => (
          <>
            {PRIORITY_OPTIONS.map((opt) => (
              <CheckboxRow
                key={opt}
                checked={filters.priority.includes(opt)}
                label={PRIORITY_LABELS[opt]}
                onToggle={() =>
                  onChange((prev) => ({ ...prev, priority: toggleValue(prev.priority, opt) }))
                }
              />
            ))}
          </>
        )}
      />

      <FilterPopover
        label="Responsável"
        count={filters.assigneeId?.length ?? 0}
        renderContent={() => (
          <>
            {members.map((m) => (
              <CheckboxRow
                key={m.userId}
                checked={filters.assigneeId?.includes(m.userId) ?? false}
                label={m.profile.name}
                onToggle={() =>
                  onChange((prev) => ({
                    ...prev,
                    assigneeId: toggleValue(prev.assigneeId ?? [], m.userId),
                  }))
                }
              />
            ))}
          </>
        )}
      />

      <label className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm">
        <Checkbox.Root
          checked={filters.showCompleted}
          onCheckedChange={(v) => onChange((prev) => ({ ...prev, showCompleted: v === true }))}
          className="flex h-4 w-4 items-center justify-center rounded border border-border-strong data-[state=checked]:border-accent-500 data-[state=checked]:bg-accent-500 data-[state=checked]:text-white"
        >
          <Checkbox.Indicator>
            <Check size={11} strokeWidth={3} />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Mostrar concluídas
      </label>

      <div className="flex items-center gap-1.5 text-sm">
        <label htmlFor="sort-by" className="text-text-muted">
          Ordenar por
        </label>
        <select
          id="sort-by"
          value={filters.sortBy}
          onChange={(e) =>
            onChange((prev) => ({ ...prev, sortBy: e.target.value as TaskFilterState["sortBy"] }))
          }
          className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm outline-none focus-visible:border-accent-500"
        >
          <option value="criacao">Data de criação</option>
          <option value="nome">Nome</option>
          <option value="vencimento">Vencimento</option>
          <option value="prioridade">Prioridade</option>
        </select>
      </div>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-md px-2 py-1.5 text-sm font-medium text-accent-600 hover:bg-accent-50"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}

function CheckboxRow({
  checked,
  label,
  onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent-50">
      <Checkbox.Root
        checked={checked}
        onCheckedChange={onToggle}
        className="flex h-4 w-4 items-center justify-center rounded border border-border-strong data-[state=checked]:border-accent-500 data-[state=checked]:bg-accent-500 data-[state=checked]:text-white"
      >
        <Checkbox.Indicator>
          <Check size={11} strokeWidth={3} />
        </Checkbox.Indicator>
      </Checkbox.Root>
      {label}
    </label>
  );
}

function FilterPopover({
  label,
  count,
  renderContent,
}: {
  label: string;
  count: number;
  renderContent: () => React.ReactNode;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-black/[0.02]",
            count > 0 && "border-accent-500 text-accent-700"
          )}
        >
          <Filter size={13} />
          {label}
          {count > 0 && <span className="text-xs font-medium">({count})</span>}
          <ChevronDown size={13} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50 w-56 rounded-md border border-border bg-surface p-1 shadow-lg"
          sideOffset={4}
        >
          {renderContent()}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
