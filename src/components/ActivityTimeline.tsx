import type { ActivityEntry } from "../types";
import { PRIORITY_LABELS, STATUS_LABELS } from "../lib/taskLabels";

interface ActivityTimelineProps {
  entries: ActivityEntry[];
}

function describe(entry: ActivityEntry): string {
  switch (entry.action) {
    case "created":
      return "criou a tarefa";
    case "status_changed": {
      const to = entry.changes?.status?.to as string | undefined;
      return to ? `alterou o status para "${STATUS_LABELS[to as keyof typeof STATUS_LABELS] ?? to}"` : "alterou o status";
    }
    case "priority_changed": {
      const to = entry.changes?.priority?.to as string | undefined;
      return to ? `alterou a prioridade para "${PRIORITY_LABELS[to as keyof typeof PRIORITY_LABELS] ?? to}"` : "alterou a prioridade";
    }
    case "attachment_added": {
      const name = entry.changes?.fileName?.to as string | undefined;
      return name ? `anexou "${name}"` : "adicionou um anexo";
    }
    case "attachment_removed": {
      const name = entry.changes?.fileName?.from as string | undefined;
      return name ? `removeu o anexo "${name}"` : "removeu um anexo";
    }
    case "comment_added":
      return "publicou um comentário";
    case "field_changed":
      return "atualizou um campo";
    default:
      return "atualizou a tarefa";
  }
}

export function ActivityTimeline({ entries }: ActivityTimelineProps) {
  return (
    <ol className="flex flex-col gap-2.5 border-l border-border pl-4">
      {entries.map((entry) => (
        <li key={entry.id} className="relative text-sm">
          <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-border-strong" />
          <span className="text-text">
            <strong className="font-medium">{entry.actor?.name ?? "Alguém"}</strong> {describe(entry)}
          </span>
          <p className="text-xs text-text-subtle">
            {new Date(entry.createdAt).toLocaleString("pt-BR")}
          </p>
        </li>
      ))}
      {entries.length === 0 && <li className="text-sm text-text-subtle">Sem histórico ainda.</li>}
    </ol>
  );
}
