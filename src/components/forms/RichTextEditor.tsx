"use client";

import { useRef, useEffect } from "react";

function ToolButton({
  label,
  title,
  onPress,
}: {
  label: string;
  title: string;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      className="rounded-md px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-200"
    >
      {label}
    </button>
  );
}

export default function RichTextEditor({ name, defaultValue = "", rows = 6, onChange }: {
  name: string; defaultValue?: string; rows?: number; onChange?: (value: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);

  const sync = () => {
    if (hiddenRef.current && editorRef.current) {
      hiddenRef.current.value = editorRef.current.innerHTML;
      onChange?.(editorRef.current.innerHTML);
    }
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = defaultValue || "";
      sync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    sync();
  };

  const insertLink = () => {
    const url = window.prompt("URL odkazu (https://…)");
    if (url) exec("createLink", url);
  };

  return (
    <div>
      <div className="mb-1 flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1">
        <ToolButton label="B" title="Tučné" onPress={() => exec("bold")} />
        <ToolButton label="I" title="Kurzíva" onPress={() => exec("italic")} />
        <ToolButton label="• List" title="Zoznam" onPress={() => exec("insertUnorderedList")} />
        <ToolButton label="🔗 Odkaz" title="Vložiť odkaz" onPress={insertLink} />
      </div>
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        onInput={sync}
        style={{ minHeight: `${rows * 24}px` }}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 [&_a]:text-primary-700 [&_a]:underline"
      />
      <input type="hidden" name={name} ref={hiddenRef} />
    </div>
  );
}
