import * as assert from "node:assert/strict";
import { dateParts, pdfFileInfo, pdfUploadInput } from "./r2-pdf";

assert.equal(pdfUploadInput(new File(["pdf"], "vyzva.pdf", { type: "application/pdf" }))?.key, "vyzva.pdf");
assert.equal(pdfUploadInput(new File(["text"], "poznamka.txt", { type: "text/plain" })), null);
assert.equal(pdfUploadInput(new File([new Uint8Array(10 * 1024 * 1024 + 1)], "velky.pdf", { type: "application/pdf" })), null);
// Metaúdaje o nahranom súbore pre kartu (typ + veľkosť v bajtoch).
assert.deepEqual(pdfFileInfo(new File(["abc"], "vyzva.pdf", { type: "application/pdf" })), { type: "PDF", size: 3 });
console.log("r2-pdf: OK");

// SigV4 čas: presne jedno Z na konci (MinIO inak vráti MalformedDate a PDF sa nenahrá).
const parts = dateParts(new Date("2026-10-15T00:29:30.123Z"));
assert.equal(parts.amzDate, "20261015T002930Z");
assert.equal(parts.date, "20261015");
assert.match(dateParts().amzDate, /^\d{8}T\d{6}Z$/);
