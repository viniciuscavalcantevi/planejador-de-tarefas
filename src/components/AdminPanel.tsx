import * as Dialog from "@radix-ui/react-dialog";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Crown, Loader2, Trash2, UserPlus, X } from "lucide-react";
import { useState } from "react";
import type { Workspace, WorkspaceMember } from "../types";
import { repository } from "../services";
import { useToast } from "../store/ToastContext";
import { initials } from "../lib/utils";

interface AdminPanelProps {
  team: Workspace;
  members: WorkspaceMember[];
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMembersChanged: () => void;
}

export function AdminPanel({
  team,
  members,
  currentUserId,
  open,
  onOpenChange,
  onMembersChanged,
}: AdminPanelProps) {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<WorkspaceMember | null>(null);

  const isOwner = members.some((m) => m.userId === currentUserId && m.role === "owner");
  const owner = members.find((m) => m.role === "owner");
  const collaborators = members.filter((m) => m.role !== "owner");

  async function handleInvite() {
    if (!email.trim()) {
      setError("Informe o email do colaborador.");
      return;
    }
    setInviting(true);
    setError(null);
    try {
      await repository.addMemberByEmail(team.id, email.trim());
      setEmail("");
      onMembersChanged();
      showToast({ title: "Colaborador adicionado" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível adicionar o colaborador.");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(member: WorkspaceMember) {
    try {
      await repository.removeMember(team.id, member.userId);
      onMembersChanged();
      showToast({ title: "Colaborador removido" });
    } catch (err) {
      showToast({
        title: "Não foi possível remover o colaborador",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setRemoveTarget(null);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-40 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <Dialog.Title className="text-base font-semibold text-text">Administrar time</Dialog.Title>
              <Dialog.Description className="text-sm text-text-muted">{team.name}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Fechar administração do time"
                className="rounded p-1.5 text-text-subtle hover:bg-black/5 hover:text-text"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4">
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-subtle">
                Responsável
              </h3>
              {owner && (
                <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-100 text-xs font-medium text-accent-700">
                    {initials(owner.profile.name)}
                  </span>
                  <span className="flex-1 truncate text-sm font-medium">{owner.profile.name}</span>
                  <Crown size={15} className="text-warning-500" aria-label="Responsável pelo time" />
                </div>
              )}
            </section>

            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-subtle">
                Colaboradores ({collaborators.length})
              </h3>
              <ul className="flex flex-col gap-1.5">
                {collaborators.map((m) => (
                  <li
                    key={m.userId}
                    className="flex items-center gap-2 rounded-md border border-border px-3 py-2"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-100 text-xs font-medium text-accent-700">
                      {initials(m.profile.name)}
                    </span>
                    <span className="flex-1 truncate text-sm">{m.profile.name}</span>
                    {isOwner && (
                      <button
                        type="button"
                        aria-label={`Remover ${m.profile.name} do time`}
                        onClick={() => setRemoveTarget(m)}
                        className="rounded p-1.5 text-text-subtle hover:bg-danger-50 hover:text-danger-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </li>
                ))}
                {collaborators.length === 0 && (
                  <li className="text-sm text-text-subtle">Nenhum colaborador ainda.</li>
                )}
              </ul>
            </section>

            {isOwner ? (
              <section className="border-t border-border pt-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-subtle">
                  Adicionar colaborador
                </h3>
                <form
                  className="flex items-start gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleInvite();
                  }}
                >
                  <div className="flex-1">
                    <label htmlFor="invite-email" className="sr-only">
                      Email do colaborador
                    </label>
                    <input
                      id="invite-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@empresa.com"
                      aria-invalid={!!error}
                      className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm outline-none focus-visible:border-accent-500"
                    />
                    {error && (
                      <p role="alert" className="mt-1 text-xs text-danger-500">
                        {error}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="flex items-center gap-1.5 rounded-md bg-accent-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-60"
                  >
                    {inviting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                    Adicionar
                  </button>
                </form>
                <p className="mt-1.5 text-xs text-text-subtle">
                  A pessoa precisa já ter uma conta cadastrada com este email.
                </p>
              </section>
            ) : (
              <p className="border-t border-border pt-4 text-sm text-text-subtle">
                Somente o responsável pelo time pode adicionar ou remover colaboradores.
              </p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      <AlertDialog.Root open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface p-5 shadow-xl">
            <AlertDialog.Title className="text-base font-semibold text-text">
              Remover colaborador?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-1.5 text-sm text-text-muted">
              {removeTarget?.profile.name} perderá acesso às tarefas deste time e será removido
              como responsável de qualquer tarefa atribuída a ele.
            </AlertDialog.Description>
            <div className="mt-4 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <button className="rounded-md px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-black/5">
                  Cancelar
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={() => removeTarget && handleRemove(removeTarget)}
                  className="rounded-md bg-danger-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-danger-600"
                >
                  Remover
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </Dialog.Root>
  );
}
