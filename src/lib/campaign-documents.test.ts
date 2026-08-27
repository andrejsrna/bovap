import * as assert from "node:assert/strict";
import { parseCampaignDocuments } from "./campaign-documents";

assert.deepEqual(parseCampaignDocuments('[{"name":"Výzva.pdf","url":"https://s3.synthbit.sk/bovap/vyzva.pdf"}]'), [{ name: "Výzva.pdf", url: "https://s3.synthbit.sk/bovap/vyzva.pdf" }]);
assert.deepEqual(parseCampaignDocuments('broken'), []);
console.log("campaign-documents: OK");
