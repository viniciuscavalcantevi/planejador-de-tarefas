import * as Dialog from "@radix-ui/react-dialog";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { AlertCircle, Check, Loader2, X } from "lucide-react";
import type { ActivityEntry, Attachment, Comment, Task, UpdateTaskInput, WorkspaceMember } from "../types";
import { taskFormSchema, type TaskFormValues } from "./taskFormSchema";
import { CompletionCheckbox } from "./CompletionCheckbox";
import { StatusSelect } from "./StatusSelect";
import { PrioritySelect } from "./PrioritySelect";
import { SourceSelect } from "./SourceSelect";
import { AssigneesSelect } from "./AssigneesSelect";
import { RichTextEditor } from "./RichTextEditor";
import { AttachmentList } from "./AttachmentList";
import { CommentSection } from "./CommentSection";
import { ActivityTimeline } from "./ActivityTimeline";
import { formatDateBR } from "../lib/taskRules";
import { repository } from "../services";
import { useToast } from "../store/ToastContext";
import { cn, isEmptyRichText } from "../lib/utils";

interface TaskDetailsDrawerProps {
  task: Task;
  members: WorkspaceMember[];
  currentUser: { id: string; name: string };
  onClose: () => void;
  onSave: (taskId: string, input: UpdateTaskInput) => Promise<boolean>;
  onToggleComplete: (task: Task, checked: boolean) => void;
}

export function TaskDetailsDrawer({
  task,
  members,
  currentUser,
  onClose,
  onSave,
  onToggleComplete,
}: TaskDetailsDrawerProps) {
  const { showToast } = useToast();
  const [description, setDescription] = useState(task.description ?? "");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loadingPanels, setLoadingPanels] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isDirty: fieldsDirty },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: toFormValues(task),
  });

  const values = watch();
  const normalizeDescription = (html: string) => (isEmptyRichText(html) ? "" : html);
  const descriptionDirty =
    normalizeDescription(description) !== normalizeDescription(task.description ?? "");
  const isDirty = fieldsDirty || descriptionDirty;

  useEffect(() => {
    reset(toFormValues(task));
    setDescription(task.description ?? "");
    setSaveState("idle");
  }, [task, reset]);

  useEffect(() => {
    let active = true;
    setLoadingPanels(true);
    Promise.all([
      repository.listComments(task.id),
      repository.listAttachments(task.id),
      repository.listActivity(task.id),
    ])
      .then(([c, a, h]) => {
        if (!active) return;
        setComments(c);
        setAttachments(a);
        setActivity(h);
      })
      .finally(() => active && setLoadingPanels(false));
    return () => {
      active = false;
    };
  }, [task.id]);

  async function submit(data: TaskFormValues) {
    setSaveState("saving");
    const normalizedDescription = isEmptyRichText(description) ? null : description;
    const ok = await onSave(task.id, {
      title: data.title,
      status: data.status,
      priority: data.priority,
      source: data.source,
      assigneeIds: data.assigneeIds,
      startDate: data.startDate,
      dueDate: data.dueDate,
      description: normalizedDescription,
    });
    if (ok) {
      setSaveState("saved");
      reset({ ...data, startDate: data.startDate ?? "", dueDate: data.dueDate ?? "" });
      showToast({ title: "Alterações salvas" });
    } else {
      setSaveState("error");
    }
  }

  function requestClose() {
    if (isDirty) {
      setConfirmDiscard(true);
    } else {
      onClose();
    }
  }

  const done = values.status === "concluido";

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) requestClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Dialog.Content
          onEscapeKeyDown={(e) => {
            if (isDirty) {
              e.preventDefault();
              setConfirmDiscard(true);
            }
          }}
          onInteractOutside={(e) => {
            if (isDirty) e.preventDefault();
          }}
          className="fixed inset-y-0 right-0 z-40 flex w-full flex-col bg-surface shadow-2xl outline-none sm:w-[560px]"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <Dialog.Title className="sr-only">Detalhes da tarefa</Dialog.Title>
            <Dialog.Description className="sr-only">
              Painel para editar título, status, prioridade, descrição, anexos, comentários e histórico da tarefa.
            </Dialog.Description>
            <div className="flex items-center gap-2">
              <CompletionCheckbox
                checked={done}
                onChange={(checked) => onToggleComplete(task, checked)}
                label={values.title || task.title}
              />
              <SaveIndicator state={saveState} />
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Fechar painel de detalhes"
                onClick={(e) => {
                  e.preventDefault();
                  requestClose();
                }}
                className="rounded p-1.5 text-text-subtle hover:bg-black/5 hover:text-text"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(submit)} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
              <div>
                <label htmlFor="task-title" className="sr-only">
                  Título da tarefa
                </label>
                <input
                  id="task-title"
                  {...register("title")}
                  aria-invalid={!!errors.title}
                  className={cn(
                    "w-full border-0 border-b-2 border-transparent bg-transparent px-0 pb-1 text-lg font-semibold text-text outline-none focus-visible:border-accent-500",
                    done && "text-text-subtle line-through"
                  )}
                />
                {errors.title && (
                  <p role="alert" className="mt-1 text-sm text-danger-500">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Status">
                  <StatusSelect
                    value={values.status}
                    onChange={(v) => setValue("status", v, { shouldDirty: true, shouldValidate: true })}
                  />
                </Field>
                <Field label="Prioridade">
                  <PrioritySelect
                    value={values.priority}
                    onChange={(v) => setValue("priority", v, { shouldDirty: true, shouldValidate: true })}
                  />
                </Field>
                <Field label="Origem">
                  <SourceSelect
                    value={values.source}
                    onChange={(v) => setValue("source", v, { shouldDirty: true, shouldValidate: true })}
                  />
                </Field>
                <Field label="Responsáveis (até 3)">
                  <AssigneesSelect
                    members={members}
                    value={values.assigneeIds}
                    onChange={(v) => setValue("assigneeIds", v, { shouldDirty: true, shouldValidate: true })}
                  />
                  {errors.assigneeIds && (
                    <p role="alert" className="mt-1 text-xs text-danger-500">
                      {errors.assigneeIds.message}
                    </p>
                  )}
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Field label="Data de início">
                  <input
                    type="date"
                    {...register("startDate", { setValueAs: (v) => v || null })}
                    className="w-full rounded-md border border-border px-2 py-1.5 text-sm outline-none focus-visible:border-accent-500"
                  />
                </Field>
                <Field label="Data prevista">
                  <input
                    type="date"
                    {...register("dueDate", { setValueAs: (v) => v || null })}
                    className="w-full rounded-md border border-border px-2 py-1.5 text-sm outline-none focus-visible:border-accent-500"
                  />
                  {errors.dueDate && (
                    <p role="alert" className="mt-1 text-xs text-danger-500">
                      {errors.dueDate.message}
                    </p>
                  )}
                </Field>
                <Field label="Data fim">
                  <p className="rounded-md border border-border bg-app-bg px-2 py-1.5 text-sm text-text-muted">
                    {task.completedDate ? formatDateBR(task.completedDate) : "—"}
                  </p>
                </Field>
              </div>

              <Field label="Descrição">
                <RichTextEditor value={description} onChange={setDescription} />
              </Field>

              <div className="flex items-center gap-2 border-t border-border pt-4">
                <button
                  type="submit"
                  disabled={!isDirty || saveState === "saving"}
                  className="flex items-center gap-1.5 rounded-md bg-accent-500 px-3.5 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
                >
                  {saveState === "saving" && <Loader2 size={14} className="animate-spin" />}
                  Salvar alterações
                </button>
                <button
                  type="button"
                  disabled={!isDirty}
                  onClick={() => {
                    reset(toFormValues(task));
                    setDescription(task.description ?? "");
                  }}
                  className="rounded-md px-3.5 py-2 text-sm font-medium text-text-muted hover:bg-black/5 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>

              <section aria-labelledby="attachments-heading" className="border-t border-border pt-4">
                <h2 id="attachments-heading" className="mb-2 text-sm font-semibold text-text">
                  Anexos
                </h2>
                {!loadingPanels && (
                  <AttachmentList
                    taskId={task.id}
                    attachments={attachments}
                    actor={currentUser}
                    onUploaded={(a) => setAttachments((prev) => [a, ...prev])}
                    onDeleted={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
                  />
                )}
              </section>

              <section aria-labelledby="comments-heading" className="border-t border-border pt-4">
                <h2 id="comments-heading" className="mb-2 text-sm font-semibold text-text">
                  Comentários
                </h2>
                {!loadingPanels && (
                  <CommentSection
                    taskId={task.id}
                    comments={comments}
                    currentUserId={currentUser.id}
                    actor={currentUser}
                    onAdded={(c) => setComments((prev) => [...prev, c])}
                    onDeleted={(id) => setComments((prev) => prev.filter((c) => c.id !== id))}
                  />
                )}
              </section>

              <section aria-labelledby="activity-heading" className="border-t border-border pb-2 pt-4">
                <h2 id="activity-heading" className="mb-2 text-sm font-semibold text-text">
                  Histórico
                </h2>
                {!loadingPanels && <ActivityTimeline entries={activity} />}
              </section>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>

      <AlertDialog.Root open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface p-5 shadow-xl">
            <AlertDialog.Title className="flex items-center gap-2 text-base font-semibold text-text">
              <AlertCircle size={18} className="text-warning-500" />
              Descartar alterações?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-1.5 text-sm text-text-muted">
              Você tem alterações não salvas neste painel. Deseja fechar mesmo assim?
            </AlertDialog.Description>
            <div className="mt-4 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <button className="rounded-md px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-black/5">
                  Continuar editando
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={onClose}
                  className="rounded-md bg-danger-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-danger-600"
                >
                  Descartar e fechar
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </Dialog.Root>
  );
}

function toFormValues(task: Task): TaskFormValues {
  return {
    title: task.title,
    status: task.status,
    priority: task.priority,
    source: task.source,
    assigneeIds: task.assigneeIds,
    // Inputs type="date" always read/write "" for empty, never null;
    // matching that here keeps react-hook-form's dirty-check accurate.
    startDate: task.startDate ?? "",
    dueDate: task.dueDate ?? "",
  };
}

function SaveIndicator({ state }: { state: "idle" | "saving" | "saved" | "error" }) {
  if (state === "idle") return null;
  if (state === "saving")
    return (
      <span className="flex items-center gap-1 text-xs text-text-subtle">
        <Loader2 size={12} className="animate-spin" /> Salvando...
      </span>
    );
  if (state === "saved")
    return (
      <span className="flex items-center gap-1 text-xs text-success-500">
        <Check size={12} /> Salvo
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs text-danger-500">
      <AlertCircle size={12} /> Erro ao salvar
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-text-muted">{label}</span>
      {children}
    </div>
  );
}
