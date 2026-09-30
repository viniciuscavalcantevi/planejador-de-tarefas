import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  CreateTaskInput,
  Profile,
  Task,
  TaskFilterState,
  UpdateTaskInput,
  Workspace,
  WorkspaceMember,
} from "../types";
import { DEFAULT_FILTERS } from "../types";
import { repository, type AuthUser } from "../services";
import { applyCheckboxChange, filterTasks } from "../lib/taskRules";
import { useToast } from "./ToastContext";

export type AppPage = "tarefas" | "relatorio" | "usuarios";

interface AppStoreValue {
  loading: boolean;
  loadError: string | null;
  reload: () => Promise<void>;
  refreshMembers: () => Promise<void>;

  currentUser: AuthUser | null;
  isAdmin: boolean;
  members: WorkspaceMember[];
  workspaceId: string | null;

  teams: Workspace[];
  currentTeam: Workspace | null;
  switchTeam: (teamId: string) => Promise<void>;
  createTeam: (name: string) => Promise<Workspace | null>;

  page: AppPage;
  setPage: (page: AppPage) => void;

  tasks: Task[];
  visibleTasks: Task[];

  filters: TaskFilterState;
  setFilters: (updater: (prev: TaskFilterState) => TaskFilterState) => void;
  clearFilters: () => void;

  selectedTaskId: string | null;
  openTaskDetails: (taskId: string) => void;
  closeTaskDetails: () => void;

  createTask: (input: CreateTaskInput) => Promise<Task | null>;
  updateTask: (taskId: string, input: UpdateTaskInput) => Promise<boolean>;
  toggleComplete: (task: Task, checked: boolean) => Promise<void>;
  duplicateTask: (task: Task) => Promise<void>;
  deleteTask: (task: Task) => Promise<void>;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function useAppStore(): AppStoreValue {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore deve ser usado dentro de AppStoreProvider");
  return ctx;
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [teams, setTeams] = useState<Workspace[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [page, setPage] = useState<AppPage>("tarefas");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filters, setFiltersState] = useState<TaskFilterState>(DEFAULT_FILTERS);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const loadTeamData = useCallback(async (teamId: string) => {
    const [memberList, taskList] = await Promise.all([
      repository.listMembers(teamId),
      repository.listTasks(teamId),
    ]);
    setMembers(memberList);
    setTasks(taskList);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const user = await repository.getCurrentUser();
      setCurrentUser(user);
      const myTeams = await repository.listMyTeams();
      setTeams(myTeams);
      const firstTeamId = myTeams[0]?.id ?? null;
      setWorkspaceId(firstTeamId);
      if (firstTeamId) await loadTeamData(firstTeamId);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Não foi possível carregar as tarefas.");
    } finally {
      setLoading(false);
    }
  }, [loadTeamData]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshMembers = useCallback(async () => {
    if (!workspaceId) return;
    setMembers(await repository.listMembers(workspaceId));
  }, [workspaceId]);

  const switchTeam = useCallback(
    async (teamId: string) => {
      if (teamId === workspaceId) return;
      setLoading(true);
      setLoadError(null);
      setSelectedTaskId(null);
      try {
        setWorkspaceId(teamId);
        await loadTeamData(teamId);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Não foi possível carregar este time.");
      } finally {
        setLoading(false);
      }
    },
    [workspaceId, loadTeamData]
  );

  const actorProfile: Profile = useMemo(
    () => ({ id: currentUser?.id ?? "", name: currentUser?.name ?? "" }),
    [currentUser]
  );

  const createTeam = useCallback(
    async (name: string): Promise<Workspace | null> => {
      try {
        const team = await repository.createTeam(name, actorProfile);
        setTeams((prev) => [...prev, team]);
        showToast({ title: "Time criado" });
        await switchTeam(team.id);
        return team;
      } catch (err) {
        showToast({
          title: "Não foi possível criar o time",
          description: err instanceof Error ? err.message : undefined,
          variant: "error",
        });
        return null;
      }
    },
    [actorProfile, showToast, switchTeam]
  );

  const setFilters = useCallback((updater: (prev: TaskFilterState) => TaskFilterState) => {
    setFiltersState((prev) => updater(prev));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState((prev) => ({ ...DEFAULT_FILTERS, view: prev.view }));
  }, []);

  const visibleTasks = useMemo(
    () => filterTasks(tasks, filters, currentUser?.id ?? ""),
    [tasks, filters, currentUser]
  );

  const currentTeam = useMemo(
    () => teams.find((t) => t.id === workspaceId) ?? null,
    [teams, workspaceId]
  );

  const createTask = useCallback(
    async (input: CreateTaskInput): Promise<Task | null> => {
      if (!workspaceId) return null;
      try {
        const task = await repository.createTask(workspaceId, input, actorProfile);
        setTasks((prev) => [task, ...prev]);
        const wouldBeHidden = filterTasks([task], filters, currentUser?.id ?? "").length === 0;
        showToast({
          title: "Tarefa criada",
          description: wouldBeHidden
            ? "A nova tarefa está oculta pelos filtros atuais."
            : undefined,
        });
        return task;
      } catch (err) {
        showToast({
          title: "Não foi possível criar a tarefa",
          description: err instanceof Error ? err.message : undefined,
          variant: "error",
        });
        return null;
      }
    },
    [workspaceId, actorProfile, filters, currentUser, showToast]
  );

  const updateTask = useCallback(
    async (taskId: string, input: UpdateTaskInput): Promise<boolean> => {
      const previous = tasks.find((t) => t.id === taskId);
      if (!previous) return false;
      const optimistic: Task = { ...previous, ...input };
      setTasks((prev) => prev.map((t) => (t.id === taskId ? optimistic : t)));
      try {
        const saved = await repository.updateTask(taskId, input, actorProfile);
        setTasks((prev) => prev.map((t) => (t.id === taskId ? saved : t)));
        return true;
      } catch (err) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? previous : t)));
        showToast({
          title: "Não foi possível salvar a alteração",
          description: err instanceof Error ? err.message : undefined,
          variant: "error",
        });
        return false;
      }
    },
    [tasks, actorProfile, showToast]
  );

  const toggleComplete = useCallback(
    async (task: Task, checked: boolean) => {
      const applied = applyCheckboxChange(task, checked);
      const ok = await updateTask(task.id, applied);
      if (!ok) return;
      showToast({
        title: checked ? "Tarefa concluída" : "Tarefa reaberta",
        action: {
          label: "Desfazer",
          onClick: () => {
            const reverted = applyCheckboxChange(
              { status: applied.status, completedDate: applied.completedDate },
              !checked
            );
            updateTask(task.id, reverted);
          },
        },
      });
    },
    [updateTask, showToast]
  );

  const duplicateTask = useCallback(
    async (task: Task) => {
      try {
        const copy = await repository.duplicateTask(task.id, actorProfile);
        setTasks((prev) => [copy, ...prev]);
        showToast({ title: "Tarefa duplicada" });
      } catch (err) {
        showToast({
          title: "Não foi possível duplicar a tarefa",
          description: err instanceof Error ? err.message : undefined,
          variant: "error",
        });
      }
    },
    [actorProfile, showToast]
  );

  const deleteTask = useCallback(
    async (task: Task) => {
      const previous = tasks;
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      try {
        await repository.deleteTask(task.id, actorProfile);
        showToast({ title: "Tarefa excluída" });
        if (selectedTaskId === task.id) setSelectedTaskId(null);
      } catch (err) {
        setTasks(previous);
        showToast({
          title: "Não foi possível excluir a tarefa",
          description: err instanceof Error ? err.message : undefined,
          variant: "error",
        });
      }
    },
    [tasks, actorProfile, showToast, selectedTaskId]
  );

  const value: AppStoreValue = {
    loading,
    loadError,
    reload: load,
    refreshMembers,
    currentUser,
    isAdmin: currentUser?.isAdmin ?? false,
    members,
    workspaceId,
    teams,
    currentTeam,
    switchTeam,
    createTeam,
    page,
    setPage,
    tasks,
    visibleTasks,
    filters,
    setFilters,
    clearFilters,
    selectedTaskId,
    openTaskDetails: setSelectedTaskId,
    closeTaskDetails: () => setSelectedTaskId(null),
    createTask,
    updateTask,
    toggleComplete,
    duplicateTask,
    deleteTask,
  };

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}
