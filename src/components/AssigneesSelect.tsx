import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, User, Users } from "lucide-react";
import { useMemo, useState } from "react";
import type { WorkspaceMember } from "../types";
import { MAX_TASK_ASSIGNEES } from "../types";
import { cn, initials } from "../lib/utils";

interface AssigneesSelectProps {
  members: WorkspaceMember[];
  value: string[];
  onChange: (userIds: string[]) => void;
  triggerClassName?: string;
  label?: string;
}

export function AssigneesSelect({ members, value, onChange, triggerClassName, label }: AssigneesSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = value
    .map((id) => members.find((m) => m.userId === id)?.profile)
    .filter((p): p is NonNullable<typeof p> => !!p);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.profile.name.toLowerCase().includes(q));
  }, [members, query]);

  const atLimit = value.length >= MAX_TASK_ASSIGNEES;

  function toggle(userId: string) {
    if (value.includes(userId)) {
      onChange(value.filter((id) => id !== userId));
    } else if (!atLimit) {
      onChange([...value, userId]);
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={label ?? "Responsáveis"}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm hover:border-border",
            triggerClassName
          )}
        >
          {selected.length === 0 ? (
            <>
              <User size={14} className="text-text-subtle" />
              <span>Sem responsável</span>
            </>
          ) : (
            <span className="flex items-center -space-x-1.5">
              {selected.map((p) => (
                <span
                  key={p.id}
                  title={p.name}
                  className="flex h-5 w-5 items-center justify-center rounded-full border border-surface bg-accent-100 text-[10px] font-medium text-accent-700"
                >
                  {initials(p.name)}
                </span>
              ))}
            </span>
          )}
          {selected.length > 0 && (
            <span className="max-w-[8rem] truncate">
              {selected.length === 1 ? selected[0].name : `${selected.length} responsáveis`}
            </span>
          )}
          <ChevronDown size={13} className="text-text-subtle" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50 w-64 rounded-md border border-border bg-surface p-1 shadow-lg"
          sideOffset={4}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5 border-b border-border px-1.5 pb-1.5 pt-0.5 text-xs text-text-subtle">
            <Users size={12} />
            {value.length}/{MAX_TASK_ASSIGNEES} responsáveis selecionados
          </div>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome..."
            aria-label="Buscar responsável"
            className="my-1 w-full rounded border border-border px-2 py-1 text-sm outline-none focus-visible:border-accent-500"
          />
          <div className="max-h-56 overflow-y-auto">
            {filtered.map((m) => {
              const checked = value.includes(m.userId);
              const disabled = !checked && atLimit;
              return (
                <button
                  key={m.userId}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggle(m.userId)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent-50",
                    disabled && "cursor-not-allowed opacity-40 hover:bg-transparent"
                  )}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-100 text-[10px] font-medium text-accent-700">
                    {initials(m.profile.name)}
                  </span>
                  <span className="truncate">{m.profile.name}</span>
                  {checked && <Check size={13} className="ml-auto shrink-0" />}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="px-2 py-2 text-sm text-text-subtle">Nenhum membro encontrado.</p>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
