import { sanitizeEmailHtml } from "./rich-text";

/** Prefer the clipboard's plain text so Office styles never enter the editor. */
export function editorPasteHtml(text: string, html: string): string {
  if (!text) return sanitizeEmailHtml(html);
  return text
    .replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!))
    .replace(/\r\n?|\n/g, "<br>")
    .replace(/\t/g, " ");
}
