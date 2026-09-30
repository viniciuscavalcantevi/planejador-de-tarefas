import { useRef, useState } from "react";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import type { Attachment } from "../types";
import { formatBytes, cn } from "../lib/utils";
import { repository, isDemoMode } from "../services";
import { useToast } from "../store/ToastContext";

interface AttachmentListProps {
  taskId: string;
  attachments: Attachment[];
  onUploaded: (attachment: Attachment) => void;
  onDeleted: (attachmentId: string) => void;
  actor: { id: string; name: string };
}

export function AttachmentList({ taskId, attachments, onUploaded, onDeleted, actor }: AttachmentListProps) {
  const { showToast } = useToast();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        try {
          const attachment = await repository.uploadAttachment(taskId, file, actor);
          onUploaded(attachment);
          showToast({ title: `"${file.name}" enviado` });
        } catch (err) {
          showToast({
            title: `Falha ao enviar "${file.name}"`,
            description: err instanceof Error ? err.message : undefined,
            variant: "error",
          });
        }
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(attachment: Attachment) {
    setDeletingId(attachment.id);
    try {
      await repository.deleteAttachment(attachment.id, actor);
      onDeleted(attachment.id);
      showToast({ title: "Anexo excluído" });
    } catch (err) {
      showToast({
        title: "Não foi possível excluir o anexo",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDownload(attachment: Attachment) {
    try {
      const url = await repository.getAttachmentUrl(attachment);
      if (!url) throw new Error("URL de download indisponível.");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      showToast({
        title: "Não foi possível baixar o anexo",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    }
  }

  return (
    <div>
      {isDemoMode && (
        <p className="mb-2 text-xs text-text-subtle">
          Modo demonstração: anexos são locais e temporários, não persistem após recarregar a página.
        </p>
      )}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed p-4 text-center text-sm",
          dragging ? "border-accent-500 bg-accent-50" : "border-border text-text-muted"
        )}
      >
        <Upload size={18} className="text-text-subtle" />
        <p>Arraste arquivos aqui ou</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="font-medium text-accent-600 hover:underline disabled:opacity-60"
        >
          {uploading ? "Enviando..." : "selecionar arquivos"}
        </button>
        <p className="text-xs text-text-subtle">PDF, PNG, JPEG, DOCX ou XLSX · até 10 MB</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          aria-label="Selecionar arquivos para anexar"
          accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <ul className="mt-3 flex flex-col gap-1.5">
        {attachments.map((att) => (
          <li
            key={att.id}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
          >
            <FileText size={16} className="shrink-0 text-text-subtle" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-text">{att.fileName}</p>
              <p className="text-xs text-text-subtle">
                {formatBytes(att.sizeBytes)} · {att.uploader?.name ?? "—"}
              </p>
            </div>
            <button
              type="button"
              aria-label={`Baixar ${att.fileName}`}
              onClick={() => handleDownload(att)}
              className="rounded p-1.5 text-text-subtle hover:bg-black/5 hover:text-text"
            >
              <Download size={15} />
            </button>
            <button
              type="button"
              aria-label={`Excluir ${att.fileName}`}
              onClick={() => handleDelete(att)}
              disabled={deletingId === att.id}
              className="rounded p-1.5 text-text-subtle hover:bg-danger-50 hover:text-danger-500 disabled:opacity-60"
            >
              <Trash2 size={15} />
            </button>
          </li>
        ))}
        {attachments.length === 0 && (
          <li className="py-2 text-center text-sm text-text-subtle">Nenhum anexo ainda.</li>
        )}
      </ul>
    </div>
  );
}
