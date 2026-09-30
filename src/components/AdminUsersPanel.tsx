import * as Dialog from "@radix-ui/react-dialog";
import * as Switch from "@radix-ui/react-switch";
import { ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Profile } from "../types";
import { repository } from "../services";
import { useToast } from "../store/ToastContext";
import { initials } from "../lib/utils";

interface AdminUsersPanelProps {
  currentUserId: string;
  actor: { id: string; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminUsersPanel({ currentUserId, actor, open, onOpenChange }: AdminUsersPanelProps) {
  const { showToast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    repository
      .listAllProfiles()
      .then((list) => active && setProfiles(list))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [open]);

  async function toggle(profile: Profile, next: boolean) {
    setUpdatingId(profile.id);
    const previous = profiles;
    setProfiles((prev) => prev.map((p) => (p.id === profile.id ? { ...p, isAdmin: next } : p)));
    try {
      await repository.setUserAdmin(profile.id, next, actor);
      showToast({
        title: next ? `${profile.name} agora é administrador` : `${profile.name} não é mais administrador`,
      });
    } catch (err) {
      setProfiles(previous);
      showToast({
        title: "Não foi possível alterar a permissão",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-40 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <Dialog.Title className="flex items-center gap-1.5 text-base font-semibold text-text">
                <ShieldCheck size={16} className="text-accent-600" />
                Administradores
              </Dialog.Title>
              <Dialog.Description className="text-sm text-text-muted">
                Só administradores podem criar novos times.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Fechar administradores"
                className="rounded p-1.5 text-text-subtle hover:bg-black/5 hover:text-text"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-4">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-md bg-black/5" />
                ))}
              </div>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {profiles.map((profile) => {
                  const isSelf = profile.id === currentUserId;
                  return (
                    <li
                      key={profile.id}
                      className="flex items-center gap-2 rounded-md border border-border px-3 py-2"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-100 text-xs font-medium text-accent-700">
                        {initials(profile.name)}
                      </span>
                      <span className="flex-1 truncate text-sm">
                        {profile.name}
                        {isSelf && <span className="text-text-subtle"> (você)</span>}
                      </span>
                      <Switch.Root
                        checked={!!profile.isAdmin}
                        disabled={updatingId === profile.id || (isSelf && !!profile.isAdmin)}
                        onCheckedChange={(checked) => toggle(profile, checked)}
                        aria-label={
                          profile.isAdmin
                            ? `Remover permissão de administrador de ${profile.name}`
                            : `Tornar ${profile.name} administrador`
                        }
                        className="relative h-5 w-9 shrink-0 rounded-full bg-border-strong outline-none data-[state=checked]:bg-accent-500 disabled:opacity-50"
                      >
                        <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white transition-transform data-[state=checked]:translate-x-[18px]" />
                      </Switch.Root>
                    </li>
                  );
                })}
                {profiles.length === 0 && (
                  <li className="text-sm text-text-subtle">Nenhum perfil encontrado.</li>
                )}
              </ul>
            )}
            <p className="mt-3 text-xs text-text-subtle">
              Você não pode remover sua própria permissão de administrador.
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
