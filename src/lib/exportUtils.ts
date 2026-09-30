import type { Profile, Task } from "../types";
import { PRESET_TAGS } from "../types";
import { PRIORITY_LABELS, STATUS_LABELS } from "./taskLabels";

export function exportTasksToCSV(tasks: Task[], members: { userId: string; profile: Profile }[]) {
  const headers = [
    "ID",
    "Título",
    "Status",
    "Prioridade",
    "Responsáveis",
    "Data Início",
    "Data Prevista",
    "Data Conclusão",
    "Checklist Concluído",
    "Checklist Total",
    "Etiquetas",
    "Criado em",
  ];

  const rows = tasks.map((task) => {
    const assigneeNames = task.assigneeIds
      .map((id) => members.find((m) => m.userId === id)?.profile.name || id)
      .join("; ");

    const completedChecklist = (task.checklist || []).filter((i) => i.completed).length;
    const totalChecklist = (task.checklist || []).length;

    const tagNames = (task.tags || [])
      .map((tagId) => PRESET_TAGS.find((p) => p.id === tagId)?.name || tagId)
      .join("; ");

    return [
      task.id,
      task.title,
      STATUS_LABELS[task.status],
      PRIORITY_LABELS[task.priority],
      assigneeNames,
      task.startDate || "",
      task.dueDate || "",
      task.completedDate || "",
      completedChecklist,
      totalChecklist,
      tagNames,
      task.createdAt ? new Date(task.createdAt).toLocaleDateString("pt-BR") : "",
    ];
  });

  const csvContent =
    "\uFEFF" + // UTF-8 BOM para garantir acentuação correta no Microsoft Excel
    [headers, ...rows]
      .map((row) =>
        row
          .map((field) => {
            const str = String(field ?? "").replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(";")
      )
      .join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `planejador_tarefas_hapvida_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
