import assert from "node:assert/strict";
import { editorPasteHtml } from "./editor-paste";
assert.equal(editorPasteHtml('Dobrý deň\r\nCena\t10 €', '<style>.xl{font:Calibri}</style><p>Other</p>'), 'Dobrý deň<br>Cena 10 €');
assert.equal(editorPasteHtml('<b>literal</b> & text', ''), '&lt;b&gt;literal&lt;/b&gt; &amp; text');
assert.equal(editorPasteHtml('', '<style>.xl{color:red}</style><p>Ahoj</p>'), '<p>Ahoj</p>');
console.log('editor-paste: OK');
