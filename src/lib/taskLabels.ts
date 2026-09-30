import type { TaskPriority, TaskSource, TaskStatus } from "../types";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  nao_iniciado: "Não iniciado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

export const PRIORITY_DOT_CLASS: Record<TaskPriority, string> = {
  baixa: "bg-success-400",
  media: "bg-success-500",
  alta: "bg-danger-500",
  urgente: "bg-danger-600",
};

export const PRIORITY_TEXT_CLASS: Record<TaskPriority, string> = {
  baixa: "text-success-500",
  media: "text-success-500",
  alta: "text-danger-500",
  urgente: "text-danger-600",
};

export const SOURCE_LABELS: Record<TaskSource, { short: string; full: string }> = {
  email: { short: "ES", full: "Emails sinalizados" },
  manual: { short: "MN", full: "Manual" },
  equipe: { short: "EQ", full: "Equipe" },
};
