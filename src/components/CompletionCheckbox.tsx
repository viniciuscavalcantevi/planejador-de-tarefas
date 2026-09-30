import * as Checkbox from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "../lib/utils";

interface CompletionCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function CompletionCheckbox({ checked, onChange, label }: CompletionCheckboxProps) {
  return (
    <Checkbox.Root
      checked={checked}
      onCheckedChange={(v) => onChange(v === true)}
      onClick={(e) => e.stopPropagation()}
      aria-label={checked ? `Marcar "${label}" como não concluída` : `Marcar "${label}" como concluída`}
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        checked
          ? "border-accent-500 bg-accent-500 text-white"
          : "border-border-strong bg-surface hover:border-accent-500"
      )}
    >
      <Checkbox.Indicator>
        <Check size={13} strokeWidth={3} />
      </Checkbox.Indicator>
    </Checkbox.Root>
  );
}
