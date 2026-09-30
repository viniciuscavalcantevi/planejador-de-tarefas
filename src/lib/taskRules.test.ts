import { describe, expect, it } from "vitest";
import {
  addDaysToDateOnly,
  applyCheckboxChange,
  applyStatusChange,
  filterTasks,
  isImportant,
  isOverdue,
  todayDateOnly,
  validateAssigneeIds,
  validateTaskDates,
} from "./taskRules";
import type { Task, TaskFilterState } from "../types";
import { DEFAULT_FILTERS } from "../types";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    workspaceId: "ws1",
    title: "Tarefa de teste",
    description: null,
    source: "manual",
    priority: "media",
    status: "nao_iniciado",
    assigneeIds: [],
    startDate: null,
    dueDate: null,
    completedDate: null,
    createdBy: "user1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("applyStatusChange / applyCheckboxChange", () => {
  it("marca como concluído e preenche a data fim ao concluir", () => {
    const result = applyStatusChange({ status: "nao_iniciado", completedDate: null }, "concluido");
    expect(result.status).toBe("concluido");
    expect(result.completedDate).toBe(todayDateOnly());
  });

  it("limpa a data fim ao reabrir uma tarefa concluída", () => {
    const result = applyStatusChange(
      { status: "concluido", completedDate: "2026-01-01" },
      "em_andamento"
    );
    expect(result.status).toBe("em_andamento");
    expect(result.completedDate).toBeNull();
  });

  it("checkbox marcado e status concluído nunca ficam inconsistentes", () => {
    const checked = applyCheckboxChange({ status: "nao_iniciado", completedDate: null }, true);
    expect(checked.status).toBe("concluido");
    const unchecked = applyCheckboxChange({ status: "concluido", completedDate: "2026-01-01" }, false);
    expect(unchecked.status).toBe("nao_iniciado");
    expect(unchecked.completedDate).toBeNull();
  });

  it("preserva a data fim original se a tarefa já estava concluída", () => {
    const result = applyStatusChange(
      { status: "concluido", completedDate: "2026-01-05" },
      "concluido"
    );
    expect(result.completedDate).toBe("2026-01-05");
  });
});

describe("isOverdue", () => {
  it("considera atrasada uma tarefa pendente com prazo no passado", () => {
    const past = addDaysToDateOnly(todayDateOnly(), -1);
    expect(isOverdue(past, "nao_iniciado")).toBe(true);
    expect(isOverdue(past, "em_andamento")).toBe(true);
  });

  it("tarefas concluídas nunca aparecem como atrasadas", () => {
    const past = addDaysToDateOnly(todayDateOnly(), -5);
    expect(isOverdue(past, "concluido")).toBe(false);
  });

  it("tarefas sem prazo não são atrasadas", () => {
    expect(isOverdue(null, "nao_iniciado")).toBe(false);
  });

  it("tarefas com prazo futuro não são atrasadas", () => {
    const future = addDaysToDateOnly(todayDateOnly(), 3);
    expect(isOverdue(future, "nao_iniciado")).toBe(false);
  });
});

describe("isImportant", () => {
  it("alta e urgente são importantes", () => {
    expect(isImportant("alta")).toBe(true);
    expect(isImportant("urgente")).toBe(true);
  });
  it("baixa e média não são importantes", () => {
    expect(isImportant("baixa")).toBe(false);
    expect(isImportant("media")).toBe(false);
  });
});

describe("validateAssigneeIds", () => {
  it("aceita até 3 responsáveis", () => {
    expect(validateAssigneeIds(["a", "b", "c"])).toBeNull();
  });

  it("rejeita mais de 3 responsáveis", () => {
    expect(validateAssigneeIds(["a", "b", "c", "d"])).not.toBeNull();
  });

  it("rejeita responsável duplicado", () => {
    expect(validateAssigneeIds(["a", "a"])).not.toBeNull();
  });

  it("aceita lista vazia (sem responsável)", () => {
    expect(validateAssigneeIds([])).toBeNull();
  });
});

describe("validateTaskDates", () => {
  it("rejeita data prevista anterior à data de início", () => {
    const error = validateTaskDates({ startDate: "2026-02-10", dueDate: "2026-02-05" });
    expect(error).not.toBeNull();
  });

  it("rejeita data fim anterior à data de início", () => {
    const error = validateTaskDates({ startDate: "2026-02-10", completedDate: "2026-02-05" });
    expect(error).not.toBeNull();
  });

  it("aceita datas coerentes", () => {
    const error = validateTaskDates({ startDate: "2026-02-01", dueDate: "2026-02-10" });
    expect(error).toBeNull();
  });
});

describe("filterTasks", () => {
  const me = "user-me";
  const tasks = [
    makeTask({ id: "a", title: "Tarefa A", assigneeIds: [me], priority: "urgente", dueDate: "2026-01-10" }),
    makeTask({ id: "b", title: "Tarefa B", assigneeIds: ["outro"], priority: "baixa", dueDate: null }),
    makeTask({ id: "c", title: "Tarefa concluída", assigneeIds: [me, "outro"], status: "concluido", priority: "media" }),
  ];

  it("view 'minhas' mostra apenas tarefas do usuário atual", () => {
    const filters: TaskFilterState = { ...DEFAULT_FILTERS, view: "minhas" };
    const result = filterTasks(tasks, filters, me);
    expect(result.map((t) => t.id).sort()).toEqual(["a", "c"]);
  });

  it("view 'importantes' mostra apenas prioridade alta/urgente", () => {
    const filters: TaskFilterState = { ...DEFAULT_FILTERS, view: "importantes" };
    const result = filterTasks(tasks, filters, me);
    expect(result.map((t) => t.id)).toEqual(["a"]);
  });

  it("view 'planejadas' mostra apenas tarefas com prazo", () => {
    const filters: TaskFilterState = { ...DEFAULT_FILTERS, view: "planejadas" };
    const result = filterTasks(tasks, filters, me);
    expect(result.map((t) => t.id)).toEqual(["a"]);
  });

  it("busca combinada com filtro de prioridade", () => {
    const filters: TaskFilterState = {
      ...DEFAULT_FILTERS,
      search: "tarefa a",
      priority: ["urgente"],
    };
    const result = filterTasks(tasks, filters, me);
    expect(result.map((t) => t.id)).toEqual(["a"]);
  });

  it("showCompleted=false oculta tarefas concluídas fora da view 'concluidas'", () => {
    const filters: TaskFilterState = { ...DEFAULT_FILTERS, showCompleted: false };
    const result = filterTasks(tasks, filters, me);
    expect(result.some((t) => t.status === "concluido")).toBe(false);
  });
});
