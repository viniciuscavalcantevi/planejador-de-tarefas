import type {
  ActivityEntry,
  Attachment,
  Comment,
  Profile,
  Task,
  Workspace,
  WorkspaceMember,
} from "../types";
import { addDaysToDateOnly, todayDateOnly } from "../lib/taskRules";

import { ADMIN_USER_PERMISSIONS } from "../types";

export const DEMO_WORKSPACE_ID = "ws-demo-1";
export const DEMO_USER_ID = "user-demo-admin";

export const DEMO_PROFILES: Profile[] = [
  {
    id: DEMO_USER_ID,
    name: "Administrador",
    matricula: "000000",
    login: "admin",
    email: "admin@hapvida.com.br",
    operations: ["TODAS"],
    active: true,
    isAdmin: true,
    permissions: ADMIN_USER_PERMISSIONS,
  },
];

export function buildDemoWorkspaces(): Workspace[] {
  return [
    {
      id: DEMO_WORKSPACE_ID,
      name: "Time de Demonstração",
      createdBy: DEMO_USER_ID,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
  ];
}

export function buildDemoMembers(): WorkspaceMember[] {
  return DEMO_PROFILES.map((p, i) => ({
    workspaceId: DEMO_WORKSPACE_ID,
    userId: p.id,
    role: i === 0 ? "owner" : "member",
    profile: p,
  }));
}

function iso(daysOffset = 0): string {
  return new Date(Date.now() + daysOffset * 86400000).toISOString();
}

export function buildDemoTasks(): Task[] {
  const today = todayDateOnly();
  const t = (days: number) => addDaysToDateOnly(today, days);

  const rows: Array<Partial<Task> & Pick<Task, "title">> = [
    {
      title: "Revisar proposta comercial do cliente Aurora",
      description: "<p>Conferir valores e condições de pagamento antes do envio.</p>",
      priority: "urgente",
      status: "em_andamento",
      source: "email",
      assigneeIds: [DEMO_USER_ID],
      dueDate: t(-2),
    },
    {
      title: "Preparar apresentação do planejamento trimestral",
      priority: "alta",
      status: "nao_iniciado",
      source: "manual",
      assigneeIds: [],
      dueDate: t(0),
    },
    {
      title: "Enviar relatório de atividades para a diretoria",
      priority: "alta",
      status: "nao_iniciado",
      source: "email",
      assigneeIds: [DEMO_USER_ID],
      dueDate: t(1),
    },
    {
      title: "Atualizar cadastro de fornecedores homologados",
      priority: "media",
      status: "em_andamento",
      source: "equipe",
      assigneeIds: [DEMO_USER_ID],
      dueDate: t(5),
    },
    {
      title: "Organizar arquivos do projeto no repositório compartilhado",
      priority: "baixa",
      status: "nao_iniciado",
      source: "manual",
      assigneeIds: [],
      dueDate: null,
    },
    {
      title: "Responder aos comentários da revisão de contrato enviados pelo jurídico na sexta-feira",
      priority: "media",
      status: "nao_iniciado",
      source: "email",
      assigneeIds: [],
      dueDate: t(-1),
    },
    {
      title: "Marcar reunião de alinhamento semanal",
      priority: "baixa",
      status: "concluido",
      source: "manual",
      assigneeIds: [DEMO_USER_ID],
      dueDate: t(-3),
      completedDate: t(-3),
    },
    {
      title: "Validar orçamento do novo escritório",
      priority: "media",
      status: "nao_iniciado",
      source: "equipe",
      assigneeIds: [],
      dueDate: t(10),
    },
    {
      title: "Testar fluxo do planejador",
      priority: "baixa",
      status: "nao_iniciado",
      source: "manual",
      assigneeIds: [],
      dueDate: null,
    },
    {
      title: "Consolidar feedback dos clientes sobre a nova versão do produto",
      priority: "urgente",
      status: "em_andamento",
      source: "email",
      assigneeIds: [DEMO_USER_ID],
      dueDate: t(0),
    },
    {
      title: "Arquivar tarefas concluídas do último trimestre",
      priority: "baixa",
      status: "concluido",
      source: "manual",
      assigneeIds: [],
      dueDate: t(-10),
      completedDate: t(-9),
    },
    {
      title: "Agendar treinamento da equipe sobre a nova ferramenta",
      priority: "media",
      status: "nao_iniciado",
      source: "equipe",
      assigneeIds: [DEMO_USER_ID],
      dueDate: t(3),
    },
  ];

  return rows.map((r, i) => {
    const createdAt = iso(-rows.length + i);
    return {
      id: `task-demo-${i + 1}`,
      workspaceId: DEMO_WORKSPACE_ID,
      title: r.title,
      description: r.description ?? null,
      source: r.source ?? "manual",
      priority: r.priority ?? "media",
      status: r.status ?? "nao_iniciado",
      assigneeIds: r.assigneeIds ?? [],
      startDate: null,
      dueDate: r.dueDate ?? null,
      completedDate: r.completedDate ?? null,
      createdBy: DEMO_USER_ID,
      createdAt,
      updatedAt: createdAt,
    };
  });
}

export function buildDemoComments(): Comment[] {
  return [
    {
      id: "comment-demo-1",
      taskId: "task-demo-1",
      authorId: DEMO_USER_ID,
      body: "Proposta em análise inicial.",
      createdAt: iso(-1),
    },
  ];
}

export function buildDemoAttachments(): Attachment[] {
  return [];
}

export function buildDemoActivity(tasks: Task[]): ActivityEntry[] {
  return tasks.map((t, i) => ({
    id: `activity-demo-${i + 1}`,
    taskId: t.id,
    actorId: t.createdBy,
    action: "created",
    changes: null,
    createdAt: t.createdAt,
  }));
}
