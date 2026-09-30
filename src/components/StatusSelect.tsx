import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import type { TaskStatus } from "../types";
import { STATUS_LABELS } from "../lib/taskLabels";
import { cn } from "../lib/utils";

const OPTIONS: TaskStatus[] = ["nao_iniciado", "em_andamento", "concluido"];

const DOT_CLASS: Record<TaskStatus, string> = {
  nao_iniciado: "bg-text-subtle",
  em_andamento: "bg-accent-500",
  concluido: "bg-success-500",
};

interface StatusSelectProps {
  value: TaskStatus;
  onChange: (value: TaskStatus) => void;
  compact?: boolean;
}

export function StatusSelect({ value, onChange, compact }: StatusSelectProps) {
  return (
    <Select.Root value={value} onValueChange={(v) => onChange(v as TaskStatus)}>
      <Select.Trigger
        aria-label="Status"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm hover:border-border focus-visible:border-border",
          compact && "text-xs"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <span className={cn("h-2 w-2 shrink-0 rounded-full", DOT_CLASS[value])} />
        <Select.Value>{STATUS_LABELS[value]}</Select.Value>
        <Select.Icon>
          <ChevronDown size={13} className="text-text-subtle" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className="z-50 overflow-hidden rounded-md border border-border bg-surface shadow-lg"
          position="popper"
          sideOffset={4}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <Select.Viewport className="p-1">
            {OPTIONS.map((opt) => (
              <Select.Item
                key={opt}
                value={opt}
                className="flex cursor-pointer select-none items-center gap-2 rounded px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent-50"
                onClick={(e) => e.stopPropagation()}
              >
                <span className={cn("h-2 w-2 rounded-full", DOT_CLASS[opt])} />
                <Select.ItemText>{STATUS_LABELS[opt]}</Select.ItemText>
                <Select.ItemIndicator className="ml-auto">
                  <Check size={13} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
