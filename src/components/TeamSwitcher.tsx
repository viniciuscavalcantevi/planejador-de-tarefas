import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronsUpDown, Plus, Users2 } from "lucide-react";
import { useState } from "react";
import type { Workspace } from "../types";
import { cn } from "../lib/utils";

interface TeamSwitcherProps {
  teams: Workspace[];
  currentTeam: Workspace | null;
  onSwitch: (teamId: string) => void;
  onCreate: (name: string) => Promise<unknown>;
  canCreate: boolean;
}

export function TeamSwitcher({ teams, currentTeam, onSwitch, onCreate, canCreate }: TeamSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submitCreate() {
    if (!name.trim()) {
      setError("Informe um nome para o time.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onCreate(name.trim());
      setName("");
      setCreating(false);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setCreating(false);
          setError(null);
          setName("");
        }
      }}
    >
      <Popover.Trigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-left text-sm font-medium hover:bg-black/[0.02]"
        >
          <Users2 size={16} className="shrink-0 text-accent-600" />
          <span className="flex-1 truncate">{currentTeam?.name ?? "Selecionar time"}</span>
          <ChevronsUpDown size={14} className="shrink-0 text-text-subtle" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50 w-72 rounded-md border border-border bg-surface p-1 shadow-lg"
          sideOffset={4}
          align="start"
        >
          {!creating ? (
            <>
              <p className="px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-text-subtle">
                Meus times
              </p>
              <div className="max-h-56 overflow-y-auto">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => {
                      onSwitch(team.id);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent-50"
                  >
                    <span className="truncate">{team.name}</span>
                    {team.id === currentTeam?.id && <Check size={13} className="ml-auto shrink-0" />}
                  </button>
                ))}
              </div>
              {canCreate ? (
                <div className="mt-1 border-t border-border pt-1">
                  <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm font-medium text-accent-600 hover:bg-accent-50"
                  >
                    <Plus size={14} />
                    Criar novo time
                  </button>
                </div>
              ) : (
                <p className="mt-1 border-t border-border px-2 pt-2 text-xs text-text-subtle">
                  Apenas administradores podem criar novos times.
                </p>
              )}
            </>
          ) : (
            <form
              className="p-2"
              onSubmit={(e) => {
                e.preventDefault();
                submitCreate();
              }}
            >
              <label htmlFor="new-team-name" className="mb-1 block text-xs font-medium text-text-muted">
                Nome do novo time
              </label>
              <input
                id="new-team-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Time de Vendas"
                aria-invalid={!!error}
                className={cn(
                  "w-full rounded-md border border-border px-2 py-1.5 text-sm outline-none focus-visible:border-accent-500",
                  error && "border-danger-500"
                )}
              />
              {error && (
                <p role="alert" className="mt-1 text-xs text-danger-500">
                  {error}
                </p>
              )}
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="rounded-md px-2.5 py-1.5 text-sm font-medium text-text-muted hover:bg-black/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-accent-500 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-60"
                >
                  Criar time
                </button>
              </div>
            </form>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
