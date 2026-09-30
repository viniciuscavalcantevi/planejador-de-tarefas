import * as Dialog from "@radix-ui/react-dialog";
import * as Switch from "@radix-ui/react-switch";
import { Info, Shield, X, Check } from "lucide-react";
import { useEffect, useState } from "react";
import type { CreateUserInput, Profile, UserOperation, UserPermissions } from "../types";
import { ADMIN_USER_PERMISSIONS, DEFAULT_USER_PERMISSIONS } from "../types";

interface UserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToEdit?: Profile | null;
  onSave: (data: CreateUserInput) => Promise<void>;
}

const AVAILABLE_OPERATIONS: UserOperation[] = ["TODAS", "SAUDE", "ODONTO", "COBRANCA", "PME"];

export function UserModal({ open, onOpenChange, userToEdit, onSave }: UserModalProps) {
  const [matricula, setMatricula] = useState("");
  const [login, setLogin] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [operations, setOperations] = useState<string[]>(["TODAS"]);
  const [active, setActive] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [permissions, setPermissions] = useState<UserPermissions>(DEFAULT_USER_PERMISSIONS);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (userToEdit) {
        setMatricula(userToEdit.matricula || "");
        setLogin(userToEdit.login || "");
        setName(userToEdit.name || "");
        setEmail(userToEdit.email || "");
        setOperations(userToEdit.operations && userToEdit.operations.length > 0 ? userToEdit.operations : ["TODAS"]);
        setActive(userToEdit.active !== false);
        setIsAdmin(!!userToEdit.isAdmin);
        setPermissions(
          userToEdit.permissions || (userToEdit.isAdmin ? ADMIN_USER_PERMISSIONS : DEFAULT_USER_PERMISSIONS)
        );
      } else {
        setMatricula("");
        setLogin("");
        setName("");
        setEmail("");
        setOperations(["TODAS"]);
        setActive(true);
        setIsAdmin(false);
        setPermissions(DEFAULT_USER_PERMISSIONS);
      }
      setError(null);
    }
  }, [open, userToEdit]);

  function handleToggleAdmin(admin: boolean) {
    setIsAdmin(admin);
    if (admin) {
      setPermissions(ADMIN_USER_PERMISSIONS);
      if (!operations.includes("TODAS")) {
        setOperations(["TODAS"]);
      }
    } else {
      setPermissions(DEFAULT_USER_PERMISSIONS);
    }
  }

  function handleToggleOperation(op: UserOperation) {
    if (op === "TODAS") {
      setOperations(["TODAS"]);
      return;
    }

    let next = operations.filter((o) => o !== "TODAS");
    if (next.includes(op)) {
      next = next.filter((o) => o !== op);
      if (next.length === 0) next = ["TODAS"];
    } else {
      next.push(op);
    }
    setOperations(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Por favor, preencha o Nome completo.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave({
        name: name.trim(),
        matricula: matricula.trim() || undefined,
        login: login.trim() || undefined,
        email: email.trim() || undefined,
        operations,
        active,
        isAdmin,
        permissions,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar usuário.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[94vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl overflow-hidden focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              {userToEdit ? "Editar Usuário" : "Novo Usuário"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Fechar"
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="max-h-[82vh] overflow-y-auto px-6 py-4 space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
                {error}
              </div>
            )}

            {/* Linha 1: Matrícula e Login */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Matrícula</label>
                <input
                  type="text"
                  placeholder="Ex: 1212544"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Login</label>
                <input
                  type="text"
                  placeholder="Ex: andreia.mariano"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Linha 2: Nome Completo * */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nome completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Andreia Carliane Ferreira Mariano"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            {/* Linha 3: Email */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="nome@hapvida.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
              />
            </div>

            {/* Banner Informativo Azul Hapvida */}
            <div className="flex items-start gap-3 rounded-lg bg-cyan-50/70 border border-cyan-200/80 p-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-white">
                <Info size={13} />
              </div>
              <p className="text-xs text-cyan-900 leading-relaxed">
                A senha padrão será <strong className="font-semibold text-cyan-950">Hap@2025</strong>. O usuário
                precisará redefinir a senha no primeiro acesso.
              </p>
            </div>

            {/* Operações * */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-gray-700">
                  Operações <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-gray-400">Selecione 'TODAS' para acesso completo</span>
              </div>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-gray-200 bg-gray-50/60">
                {AVAILABLE_OPERATIONS.map((op) => {
                  const isSelected = operations.includes(op);
                  return (
                    <button
                      key={op}
                      type="button"
                      onClick={() => handleToggleOperation(op)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-[#0066CC] text-white shadow-xs"
                          : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-700"
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                      {op}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Permissões do Usuário: O que pode ou não ver, editar e fazer */}
            <div className="rounded-lg border border-gray-200 bg-gray-50/40 p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="flex items-center gap-2">
                  <Shield size={16} className={isAdmin ? "text-amber-500" : "text-[#0066CC]"} />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Permissões de Acesso do Usuário
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 font-medium">Administrador do Sistema:</span>
                  <Switch.Root
                    checked={isAdmin}
                    onCheckedChange={handleToggleAdmin}
                    className="relative h-5 w-9 shrink-0 rounded-full bg-gray-300 outline-none transition-colors data-[state=checked]:bg-[#0066CC]"
                  >
                    <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white transition-transform data-[state=checked]:translate-x-[18px]" />
                  </Switch.Root>
                </div>
              </div>

              {/* Matriz do que pode ou não ver, editar e fazer */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                {/* Visualizar */}
                <label className="flex items-start gap-2 text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.canViewAllTasks}
                    onChange={(e) =>
                      setPermissions((prev) => ({ ...prev, canViewAllTasks: e.target.checked }))
                    }
                    disabled={isAdmin}
                    className="mt-0.5 rounded border-gray-300 text-[#0066CC] focus:ring-[#0066CC]"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Ver todas as tarefas</span>
                    <p className="text-[11px] text-gray-500">
                      {permissions.canViewAllTasks
                        ? "Visualiza tarefas de todos da equipe"
                        : "Apenas tarefas atribuídas a si próprio"}
                    </p>
                  </div>
                </label>

                {/* Criar Tarefas */}
                <label className="flex items-start gap-2 text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.canCreateTasks}
                    onChange={(e) =>
                      setPermissions((prev) => ({ ...prev, canCreateTasks: e.target.checked }))
                    }
                    disabled={isAdmin}
                    className="mt-0.5 rounded border-gray-300 text-[#0066CC] focus:ring-[#0066CC]"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Criar tarefas</span>
                    <p className="text-[11px] text-gray-500">Permissão para adicionar novas tarefas</p>
                  </div>
                </label>

                {/* Editar Tarefas */}
                <label className="flex items-start gap-2 text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.canEditTasks}
                    onChange={(e) =>
                      setPermissions((prev) => ({ ...prev, canEditTasks: e.target.checked }))
                    }
                    disabled={isAdmin}
                    className="mt-0.5 rounded border-gray-300 text-[#0066CC] focus:ring-[#0066CC]"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Editar tarefas</span>
                    <p className="text-[11px] text-gray-500">Alterar título, prazos, status e detalhes</p>
                  </div>
                </label>

                {/* Excluir Tarefas */}
                <label className="flex items-start gap-2 text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.canDeleteTasks}
                    onChange={(e) =>
                      setPermissions((prev) => ({ ...prev, canDeleteTasks: e.target.checked }))
                    }
                    disabled={isAdmin}
                    className="mt-0.5 rounded border-gray-300 text-[#0066CC] focus:ring-[#0066CC]"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Excluir tarefas</span>
                    <p className="text-[11px] text-gray-500">Pode remover tarefas permanentemente</p>
                  </div>
                </label>

                {/* Criar Times / Workspaces */}
                <label className="flex items-start gap-2 text-gray-700 cursor-pointer col-span-1 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={permissions.canCreateTeams}
                    onChange={(e) =>
                      setPermissions((prev) => ({ ...prev, canCreateTeams: e.target.checked }))
                    }
                    disabled={isAdmin}
                    className="mt-0.5 rounded border-gray-300 text-[#0066CC] focus:ring-[#0066CC]"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Criar novos times (workspaces)</span>
                    <p className="text-[11px] text-gray-500">Pode estruturar novas equipes no planejador</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Toggle Usuário Ativo */}
            <div className="flex items-center gap-3 pt-1">
              <Switch.Root
                checked={active}
                onCheckedChange={setActive}
                className="relative h-6 w-11 shrink-0 rounded-full bg-gray-300 outline-none transition-colors data-[state=checked]:bg-emerald-500"
              >
                <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow-xs transition-transform data-[state=checked]:translate-x-[22px]" />
              </Switch.Root>
              <span className="text-sm font-medium text-gray-800">Usuário ativo</span>
            </div>

            {/* Rodapé com botões CANCELAR e SALVAR */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-[#0066CC] px-5 py-2 text-sm font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-[#00529b] focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {isSaving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
