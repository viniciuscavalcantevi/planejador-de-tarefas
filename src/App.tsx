import { AlertCircle, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { ToastProvider } from "./store/ToastContext";
import { AppStoreProvider, useAppStore } from "./store/AppStore";
import { AppLayout } from "./components/AppLayout";
import { TaskToolbar } from "./components/TaskToolbar";
import { TaskTable } from "./components/TaskTable";
import { TaskCardList } from "./components/TaskCard";
import { TaskDetailsDrawer } from "./components/TaskDetailsDrawer";
import { ReportView } from "./components/ReportView";
import { UserManagementView } from "./components/UserManagementView";
import { CalendarView } from "./components/CalendarView";
import { exportTasksToCSV } from "./lib/exportUtils";

function TaskWorkspace() {
  const {
    loading,
    loadError,
    reload,
    currentUser,
    members,
    tasks,
    visibleTasks,
    filters,
    setFilters,
    clearFilters,
    selectedTaskId,
    openTaskDetails,
    closeTaskDetails,
    createTask,
    updateTask,
    toggleComplete,
    duplicateTask,
    deleteTask,
    page,
  } = useAppStore();

  const [displayMode, setDisplayMode] = useState<"lista" | "calendario">("lista");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex-1 space-y-3 p-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-md bg-black/5" />
          ))}
        </div>
      </AppLayout>
    );
  }

  if (loadError) {
    return (
      <AppLayout>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertCircle size={32} className="text-danger-500" />
          <p className="text-sm text-text-muted">{loadError}</p>
          <button
            type="button"
            onClick={reload}
            className="rounded-md bg-accent-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-accent-600"
          >
            Tentar novamente
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {isOffline && (
        <div className="flex items-center justify-center gap-2 bg-warning-500/10 px-3 py-1.5 text-center text-xs font-medium text-warning-500">
          <WifiOff size={13} />
          Sem conexão com a internet. Algumas ações podem não ser salvas.
        </div>
      )}
      {page === "relatorio" ? (
        <ReportView tasks={tasks} members={members} />
      ) : page === "usuarios" ? (
        <UserManagementView
          currentUserId={currentUser?.id ?? ""}
          actor={
            currentUser
              ? { id: currentUser.id, name: currentUser.name, isAdmin: currentUser.isAdmin }
              : { id: "user-demo-admin", name: "Administrador", isAdmin: true }
          }
        />
      ) : (
        <>
          <TaskToolbar
            filters={filters}
            members={members}
            resultCount={visibleTasks.length}
            onChangeFilters={setFilters}
            onClearFilters={clearFilters}
            onNewTask={async () => {
              const task = await createTask({ title: "Nova tarefa" });
              if (task) openTaskDetails(task.id);
            }}
            displayMode={displayMode}
            onToggleDisplayMode={setDisplayMode}
            onExport={() => exportTasksToCSV(visibleTasks, members)}
          />

          {displayMode === "calendario" ? (
            <CalendarView
              tasks={visibleTasks}
              members={members}
              onOpenTask={openTaskDetails}
            />
          ) : (
            <>
              <TaskTable
                tasks={visibleTasks}
                members={members}
                hasAnyTasks={tasks.length > 0}
                filters={filters}
                onOpen={openTaskDetails}
                onToggleComplete={toggleComplete}
                onUpdate={(taskId, input) => updateTask(taskId, input)}
                onDuplicate={duplicateTask}
                onDelete={deleteTask}
                onCreate={createTask}
                onClearFilters={clearFilters}
              />
              <TaskCardList
                tasks={visibleTasks}
                members={members}
                hasAnyTasks={tasks.length > 0}
                onOpen={openTaskDetails}
                onToggleComplete={toggleComplete}
                onCreate={createTask}
                onClearFilters={clearFilters}
              />
            </>
          )}
        </>
      )}

      {selectedTask && currentUser && (
        <TaskDetailsDrawer
          key={selectedTask.id}
          task={selectedTask}
          members={members}
          currentUser={currentUser}
          onClose={closeTaskDetails}
          onSave={updateTask}
          onToggleComplete={toggleComplete}
        />
      )}
    </AppLayout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppStoreProvider>
        <TaskWorkspace />
      </AppStoreProvider>
    </ToastProvider>
  );
}
