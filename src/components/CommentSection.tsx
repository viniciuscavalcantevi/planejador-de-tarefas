import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { Comment } from "../types";
import { initials } from "../lib/utils";
import { repository } from "../services";
import { useToast } from "../store/ToastContext";

interface CommentSectionProps {
  taskId: string;
  comments: Comment[];
  currentUserId: string;
  actor: { id: string; name: string };
  onAdded: (comment: Comment) => void;
  onDeleted: (commentId: string) => void;
}

export function CommentSection({ taskId, comments, currentUserId, actor, onAdded, onDeleted }: CommentSectionProps) {
  const { showToast } = useToast();
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  async function submit() {
    if (!body.trim() || posting) return;
    setPosting(true);
    try {
      const comment = await repository.addComment(taskId, body, actor);
      onAdded(comment);
      setBody("");
    } catch (err) {
      showToast({
        title: "Não foi possível publicar o comentário",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setPosting(false);
    }
  }

  async function remove(commentId: string) {
    try {
      await repository.deleteComment(commentId, actor);
      onDeleted(commentId);
    } catch (err) {
      showToast({
        title: "Não foi possível excluir o comentário",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    }
  }

  return (
    <div>
      <ul className="flex flex-col gap-3">
        {comments.map((c) => (
          <li key={c.id} className="flex items-start gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-100 text-xs font-medium text-accent-700">
              {initials(c.author?.name ?? "?")}
            </span>
            <div className="min-w-0 flex-1 rounded-md bg-app-bg px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-text">{c.author?.name ?? "Usuário"}</span>
                <span className="text-xs text-text-subtle">
                  {new Date(c.createdAt).toLocaleString("pt-BR")}
                </span>
              </div>
              <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-text">{c.body}</p>
            </div>
            {c.authorId === currentUserId && (
              <button
                type="button"
                aria-label="Excluir comentário"
                onClick={() => remove(c.id)}
                className="mt-1 shrink-0 rounded p-1 text-text-subtle hover:bg-danger-50 hover:text-danger-500"
              >
                <Trash2 size={14} />
              </button>
            )}
          </li>
        ))}
        {comments.length === 0 && (
          <li className="text-sm text-text-subtle">Nenhum comentário ainda.</li>
        )}
      </ul>

      <div className="mt-3">
        <label htmlFor="new-comment" className="sr-only">
          Escrever comentário
        </label>
        <textarea
          id="new-comment"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Escreva um comentário..."
          className="w-full resize-none rounded-md border border-border px-3 py-2 text-sm outline-none focus-visible:border-accent-500"
        />
        <div className="mt-1.5 flex justify-end">
          <button
            type="button"
            onClick={submit}
            disabled={!body.trim() || posting}
            className="rounded-md bg-accent-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
          >
            Publicar comentário
          </button>
        </div>
      </div>
    </div>
  );
}
