import assert from "node:assert/strict";
import { sanitizeEmailHtml } from "./rich-text";

// Povolené značky a atribúty ostanú.
assert.equal(
  sanitizeEmailHtml("<p>Ahoj <strong>svet</strong> a <em>link</em> <a href=\"https://bovap.sk\">tu</a></p>"),
  "<p>Ahoj <strong>svet</strong> a <em>link</em> <a href=\"https://bovap.sk\">tu</a></p>",
);
// Nepovolené značky sa odstránia, ich text ostane escapovaný.
assert.equal(
  sanitizeEmailHtml("<script>alert('x')</script> <b>ok</b>"),
  "alert(&#39;x&#39;) <b>ok</b>",
);
// Javascript URL sa zruší (odkaz bez href).
assert.equal(
  sanitizeEmailHtml('<a href="javascript:alert(1)">zle</a>'),
  "zle",
);
// Riadky v texte sa konvertujú na <br>.
assert.equal(
  sanitizeEmailHtml("prvý\n<strong>druhý</strong>"),
  "prvý<br><strong>druhý</strong>",
);
console.log("rich-text: OK");
