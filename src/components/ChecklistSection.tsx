import { CheckSquare, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ChecklistItem } from "../types";
import { uid } from "../lib/utils";

interface ChecklistSectionProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  readOnly?: boolean;
}

export function ChecklistSection({ items, onChange, readOnly }: ChecklistSectionProps) {
  const [newItemTitle, setNewItemTitle] = useState("");

  const total = items.length;
  const completed = items.filter((i) => i.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemTitle.trim() || readOnly) return;
    const newItem: ChecklistItem = {
      id: uid(),
      title: newItemTitle.trim(),
      completed: false,
    };
    onChange([...items, newItem]);
    setNewItemTitle("");
  }

  function handleToggleItem(id: string) {
    if (readOnly) return;
    onChange(
      items.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  }

  function handleRemoveItem(id: string) {
    if (readOnly) return;
    onChange(items.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare size={16} className="text-[#0066CC]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Lista de Verificação / Subtarefas
          </h3>
        </div>
        {total > 0 && (
          <span className="text-[11px] font-medium text-gray-500">
            {completed}/{total} ({percentage}%)
          </span>
        )}
      </div>

      {total > 0 && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full bg-[#0066CC] transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      {/* Lista de Itens */}
      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex items-center justify-between gap-2.5 rounded-md px-2.5 py-1.5 text-xs hover:bg-gray-50 transition-colors"
          >
            <label className="flex flex-1 items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={item.completed}
                disabled={readOnly}
                onChange={() => handleToggleItem(item.id)}
                className="h-4 w-4 rounded border-gray-300 text-[#0066CC] focus:ring-[#0066CC]"
              />
              <span
                className={`flex-1 ${
                  item.completed ? "text-gray-400 line-through" : "text-gray-800 font-medium"
                }`}
              >
                {item.title}
              </span>
            </label>

            {!readOnly && (
              <button
                type="button"
                onClick={() => handleRemoveItem(item.id)}
                className="opacity-0 group-hover:opacity-100 rounded p-1 text-gray-400 hover:text-red-600 transition-opacity"
                title="Excluir item"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Input para Adicionar Novo Item */}
      {!readOnly && (
        <form onSubmit={handleAddItem} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            placeholder="Adicionar uma etapa ou subtarefa..."
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            className="flex-1 rounded-md border border-gray-200 bg-gray-50/50 px-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-[#0066CC] focus:bg-white focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!newItemTitle.trim()}
            className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-[#0066CC] hover:text-white disabled:opacity-40 transition-colors"
          >
            <Plus size={14} />
            Adicionar
          </button>
        </form>
      )}
    </div>
  );
}
