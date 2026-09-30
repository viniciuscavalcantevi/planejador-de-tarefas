import { AlertTriangle, CalendarClock, CheckCircle2, ClipboardList, Clock } from "lucide-react";
import type { Task, TaskPriority, TaskStatus, WorkspaceMember } from "../types";
import { PRIORITY_DOT_CLASS, PRIORITY_LABELS, STATUS_LABELS } from "../lib/taskLabels";
import { isOverdue } from "../lib/taskRules";
import { cn, initials } from "../lib/utils";

interface ReportViewProps {
  tasks: Task[];
  members: WorkspaceMember[];
}

const STATUS_ORDER: TaskStatus[] = ["nao_iniciado", "em_andamento", "concluido"];
const PRIORITY_ORDER: TaskPriority[] = ["urgente", "alta", "media", "baixa"];

const STATUS_BAR_CLASS: Record<TaskStatus, string> = {
  nao_iniciado: "bg-text-subtle",
  em_andamento: "bg-accent-500",
  concluido: "bg-success-500",
};

export function ReportView({ tasks, members }: ReportViewProps) {
  const total = tasks.length;
  const concluidas = tasks.filter((t) => t.status === "concluido").length;
  const emAndamento = tasks.filter((t) => t.status === "em_andamento").length;
  const atrasadas = tasks.filter((t) => isOverdue(t.dueDate, t.status)).length;
  const semPrazo = tasks.filter((t) => !t.dueDate).length;

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

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      <h1 className="text-lg font-semibold text-text">Relatório</h1>
      <p className="mb-4 text-sm text-text-muted">Visão geral simples das tarefas deste time.</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile icon={<ClipboardList size={16} />} label="Total" value={total} />
        <StatTile icon={<Clock size={16} />} label="Em andamento" value={emAndamento} />
        <StatTile icon={<CheckCircle2 size={16} />} label="Concluídas" value={concluidas} tone="success" />
        <StatTile icon={<AlertTriangle size={16} />} label="Atrasadas" value={atrasadas} tone="danger" />
        <StatTile icon={<CalendarClock size={16} />} label="Sem prazo" value={semPrazo} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-text">Tarefas por status</h2>
          <div className="flex flex-col gap-2.5">
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

        <section className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-text">Tarefas por prioridade</h2>
          <div className="flex flex-col gap-2.5">
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
  value: number;
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
