import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ListChecks,
  ListTodo,
  ShieldCheck,
  Settings,
  Star,
  Users,
  X,
} from "lucide-react";
import type { TaskFilterState, Workspace } from "../types";
import { cn } from "../lib/utils";
import { TeamSwitcher } from "./TeamSwitcher";
import type { AppPage } from "../store/AppStore";

interface SidebarProps {
  view: TaskFilterState["view"];
  onSelectView: (view: TaskFilterState["view"]) => void;
  counts: Record<TaskFilterState["view"], number>;
  page: AppPage;
  onSelectPage: (page: AppPage) => void;
  teams: Workspace[];
  currentTeam: Workspace | null;
  onSwitchTeam: (teamId: string) => void;
  onCreateTeam: (name: string) => Promise<unknown>;
  onOpenAdmin: () => void;
  isAdmin: boolean;
  onOpenAdminUsers: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const ITEMS: Array<{ id: TaskFilterState["view"]; label: string; icon: typeof ListTodo }> = [
  { id: "todas", label: "Todas as tarefas", icon: ListTodo },
  { id: "minhas", label: "Minhas tarefas", icon: ListChecks },
  { id: "importantes", label: "Importantes", icon: Star },
  { id: "planejadas", label: "Planejadas", icon: CalendarClock },
  { id: "concluidas", label: "Concluídas", icon: CheckCircle2 },
];

export function Sidebar({
  view,
  onSelectView,
  counts,
  page,
  onSelectPage,
  teams,
  currentTeam,
  onSwitchTeam,
  onCreateTeam,
  onOpenAdmin,
  isAdmin,
  onOpenAdminUsers,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const content = (
    <div className="flex h-full flex-col">
      {/* Hapvida Logo Brand Header */}
      <div className="flex items-center gap-2.5 border-b border-border bg-white px-3.5 py-3">
        <img
          src="/images/Hapvida_novo.png"
          alt="Hapvida"
          className="h-7 w-auto object-contain"
        />
        <div className="flex flex-col border-l border-gray-200 pl-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0066CC]">Planner</span>
          <span className="text-[9px] text-gray-400 font-medium leading-none">Gestão de Equipes</span>
        </div>
      </div>

      <div className="p-2">
        <TeamSwitcher
          teams={teams}
          currentTeam={currentTeam}
          onSwitch={(id) => {
            onSwitchTeam(id);
            onCloseMobile?.();
          }}
          onCreate={onCreateTeam}
          canCreate={isAdmin}
        />
      </div>

      <nav aria-label="Navegação e tarefas" className="flex flex-1 flex-col gap-0.5 p-2 pt-0">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Navegação
        </div>

        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = page === "tarefas" && view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectPage("tarefas");
                onSelectView(item.id);
                onCloseMobile?.();
              }}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                active
                  ? "bg-[#0066CC] text-white shadow-xs"
                  : "text-text-muted hover:bg-black/[0.03] hover:text-text"
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              <span className={cn("text-xs", active ? "text-blue-100" : "text-text-subtle")}>
                {counts[item.id]}
              </span>
            </button>
          );
        })}

        <div className="my-2 border-t border-border" />

        <button
          type="button"
          onClick={() => {
            onSelectPage("relatorio");
            onCloseMobile?.();
          }}
          aria-current={page === "relatorio" ? "page" : undefined}
          className={cn(
            "flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
            page === "relatorio"
              ? "bg-[#0066CC] text-white shadow-xs"
              : "text-text-muted hover:bg-black/[0.03] hover:text-text"
          )}
        >
          <BarChart3 size={16} className="shrink-0" />
          <span className="flex-1 truncate">Relatório</span>
        </button>

        {/* Cadastro de Usuários */}
        <button
          type="button"
          onClick={() => {
            onSelectPage("usuarios");
            onCloseMobile?.();
          }}
          aria-current={page === "usuarios" ? "page" : undefined}
          className={cn(
            "flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
            page === "usuarios"
              ? "bg-[#0066CC] text-white shadow-xs"
              : "text-text-muted hover:bg-black/[0.03] hover:text-text"
          )}
        >
          <Users size={16} className="shrink-0" />
          <div className="flex flex-col flex-1 truncate">
            <span className="truncate leading-tight">Usuários</span>
            <span
              className={cn(
                "text-[10px]",
                page === "usuarios" ? "text-blue-100" : "text-text-subtle"
              )}
            >
              Cadastro de usuários
            </span>
          </div>
          {isAdmin && (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                page === "usuarios" ? "bg-white/20 text-white" : "bg-blue-50 text-[#0066CC]"
              )}
            >
              Admin
            </span>
          )}
        </button>
      </nav>

      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={() => {
            onOpenAdmin();
            onCloseMobile?.();
          }}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-text-muted transition-colors hover:bg-black/[0.03] hover:text-text"
        >
          <Settings size={16} className="shrink-0" />
          Administrar time
        </button>
        {isAdmin && (
          <button
            type="button"
            onClick={() => {
              onOpenAdminUsers();
              onCloseMobile?.();
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-text-muted transition-colors hover:bg-black/[0.03] hover:text-text"
          >
            <ShieldCheck size={16} className="shrink-0" />
            Administradores
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r border-border bg-surface md:block">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={onCloseMobile} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-surface shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-border p-3">
              <span className="text-sm font-semibold">Navegação</span>
              <button
                type="button"
                aria-label="Fechar navegação"
                onClick={onCloseMobile}
                className="rounded p-1 hover:bg-black/5"
              >
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{content}</div>
          </div>
        </div>
      )}
    </>
  );
}
