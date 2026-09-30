import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Bold, Italic, Link as LinkIcon, List, ListOrdered } from "lucide-react";
import { useEffect } from "react";
import { cn } from "../lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  editable?: boolean;
  ariaLabel?: string;
}

export function RichTextEditor({ value, onChange, editable = true, ariaLabel }: RichTextEditorProps) {
  const editor = useEditor({
    editable,
    extensions: [
      StarterKit.configure({ heading: false }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https", "mailto"],
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-label": ariaLabel ?? "Descrição",
        "aria-multiline": "true",
        class: "tiptap-editor-content px-3 py-2 text-sm",
      },
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value && document.activeElement !== editor.view.dom) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  if (!editor) return null;

  function setLink() {
    const previous = editor!.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL do link", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    try {
      const parsed = new URL(url);
      if (!["http:", "https:", "mailto:"].includes(parsed.protocol)) return;
      editor!.chain().focus().extendMarkRange("link").setLink({ href: parsed.toString() }).run();
    } catch {
      // URL inválida: ignora silenciosamente.
    }
  }

  return (
    <div className="tiptap-editor rounded-md border border-border">
      {editable && (
        <div className="flex items-center gap-1 border-b border-border p-1.5" role="toolbar" aria-label="Formatação de texto">
          <ToolbarButton
            active={editor.isActive("bold")}
            label="Negrito"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold size={14} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("italic")}
            label="Itálico"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic size={14} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("bulletList")}
            label="Lista com marcadores"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List size={14} />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("orderedList")}
            label="Lista numerada"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered size={14} />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("link")} label="Inserir link" onClick={setLink}>
            <LinkIcon size={14} />
          </ToolbarButton>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded p-1.5 text-text-muted hover:bg-black/5",
        active && "bg-accent-100 text-accent-700"
      )}
    >
      {children}
    </button>
  );
}
