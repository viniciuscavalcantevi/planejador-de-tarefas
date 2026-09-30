import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Copy, ExternalLink, MoreHorizontal, Paperclip, Trash2, CheckSquare } from "lucide-react";
import { useState } from "react";
import type { Task, WorkspaceMember } from "../types";
import { PRESET_TAGS } from "../types";
import { cn } from "../lib/utils";
import { CompletionCheckbox } from "./CompletionCheckbox";
import { PrioritySelect } from "./PrioritySelect";
import { StatusSelect } from "./StatusSelect";
import { SourceSelect } from "./SourceSelect";
import { AssigneesSelect } from "./AssigneesSelect";
import { DueDateCell } from "./DueDateCell";
import { SOURCE_LABELS } from "../lib/taskLabels";

interface TaskRowProps {
  task: Task;
  members: WorkspaceMember[];
  onOpen: (taskId: string) => void;
  onToggleComplete: (task: Task, checked: boolean) => void;
  onUpdate: (taskId: string, input: Partial<Task>) => void;
  onDuplicate: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskRow({
  task,
  members,
  onOpen,
  onToggleComplete,
  onUpdate,
  onDuplicate,
  onDelete,
}: TaskRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const done = task.status === "concluido";

  const completedChecklist = (task.checklist || []).filter((i) => i.completed).length;
  const totalChecklist = (task.checklist || []).length;

  return (
    <tr
      onClick={() => onOpen(task.id)}
      className={cn(
        "cursor-pointer border-b border-border last:border-0 hover:bg-black/[0.015] focus-within:bg-black/[0.015]",
        done && "bg-black/[0.008]"
      )}
    >
      <td className="w-10 px-3 py-2.5 align-middle">
        <CompletionCheckbox
          checked={done}
          onChange={(checked) => onToggleComplete(task, checked)}
          label={task.title}
        />
      </td>
      <td className="min-w-[220px] max-w-[340px] px-3 py-2.5 align-middle">
        <span
          title={task.title}
          className={cn(
            "block truncate text-sm font-medium",
            done ? "text-text-subtle line-through" : "text-text"
          )}
        >
          {task.title}
        </span>

        {/* Tags e Indicador de Checklist */}
        {((task.tags && task.tags.length > 0) || totalChecklist > 0) && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {task.tags?.map((tagId) => {
              const tagObj = PRESET_TAGS.find((p) => p.id === tagId);
              if (!tagObj) return null;
              return (
                <span
                  key={tagId}
                  className={cn("rounded-full border px-1.5 py-0.2 text-[10px] font-semibold", tagObj.color)}
                >
                  {tagObj.name}
                </span>
              );
            })}

            {totalChecklist > 0 && (
              <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.2 text-[10px] font-medium text-gray-600">
                <CheckSquare size={10} className="text-[#0066CC]" />
                {completedChecklist}/{totalChecklist}
              </span>
            )}
          </div>
        )}
      </td>
      <td className="px-3 py-2.5 align-middle">
        <SourceSelect value={task.source} onChange={(v) => onUpdate(task.id, { source: v })} />
      </td>
      <td className="px-3 py-2.5 align-middle">
        <DueDateCell
          value={task.dueDate}
          status={task.status}
          onChange={(v) => onUpdate(task.id, { dueDate: v })}
        />
      </td>
      <td className="px-3 py-2.5 align-middle">
        <PrioritySelect value={task.priority} onChange={(v) => onUpdate(task.id, { priority: v })} />
      </td>
      <td className="px-3 py-2.5 align-middle">
        <StatusSelect value={task.status} onChange={(v) => onUpdate(task.id, { status: v })} />
      </td>
      <td className="px-3 py-2.5 align-middle">
        <AssigneesSelect
          members={members}
          value={task.assigneeIds}
          onChange={(v) => onUpdate(task.id, { assigneeIds: v })}
        />
      </td>
      <td className="px-3 py-2.5 text-center align-middle">
        <button
          type="button"
          aria-label={`Ver anexos de "${task.title}"`}
          title="Anexos"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(task.id);
          }}
          className="relative inline-flex items-center rounded p-1.5 text-text-subtle hover:bg-black/5 hover:text-text"
        >
          <Paperclip size={15} />
        </button>
      </td>
      <td className="px-3 py-2.5 text-right align-middle">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label={`Mais ações para "${task.title}"`}
              onClick={(e) => e.stopPropagation()}
              className="rounded p-1.5 text-text-subtle hover:bg-black/5 hover:text-text"
            >
              <MoreHorizontal size={16} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              className="z-50 w-44 rounded-md border border-border bg-surface p-1 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu.Item
                onSelect={() => onOpen(task.id)}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent-50"
              >
                <ExternalLink size={14} /> Abrir detalhes
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={() => onDuplicate(task)}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent-50"
              >
                <Copy size={14} /> Duplicar
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                onSelect={() => setConfirmDelete(true)}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-danger-500 outline-none data-[highlighted]:bg-danger-50"
              >
                <Trash2 size={14} /> Excluir
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <AlertDialog.Root open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
            <AlertDialog.Content
              onClick={(e) => e.stopPropagation()}
              className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface p-5 shadow-xl"
            >
              <AlertDialog.Title className="text-base font-semibold text-text">
                Excluir tarefa?
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-1.5 text-sm text-text-muted">
                Esta ação não pode ser desfeita. A tarefa "{task.title}" e seus comentários,
                anexos e histórico serão excluídos.
              </AlertDialog.Description>
              <div className="mt-4 flex justify-end gap-2">
                <AlertDialog.Cancel asChild>
                  <button className="rounded-md px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-black/5">
                    Cancelar
                  </button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <button
                    onClick={() => onDelete(task)}
                    className="rounded-md bg-danger-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-danger-600"
                  >
                    Excluir
                  </button>
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </td>
    </tr>
  );
}

export function sourceAriaLabel(task: Task): string {
  return `${SOURCE_LABELS[task.source].short} · ${SOURCE_LABELS[task.source].full}`;
}
