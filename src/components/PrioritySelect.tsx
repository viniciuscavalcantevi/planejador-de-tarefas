import * as Select from "@radix-ui/react-select";
import { AlertTriangle, Check, ChevronDown } from "lucide-react";
import type { TaskPriority } from "../types";
import { PRIORITY_DOT_CLASS, PRIORITY_LABELS, PRIORITY_TEXT_CLASS } from "../lib/taskLabels";
import { cn } from "../lib/utils";

const OPTIONS: TaskPriority[] = ["baixa", "media", "alta", "urgente"];

interface PrioritySelectProps {
  value: TaskPriority;
  onChange: (value: TaskPriority) => void;
  compact?: boolean;
  label?: string;
}

export function PrioritySelect({ value, onChange, compact, label }: PrioritySelectProps) {
  return (
    <Select.Root value={value} onValueChange={(v) => onChange(v as TaskPriority)}>
      <Select.Trigger
        aria-label={label ?? "Prioridade"}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm hover:border-border focus-visible:border-border",
          compact && "text-xs"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <span className={cn("h-2 w-2 shrink-0 rounded-full", PRIORITY_DOT_CLASS[value])} />
        {value === "urgente" && <AlertTriangle size={13} className="text-danger-600" />}
        <span className={PRIORITY_TEXT_CLASS[value]}>{PRIORITY_LABELS[value]}</span>
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
                <span className={cn("h-2 w-2 rounded-full", PRIORITY_DOT_CLASS[opt])} />
                <Select.ItemText>{PRIORITY_LABELS[opt]}</Select.ItemText>
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
