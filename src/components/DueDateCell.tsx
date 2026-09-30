import * as Popover from "@radix-ui/react-popover";
import { Calendar } from "lucide-react";
import { useState } from "react";
import type { TaskStatus } from "../types";
import { dateLabel, isOverdue } from "../lib/taskRules";
import { cn } from "../lib/utils";

interface DueDateCellProps {
  value: string | null;
  status: TaskStatus;
  onChange: (value: string | null) => void;
}

export function DueDateCell({ value, status, onChange }: DueDateCellProps) {
  const [open, setOpen] = useState(false);
  const overdue = isOverdue(value, status);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          aria-label="Editar vencimento"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
            overdue
              ? "border-danger-500 text-danger-500"
              : value
                ? "border-border text-text"
                : "border-border text-text-subtle"
          )}
        >
          <Calendar size={12} />
          {dateLabel(value, status)}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50 rounded-md border border-border bg-surface p-3 shadow-lg"
          sideOffset={4}
          onClick={(e) => e.stopPropagation()}
        >
          <label className="mb-1 block text-xs font-medium text-text-muted" htmlFor="due-date-input">
            Vencimento
          </label>
          <input
            id="due-date-input"
            type="date"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
            className="w-full rounded border border-border px-2 py-1 text-sm outline-none focus-visible:border-accent-500"
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="mt-2 text-xs text-text-muted underline hover:text-text"
            >
              Remover prazo
            </button>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
