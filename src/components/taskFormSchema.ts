import { z } from "zod";
import { MAX_TASK_ASSIGNEES } from "../types";

export const taskFormSchema = z
  .object({
    title: z.string().trim().min(1, "O nome da tarefa é obrigatório."),
    status: z.enum(["nao_iniciado", "em_andamento", "concluido"]),
    priority: z.enum(["baixa", "media", "alta", "urgente"]),
    source: z.enum(["email", "manual", "equipe"]),
    assigneeIds: z.array(z.string()).max(MAX_TASK_ASSIGNEES, `Máximo de ${MAX_TASK_ASSIGNEES} responsáveis por tarefa.`),
    startDate: z.string().nullable(),
    dueDate: z.string().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.dueDate && data.dueDate < data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A data prevista não pode ser anterior à data de início.",
        path: ["dueDate"],
      });
    }
  });

export type TaskFormValues = z.infer<typeof taskFormSchema>;
