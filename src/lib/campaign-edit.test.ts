import * as assert from "node:assert/strict";
import { campaignDraftInput } from "./campaign-edit";

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
};

assert.deepEqual(campaignDraftInput(form({ name: " Test ", subject: " Predmet ", title: " Titulok ", bodyText: " Text ", cards: '[{"title":"Karta","description":"Popis","url":"https://bovap.sk"}]' })), {
  name: "Test", subject: "Predmet", title: "Titulok", bodyText: "Text", cards: '[{"title":"Karta","description":"Popis","url":"https://bovap.sk"}]',
});
assert.equal(campaignDraftInput(form({ name: "", subject: "Predmet" })), null);
console.log("campaign-edit: OK");
