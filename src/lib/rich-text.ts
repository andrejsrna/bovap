// Email-safe HTML sanitizer – povoľuje len značky a odkazy vhodné do emailov.
const ALLOWED_TAGS = new Set(["p", "br", "strong", "b", "em", "i", "a", "ul", "ol", "li"]);
// Blokové značky z editora/vloženého textu: nepovolíme ich, ale koniec bloku = nový riadok.
const LINE_BREAK_TAGS = new Set(["div", "h1", "h2", "h3", "h4", "h5", "h6"]);

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char));

// Dekóduje HTML entity (&nbsp;, &amp;, &lt;, &#160;, …) naspäť na znaky,
// aby sa v texte z editora (contentEditable vkladá &nbsp; apod.) neescapovali dvakrát.
const decodeHtmlEntities = (value: string) =>
  value.replace(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (entity, body: string) => {
    if (body[0] === "#") {
      const isHex = body[1] === "x" || body[1] === "X";
      const code = parseInt(body.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : entity;
    }
    const named: Record<string, string> = {
      nbsp: "\u00a0", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
    };
    return named[body.toLowerCase()] ?? entity;
  });

// Obyčajný text: riadky sa zachovajú ako <br>. V HTML (vložené z Wordu/webu) sú
// zalomenia medzi značkami len medzera, nie nový riadok.
const escapeText = (value: string, isHtml: boolean) => {
  const text = escapeHtml(decodeHtmlEntities(value));
  return isHtml ? text.replace(/\s*[\r\n]+\s*/g, " ") : text.replace(/\r?\n/g, "<br>");
};

const BLOCK = "(?:p|ul|ol|li)";
const tidy = (html: string) =>
  html
    .replace(/<p>(?:\s|\u00a0|<br>)*<\/p>/g, "") // prázdne odseky = diery v emaile
    .replace(/<br>(?=<(?:\/?(?:p|ul|ol|li))\b)/g, "") // <br> pred blokom je navyše
    .replace(new RegExp(`\\s+(?=<\\/?${BLOCK}>)`, "g"), "")
    .replace(new RegExp(`(<\\/?${BLOCK}>)\\s+`, "g"), "$1")
    .replace(/(?:<br>)+$/, "")
    .replace(/ +(?=<br>)/g, "")
    .replace(/ +$/, "");

export function sanitizeEmailHtml(input: string): string {
  const isHtml = /<(?:p|div|ul|ol|li|h[1-6]|br)\b/i.test(input);
  const result: string[] = [];
  const stack: string[] = [];
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRe.exec(input)) !== null) {
    if (match.index > last) result.push(escapeText(input.slice(last, match.index), isHtml));
    const full = match[0];
    const tag = match[1].toLowerCase();
    const attrs = match[2];
    const isClosing = full.startsWith("</");

    if (!ALLOWED_TAGS.has(tag)) {
      // Nepovolená značka – vyhodíme ju (text okolo už bol escapovaný).
      if (isClosing && LINE_BREAK_TAGS.has(tag)) result.push("<br>");
      // Tabuľka z Excelu: bunky oddelíme medzerou, riadky novým riadkom.
      else if (isClosing && (tag === "td" || tag === "th")) result.push(" ");
      else if (isClosing && tag === "tr") result.push("<br>");
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
    } else if (tag === "p" && stack.includes("li")) {
      // <p> v <li> (z Wordu/AI) pridáva položkám okraje – rozbalíme ho.
    } else {
      result.push(`<${tag}>`);
      stack.push(tag);
    }
    last = match.index + full.length;
  }

  if (last < input.length) result.push(escapeText(input.slice(last), isHtml));
  while (stack.length) result.push(`</${stack.pop()}>`);
  return tidy(result.join(""));
}
