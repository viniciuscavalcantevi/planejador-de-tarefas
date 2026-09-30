import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import type { TaskSource } from "../types";
import { SOURCE_LABELS } from "../lib/taskLabels";

const OPTIONS: TaskSource[] = ["manual", "email", "equipe"];

interface SourceSelectProps {
  value: TaskSource;
  onChange: (value: TaskSource) => void;
}

export function SourceSelect({ value, onChange }: SourceSelectProps) {
  return (
    <Select.Root value={value} onValueChange={(v) => onChange(v as TaskSource)}>
      <Select.Trigger
        aria-label="Origem"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700 hover:bg-accent-100"
      >
        <span>{SOURCE_LABELS[value].short} · {SOURCE_LABELS[value].full}</span>
        <Select.Icon>
          <ChevronDown size={12} />
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
                <Select.ItemText>{SOURCE_LABELS[opt].short} · {SOURCE_LABELS[opt].full}</Select.ItemText>
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
