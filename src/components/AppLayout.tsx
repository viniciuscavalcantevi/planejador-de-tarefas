import { AlertTriangle, Menu, RotateCcw } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { AdminPanel } from "./AdminPanel";
import { AdminUsersPanel } from "./AdminUsersPanel";
import { useAppStore } from "../store/AppStore";
import { isDemoMode, repository } from "../services";
import { DemoRepository } from "../services/demoRepository";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const {
    filters,
    setFilters,
    visibleTasks,
    tasks,
    currentUser,
    isAdmin,
    reload,
    refreshMembers,
    teams,
    currentTeam,
    switchTeam,
    createTeam,
    members,
    page,
    setPage,
  } = useAppStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminUsersOpen, setAdminUsersOpen] = useState(false);

  const counts = {
    todas: tasks.length,
    minhas: tasks.filter((t) => t.assigneeIds.includes(currentUser?.id ?? "")).length,
    importantes: tasks.filter((t) => t.priority === "alta" || t.priority === "urgente").length,
    planejadas: tasks.filter((t) => !!t.dueDate).length,
    concluidas: tasks.filter((t) => t.status === "concluido").length,
  };

  function resetDemoData() {
    if (repository instanceof DemoRepository) {
      repository.resetToSampleData();
      reload();
    }
  }

  return (
    <div className="flex h-screen flex-col bg-app-bg">
      {/* Barra Superior Corporativa Hapvida */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#00509a] bg-[#0066CC] px-4 text-white shadow-xs z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setMobileNavOpen(true)}
            className="rounded p-1.5 text-white/90 hover:bg-white/10 md:hidden"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold tracking-wide text-white">
              Planejador de Tarefas
            </span>
            <span className="hidden text-xs text-blue-200 sm:inline">|</span>
            <span className="hidden text-xs font-medium text-blue-100 sm:inline">
              {currentTeam?.name ?? "Hapvida NotreDame Intermédica"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="hidden items-center gap-1.5 text-blue-100 md:flex">
            <span className="opacity-75">Última atualização:</span>
            <span className="font-mono text-[11px] font-medium text-white">
              {new Date().toLocaleDateString("pt-BR")}, {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="h-4 w-[1px] bg-white/20 hidden md:block" />
          <div className="flex items-center gap-2">
            <span className="text-blue-200 hidden sm:inline">Usuário:</span>
            <span className="font-semibold text-white">
              {currentUser?.name || "Administrador"}
            </span>
            {isAdmin && (
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Admin
              </span>
            )}
          </div>
        </div>
      </header>

      {isDemoMode && (
        <div className="flex flex-wrap items-center justify-center gap-2 bg-[#00529b] px-3 py-1 text-center text-xs font-medium text-white/95 border-b border-blue-900/30">
          <AlertTriangle size={13} className="text-amber-300" />
          Modo demonstração: os dados ficam salvos no seu navegador.
          <button
            type="button"
            onClick={resetDemoData}
            className="flex items-center gap-1 rounded bg-white/15 px-2 py-0.5 text-[11px] font-semibold hover:bg-white/25 transition-colors"
          >
            <RotateCcw size={11} />
            Restaurar dados Hapvida
          </button>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          view={filters.view}
          onSelectView={(view) => setFilters((prev) => ({ ...prev, view }))}
          counts={counts}
          page={page}
          onSelectPage={setPage}
          teams={teams}
          currentTeam={currentTeam}
          onSwitchTeam={switchTeam}
          onCreateTeam={createTeam}
          onOpenAdmin={() => setAdminOpen(true)}
          isAdmin={isAdmin}
          onOpenAdminUsers={() => setAdminUsersOpen(true)}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />
        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      </div>
      <p className="sr-only" aria-live="polite">
        {visibleTasks.length} tarefas visíveis
      </p>

      {currentTeam && currentUser && (
        <AdminPanel
          team={currentTeam}
          members={members}
          currentUserId={currentUser.id}
          open={adminOpen}
          onOpenChange={setAdminOpen}
          onMembersChanged={refreshMembers}
        />
      )}

      {currentUser && (
        <AdminUsersPanel
          currentUserId={currentUser.id}
          actor={currentUser}
          open={adminUsersOpen}
          onOpenChange={setAdminUsersOpen}
        />
      )}
    </div>
  );
}
