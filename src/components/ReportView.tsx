import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  PieChart,
  TrendingUp,
} from "lucide-react";
import type { Task, TaskPriority, TaskStatus, WorkspaceMember } from "../types";
import { PRIORITY_DOT_CLASS, PRIORITY_LABELS, STATUS_LABELS } from "../lib/taskLabels";
import { isOverdue } from "../lib/taskRules";
import { cn, initials } from "../lib/utils";
import { exportTasksToCSV } from "../lib/exportUtils";

interface ReportViewProps {
  tasks: Task[];
  members: WorkspaceMember[];
}

const STATUS_ORDER: TaskStatus[] = ["nao_iniciado", "em_andamento", "concluido"];
const PRIORITY_ORDER: TaskPriority[] = ["urgente", "alta", "media", "baixa"];

const STATUS_BAR_CLASS: Record<TaskStatus, string> = {
  nao_iniciado: "bg-slate-400",
  em_andamento: "bg-[#0066cc]",
  concluido: "bg-emerald-600",
};

export function ReportView({ tasks, members }: ReportViewProps) {
  const total = tasks.length;
  const concluidas = tasks.filter((t) => t.status === "concluido").length;
  const emAndamento = tasks.filter((t) => t.status === "em_andamento").length;
  const naoIniciado = tasks.filter((t) => t.status === "nao_iniciado").length;
  const atrasadas = tasks.filter((t) => isOverdue(t.dueDate, t.status)).length;

  const taxaConclusao = total > 0 ? Math.round((concluidas / total) * 100) : 0;
  const noPrazo = concluidas - tasks.filter((t) => t.status === "concluido" && t.dueDate && t.completedDate && t.completedDate > t.dueDate).length;
  const taxaSLA = concluidas > 0 ? Math.round((noPrazo / concluidas) * 100) : 100;

  const byStatus = STATUS_ORDER.map((status) => ({
    status,
    count: tasks.filter((t) => t.status === status).length,
  }));

  const byPriority = PRIORITY_ORDER.map((priority) => ({
    priority,
    count: tasks.filter((t) => t.priority === priority).length,
  }));

  const byMember = members
    .map((m) => {
      const memberTasks = tasks.filter((t) => t.assigneeIds.includes(m.userId));
      return {
        member: m,
        total: memberTasks.length,
        abertas: memberTasks.filter((t) => t.status !== "concluido").length,
        concluidas: memberTasks.filter((t) => t.status === "concluido").length,
      };
    })
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);

  const semResponsavel = tasks.filter((t) => t.assigneeIds.length === 0).length;

  // Cálculo para o gráfico Donut SVG
  const strokeDashoffsetTotal = 2 * Math.PI * 40; // raio 40
  const pctNaoIniciado = total > 0 ? naoIniciado / total : 0;
  const pctEmAndamento = total > 0 ? emAndamento / total : 0;
  const pctConcluido = total > 0 ? concluidas / total : 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/40">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Relatório e Indicadores</h1>
          <p className="text-xs text-gray-500">Métricas de desempenho, distribuição de demandas e SLA da equipe.</p>
        </div>
        <button
          type="button"
          onClick={() => exportTasksToCSV(tasks, members)}
          className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 transition-colors"
        >
          <Download size={14} className="text-[#0066CC]" />
          Exportar Planilha Excel (.csv)
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile icon={<ClipboardList size={16} />} label="Total" value={total} />
        <StatTile icon={<Clock size={16} />} label="Em andamento" value={emAndamento} />
        <StatTile icon={<CheckCircle2 size={16} />} label="Concluídas" value={concluidas} tone="success" />
        <StatTile icon={<AlertTriangle size={16} />} label="Atrasadas" value={atrasadas} tone="danger" />
        <StatTile icon={<TrendingUp size={16} />} label="Taxa de Conclusão" value={`${taxaConclusao}%`} tone="success" />
        <StatTile icon={<CalendarClock size={16} />} label="SLA no Prazo" value={`${taxaSLA}%`} />
      </div>

      {/* Gráfico Donut + Distribuição */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Donut Chart */}
        <section className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-5 shadow-2xs">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 self-start">
            <PieChart size={15} className="text-[#0066CC]" />
            Visão Geral de Status
          </h2>

          <div className="relative flex items-center justify-center">
            <svg width="150" height="150" viewBox="0 0 100 100" className="-rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#e2e8f0"
                strokeWidth="14"
              />
              {/* Concluído */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#16a34a"
                strokeWidth="14"
                strokeDasharray={`${pctConcluido * strokeDashoffsetTotal} ${strokeDashoffsetTotal}`}
                strokeDashoffset={0}
              />
              {/* Em andamento */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#0066cc"
                strokeWidth="14"
                strokeDasharray={`${pctEmAndamento * strokeDashoffsetTotal} ${strokeDashoffsetTotal}`}
                strokeDashoffset={`-${pctConcluido * strokeDashoffsetTotal}`}
              />
              {/* Não iniciado */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#94a3b8"
                strokeWidth="14"
                strokeDasharray={`${pctNaoIniciado * strokeDashoffsetTotal} ${strokeDashoffsetTotal}`}
                strokeDashoffset={`-${(pctConcluido + pctEmAndamento) * strokeDashoffsetTotal}`}
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-2xl font-bold text-gray-900 leading-none">{total}</span>
              <span className="block text-[10px] text-gray-400 font-medium uppercase mt-0.5">Tarefas</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
              <span className="text-gray-600">Concluídas ({concluidas})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#0066cc]" />
              <span className="text-gray-600">Em andamento ({emAndamento})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
              <span className="text-gray-600">Não iniciado ({naoIniciado})</span>
            </div>
          </div>
        </section>

        {/* Status em Barras */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-2xs">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">
            Distribuição por Status
          </h2>
          <div className="flex flex-col gap-3">
            {byStatus.map(({ status, count }) => (
              <BarRow
                key={status}
                label={STATUS_LABELS[status]}
                count={count}
                total={total}
                barClassName={STATUS_BAR_CLASS[status]}
              />
            ))}
          </div>
        </section>

        {/* Prioridades em Barras */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-2xs">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-500">
            Distribuição por Prioridade
          </h2>
          <div className="flex flex-col gap-3">
            {byPriority.map(({ priority, count }) => (
              <BarRow
                key={priority}
                label={PRIORITY_LABELS[priority]}
                count={count}
                total={total}
                barClassName={PRIORITY_DOT_CLASS[priority]}
              />
            ))}
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-text">Tarefas por responsável</h2>
        <ul className="flex flex-col gap-2">
          {byMember.map(({ member, total: memberTotal, abertas, concluidas: memberDone }) => (
            <li key={member.userId} className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-100 text-xs font-medium text-accent-700">
                {initials(member.profile.name)}
              </span>
              <span className="w-36 shrink-0 truncate text-sm text-text">{member.profile.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-app-bg">
                <div
                  className="h-full rounded-full bg-accent-500"
                  style={{ width: `${memberTotal === 0 ? 0 : (memberDone / memberTotal) * 100}%` }}
                />
              </div>
              <span className="w-28 shrink-0 text-right text-xs text-text-subtle">
                {abertas} abertas · {memberDone} concluídas
              </span>
            </li>
          ))}
          {byMember.length === 0 && (
            <li className="text-sm text-text-subtle">Nenhuma tarefa com responsável ainda.</li>
          )}
        </ul>
        {semResponsavel > 0 && (
          <p className="mt-3 text-xs text-text-subtle">
            {semResponsavel} {semResponsavel === 1 ? "tarefa está" : "tarefas estão"} sem responsável.
          </p>
        )}
      </section>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone?: "success" | "danger";
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div
        className={cn(
          "mb-1 flex items-center gap-1.5 text-xs font-medium",
          tone === "success" && "text-success-500",
          tone === "danger" && "text-danger-500",
          !tone && "text-text-subtle"
        )}
      >
        {icon}
        {label}
      </div>
      <p className="text-2xl font-semibold text-text">{value}</p>
    </div>
  );
}

function BarRow({
  label,
  count,
  total,
  barClassName,
}: {
  label: string;
  count: number;
  total: number;
  barClassName: string;
}) {
  const pct = total === 0 ? 0 : (count / total) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-sm text-text-muted">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-app-bg">
        <div className={cn("h-full rounded-full", barClassName)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 shrink-0 text-right text-xs text-text-subtle">{count}</span>
    </div>
  );
}
