import {
  AlertCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CreateUserInput, Profile } from "../types";
import { repository } from "../services";
import { useToast } from "../store/ToastContext";
import { initials } from "../lib/utils";
import { UserModal } from "./UserModal";

interface UserManagementViewProps {
  currentUserId: string;
  actor: Profile;
}

export function UserManagementView({ currentUserId, actor }: UserManagementViewProps) {
  const { showToast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOpFilter, setSelectedOpFilter] = useState<string>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<Profile | null>(null);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const list = await repository.listAllProfiles();
      setProfiles(list);
    } catch (err) {
      showToast({
        title: "Erro ao carregar lista de usuários",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.matricula && p.matricula.toLowerCase().includes(q)) ||
        (p.login && p.login.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q));

      const matchesOp =
        selectedOpFilter === "ALL" ||
        (p.operations &&
          (p.operations.includes("TODAS") || p.operations.includes(selectedOpFilter)));

      return matchesSearch && matchesOp;
    });
  }, [profiles, search, selectedOpFilter]);

  async function handleSaveUser(data: CreateUserInput) {
    if (userToEdit) {
      const updated = await repository.updateUser(userToEdit.id, data, actor);
      setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      showToast({ title: `Usuário "${updated.name}" atualizado com sucesso.` });
    } else {
      const created = await repository.createUser(data, actor);
      setProfiles((prev) => [created, ...prev]);
      showToast({ title: `Usuário "${created.name}" cadastrado com sucesso.` });
    }
  }

  async function confirmDeleteUser() {
    if (!userToDelete) return;
    try {
      setIsDeleting(true);
      await repository.deleteUser(userToDelete.id, actor);
      setProfiles((prev) => prev.filter((p) => p.id !== userToDelete.id));
      showToast({ title: `Usuário "${userToDelete.name}" removido com sucesso.` });
      setUserToDelete(null);
    } catch (err) {
      showToast({
        title: "Não foi possível excluir o usuário",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-gray-50/50">
      {/* Top Header */}
      <div className="flex flex-col gap-4 border-b border-gray-200 bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Users size={22} className="text-[#0066CC]" />
            Cadastro de Usuários
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Gerencie os usuários do sistema. Apenas administradores podem acessar esta página.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setUserToEdit(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0066CC] px-4 py-2.5 text-xs font-bold tracking-wider uppercase text-white shadow-xs hover:bg-[#00529b] active:scale-98 transition-all"
        >
          <Plus size={16} strokeWidth={2.5} />
          NOVO USUÁRIO
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col gap-3 border-b border-gray-200 bg-white px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-lg">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, matrícula, login ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-200 bg-gray-50/50 py-2 pl-10 pr-4 text-xs text-gray-900 placeholder:text-gray-400 focus:border-[#0066CC] focus:bg-white focus:outline-none transition-colors"
          />
        </div>

        {/* Tags rápidas de filtro por Operação */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-gray-400 text-[11px] font-medium mr-1">Operação:</span>
          {["ALL", "TODAS", "SAUDE", "ODONTO", "COBRANCA", "PME"].map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setSelectedOpFilter(op)}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                selectedOpFilter === op
                  ? "bg-[#0066CC] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {op === "ALL" ? "Todas" : op}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo Principal: Tabela */}
      <div className="flex-1 overflow-auto p-6">
        <div className="rounded-lg border border-gray-200 bg-white shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-md bg-gray-100" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/70 text-[11px] font-semibold uppercase tracking-wider text-gray-600">
                    <th className="py-3 px-4">Nome</th>
                    <th className="py-3 px-4">Matrícula</th>
                    <th className="py-3 px-4">Login</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Operações</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProfiles.map((user) => {
                    const isSelf = user.id === currentUserId;
                    const ops = user.operations && user.operations.length > 0 ? user.operations : ["TODAS"];
                    const isActive = user.active !== false;

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-blue-50/30 transition-colors group"
                      >
                        {/* Nome */}
                        <td className="py-3.5 px-4 font-medium text-gray-900">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e0effe] text-[11px] font-bold text-[#0066CC]">
                              {initials(user.name)}
                            </span>
                            <div className="flex flex-col">
                              <span className="truncate max-w-[220px]">
                                {user.name}
                                {isSelf && (
                                  <span className="ml-1.5 rounded bg-blue-100 px-1.5 py-0.2 text-[10px] font-medium text-blue-800">
                                    você
                                  </span>
                                )}
                                {user.isAdmin && (
                                  <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-semibold text-amber-800">
                                    Admin
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Matrícula */}
                        <td className="py-3.5 px-4 text-gray-600 font-mono text-[11px]">
                          {user.matricula || "—"}
                        </td>

                        {/* Login */}
                        <td className="py-3.5 px-4 text-gray-600 font-mono text-[11px]">
                          {user.login || "—"}
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-4 text-gray-600">
                          {user.email ? (
                            <a
                              href={`mailto:${user.email}`}
                              className="text-gray-700 hover:text-[#0066CC] hover:underline"
                            >
                              {user.email}
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>

                        {/* Operações */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {ops.map((op) => (
                              <span
                                key={op}
                                className="inline-flex items-center rounded-full bg-[#0066CC] px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase text-white shadow-2xs"
                              >
                                {op}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              isActive
                                ? "bg-emerald-500 text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {isActive ? "ATIVO" : "INATIVO"}
                          </span>
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setUserToEdit(user);
                                setModalOpen(true);
                              }}
                              title="Editar usuário"
                              className="rounded p-1.5 text-[#0066CC] hover:bg-blue-50 transition-colors"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              disabled={isSelf}
                              onClick={() => setUserToDelete(user)}
                              title={isSelf ? "Não é possível excluir a si mesmo" : "Excluir usuário"}
                              className="rounded p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredProfiles.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        Nenhum usuário encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rodapé informativo */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>
            Exibindo <strong>{filteredProfiles.length}</strong> de{" "}
            <strong>{profiles.length}</strong> usuários cadastrados
          </span>
          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <UserCheck size={13} className="text-emerald-500" />
            Todos os usuários ativos têm acesso liberado ao Planejador de Tarefas
          </span>
        </div>
      </div>

      {/* Modal de Cadastro / Edição */}
      <UserModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        userToEdit={userToEdit}
        onSave={handleSaveUser}
      />

      {/* Modal de Confirmação de Exclusão */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="rounded-full bg-red-100 p-2">
                <AlertCircle size={20} />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Excluir Usuário</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Tem certeza que deseja remover o usuário{" "}
              <strong className="text-gray-900">{userToDelete.name}</strong>? Esta ação removerá
              o acesso e as atribuições dele nas tarefas.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-semibold uppercase text-gray-600 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                disabled={isDeleting}
                className="rounded-md bg-red-600 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
