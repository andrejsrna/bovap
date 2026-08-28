// Email-safe HTML sanitizer – povoľuje len značky a odkazy vhodné do emailov.
const ALLOWED_TAGS = new Set(["p", "br", "strong", "b", "em", "i", "a", "ul", "ol", "li"]);

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char));

// Konvertuje riadky v texte na <br>, aby sa zachovali v emaile.
const escapeText = (value: string) => escapeHtml(value).replace(/\n/g, "<br>");

export function sanitizeEmailHtml(input: string): string {
  const result: string[] = [];
  const stack: string[] = [];
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRe.exec(input)) !== null) {
    if (match.index > last) result.push(escapeText(input.slice(last, match.index)));
    const full = match[0];
    const tag = match[1].toLowerCase();
    const attrs = match[2];
    const isClosing = full.startsWith("</");

    if (!ALLOWED_TAGS.has(tag)) {
      // Nepovolená značka – vyhodíme ju (text okolo už bol escapovaný).
    } else if (isClosing) {
      if (stack[stack.length - 1] === tag) {
        result.push(`</${tag}>`);
        stack.pop();
      }
    } else if (tag === "br") {
      result.push("<br>");
    } else if (tag === "a") {
      const hrefMatch = /href\s*=\s*["']([^"']+)["']/i.exec(attrs);
      const href = hrefMatch?.[1] ?? "";
      if (/^https?:\/\//i.test(href)) {
        result.push(`<a href="${escapeHtml(href)}">`);
        stack.push("a");
      }
    } else {
      result.push(`<${tag}>`);
      stack.push(tag);
    }
    last = match.index + full.length;
  }

  if (last < input.length) result.push(escapeText(input.slice(last)));
  while (stack.length) result.push(`</${stack.pop()}>`);
  return result.join("");
}
