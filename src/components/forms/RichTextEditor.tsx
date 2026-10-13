"use client";

import { useRef, useEffect } from "react";
import { sanitizeEmailHtml, EMAIL_FONTS, EMAIL_FONT_SIZES } from "@/lib/rich-text";
import { editorPasteHtml } from "@/lib/editor-paste";
import { EMAIL_PROSE, EMAIL_PROSE_CLASS, emailProseStyle, type EmailProseKind } from "@/lib/email-prose";

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

export default function RichTextEditor({ name, defaultValue = "", rows = 6, onChange, variant = "body" }: {
  name: string; defaultValue?: string; rows?: number; onChange?: (value: string) => void; variant?: EmailProseKind;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const rememberSelection = () => {
    const selection = window.getSelection();
    if (selection?.rangeCount && editorRef.current?.contains(selection.anchorNode)) selectionRef.current = selection.getRangeAt(0).cloneRange();
  };
  const formatSelection = (command: string, value: string) => {
    editorRef.current?.focus();
    if (selectionRef.current) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(selectionRef.current);
    }
    document.execCommand("styleWithCSS", false, "false");
    document.execCommand(command, false, value);
    sync();
    rememberSelection();
  };

  const sync = () => {
    if (hiddenRef.current && editorRef.current) {
      hiddenRef.current.value = editorRef.current.innerHTML;
      onChange?.(editorRef.current.innerHTML);
    }
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = sanitizeEmailHtml(defaultValue || "");
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
      <div className="mb-1 flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1">
        <select aria-label="Písmo" defaultValue="" onMouseDown={rememberSelection} onChange={(event) => { formatSelection("fontName", event.target.value); event.target.value = ""; }} className="rounded border border-gray-300 bg-white px-2 py-1 text-sm">
          <option value="" disabled>Písmo</option>
          {Object.keys(EMAIL_FONTS).map((font) => <option key={font} value={font}>{font}</option>)}
        </select>
        <select aria-label="Veľkosť písma" defaultValue="" onMouseDown={rememberSelection} onChange={(event) => { formatSelection("fontSize", event.target.value); event.target.value = ""; }} className="rounded border border-gray-300 bg-white px-2 py-1 text-sm">
          <option value="" disabled>Veľkosť</option>
          {Object.entries(EMAIL_FONT_SIZES).map(([value, pixels]) => <option key={value} value={value}>{pixels} px</option>)}
        </select>
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
        onMouseUp={rememberSelection}
        onKeyUp={rememberSelection}
        onPaste={(event) => {
          // Excel/Word/web vkladajú fonty, farby a tabuľky: vložíme len email-safe HTML.
          const html = event.clipboardData.getData("text/html");
          const text = event.clipboardData.getData("text/plain");
          if (!html && !text) return;
          event.preventDefault();
          const clean = editorPasteHtml(text, html);
          document.execCommand("insertHTML", false, clean);
          sync();
        }}
        style={{ minHeight: `${rows * 24}px`, ...emailProseStyle(variant), maxWidth: `${EMAIL_PROSE[variant].width + 26}px` }}
        className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 ${EMAIL_PROSE_CLASS}`}
      />
      <input type="hidden" name={name} ref={hiddenRef} />
    </div>
  );
}
