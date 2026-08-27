import * as assert from "node:assert/strict";
import { pdfUploadInput } from "./r2-pdf";

assert.equal(pdfUploadInput(new File(["pdf"], "vyzva.pdf", { type: "application/pdf" }))?.key, "vyzva.pdf");
assert.equal(pdfUploadInput(new File(["text"], "poznamka.txt", { type: "text/plain" })), null);
assert.equal(pdfUploadInput(new File([new Uint8Array(10 * 1024 * 1024 + 1)], "velky.pdf", { type: "application/pdf" })), null);
console.log("r2-pdf: OK");
