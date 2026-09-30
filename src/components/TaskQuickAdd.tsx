import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import type { CreateTaskInput, TaskPriority } from "../types";
import { PrioritySelect } from "./PrioritySelect";

interface TaskQuickAddProps {
  onCreate: (input: CreateTaskInput) => Promise<unknown>;
}

export function TaskQuickAdd({ onCreate }: TaskQuickAddProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("media");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setTitle("");
    setDueDate("");
    setPriority("media");
    setError(null);
  }

  function openRow() {
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function cancel() {
    setOpen(false);
    reset();
  }

  async function save(andContinue: boolean) {
    if (saving) return;
    if (!title.trim()) {
      setError("Informe um nome para a tarefa.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        title,
        priority,
        dueDate: dueDate || null,
      });
      reset();
      if (andContinue) {
        requestAnimationFrame(() => inputRef.current?.focus());
      } else {
        setOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={openRow}
        className="flex w-full items-center gap-2 border-t border-border px-4 py-3 text-sm font-medium text-accent-600 hover:bg-accent-50 sm:px-6"
      >
        <Plus size={16} />
        Adicionar nova tarefa
      </button>
    );
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2 border-t border-border bg-accent-50/40 px-4 py-3 sm:px-6"
      onSubmit={(e) => {
        e.preventDefault();
        save(true);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          cancel();
        }
      }}
    >
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nome da tarefa"
        aria-label="Nome da nova tarefa"
        aria-invalid={!!error}
        className="min-w-[180px] flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-sm outline-none focus-visible:border-accent-500"
      />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        aria-label="Vencimento da nova tarefa"
        className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm outline-none focus-visible:border-accent-500"
      />
      <PrioritySelect value={priority} onChange={setPriority} label="Prioridade da nova tarefa" />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-accent-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-60"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={cancel}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-black/5"
        >
          Cancelar
        </button>
      </div>
      {error && (
        <p role="alert" className="w-full text-sm text-danger-500">
          {error}
        </p>
      )}
    </form>
  );
}
