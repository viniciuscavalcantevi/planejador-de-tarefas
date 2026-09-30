import { Tag, Plus, Check } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { PRESET_TAGS } from "../types";

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  readOnly?: boolean;
}

export function TagSelector({ selectedTags = [], onChange, readOnly }: TagSelectorProps) {
  function handleToggleTag(tagId: string) {
    if (readOnly) return;
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter((t) => t !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
  }

  const activeTagObjs = PRESET_TAGS.filter((t) => selectedTags.includes(t.id));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
          <Tag size={13} className="text-[#0066CC]" />
          Etiquetas / Tags
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {activeTagObjs.map((t) => (
          <span
            key={t.id}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${t.color}`}
          >
            {t.name}
            {!readOnly && (
              <button
                type="button"
                onClick={() => handleToggleTag(t.id)}
                className="ml-0.5 rounded-full hover:bg-black/10 p-0.5 text-current"
              >
                ×
              </button>
            )}
          </span>
        ))}

        {!readOnly && (
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-500 hover:border-[#0066CC] hover:text-[#0066CC] transition-colors"
              >
                <Plus size={11} />
                Adicionar tag
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                align="start"
                sideOffset={5}
                className="z-50 w-48 rounded-lg border border-gray-200 bg-white p-2 shadow-xl focus:outline-none"
              >
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1 mb-1">
                  Selecione as etiquetas
                </div>
                <div className="space-y-1">
                  {PRESET_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleToggleTag(tag.id)}
                        className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors ${
                          isSelected ? "bg-blue-50 font-semibold text-[#0066CC]" : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <span className={`rounded-full border px-2 py-0.2 text-[10px] ${tag.color}`}>
                          {tag.name}
                        </span>
                        {isSelected && <Check size={13} className="text-[#0066CC]" />}
                      </button>
                    );
                  })}
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        )}
      </div>
    </div>
  );
}
