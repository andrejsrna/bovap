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
  " <b>ok</b>",
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
// Entity &nbsp; sa dekódujú (nie dvojité escapovanie na „&amp;nbsp;").
assert.equal(
  sanitizeEmailHtml("<p>Ahoj&nbsp;svet</p>"),
  "<p>Ahoj\u00a0svet</p>",
);
// &amp; (doslovný &) ostane správne escapovaný, bez dvojitého escapovania.
assert.equal(
  sanitizeEmailHtml("A &amp; B"),
  "A &amp; B",
);
// Číselná entita sa dekóduje.
assert.equal(
  sanitizeEmailHtml("<p>100&nbsp;%</p>"),
  "<p>100\u00a0%</p>",
);
// Editor (Enter) a vložený text vytvárajú <div>/<h1>: riadky sa nesmú zlepiť.
assert.equal(
  sanitizeEmailHtml("<div>Prvý riadok</div><div>Druhý riadok</div>"),
  "Prvý riadok<br>Druhý riadok",
);
assert.equal(
  sanitizeEmailHtml('<h1 style="font-size:12px">Nadpis</h1><p>Text</p>'),
  "Nadpis<p>Text</p>",
);
// Atribúty zo vloženého obsahu (style, data-*) sa zahodia.
assert.equal(
  sanitizeEmailHtml('<p data-path-to-node="6" style="color:red"><b data-x="1">Ahoj</b></p>'),
  "<p><b>Ahoj</b></p>",
);
// Word/web vkladá \r\n medzi značky: v HTML je to obyčajná medzera, nie nový riadok.
assert.equal(
  sanitizeEmailHtml('<p><span>✅</span>\r\nmonitoring a správy,<o:p></o:p></p>\r\n\r\n<p><span>✅</span>\r\npodpora</p>'),
  "<p>✅ monitoring a správy,</p><p>✅ podpora</p>",
);
// Prázdne odseky (<p><br></p>, <p>&nbsp;</p>) sa zahodia, nerobia diery v emaile.
assert.equal(
  sanitizeEmailHtml("<p>A</p><p><br></p><p>&nbsp;</p><p>B</p>"),
  "<p>A</p><p>B</p>",
);
// <p> v <li> sa rozbalí, inak majú položky zoznamu navyše okraje.
assert.equal(
  sanitizeEmailHtml("<ul><li><p>Jedna</p></li><li><p>Dva</p></li></ul>"),
  "<ul><li>Jedna</li><li>Dva</li></ul>",
);
// Nadpis s odsekmi vo vnútri nepridá za posledný odsek ďalší <br>.
assert.equal(
  sanitizeEmailHtml("<h4><p>A</p><p>B</p></h4><p>C</p>"),
  "<p>A</p><p>B</p><p>C</p>",
);
// Excel/Word: tabuľka sa zmení na riadky, bunky sa nezlepia a fonty/farby zmiznú.
assert.equal(
  sanitizeEmailHtml('<table><tr><td style="font-family:Calibri">Názov</td><td>Cena</td></tr><tr><td>A</td><td>10 €</td></tr></table>'),
  "Názov Cena<br>A 10 €",
);
assert.equal(
  sanitizeEmailHtml('<span style="font-family:&quot;Times New Roman&quot;;font-size:16px"><font face="Arial" color="#000">Text</font></span>'),
  "Text",
);
// Word/Excel metadata must never become visible campaign text.
assert.equal(sanitizeEmailHtml('<html><head><style>p.MsoNormal {font-family:Calibri}</style><title>Document</title></head><body><!--StartFragment--><p>Ahoj</p><!--EndFragment--></body></html>'), '<p>Ahoj</p>');
console.log("rich-text: OK");
