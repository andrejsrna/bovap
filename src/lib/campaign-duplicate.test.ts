import * as assert from "node:assert/strict";
import { duplicateCampaignData } from "./campaign-duplicate";

const copy = duplicateCampaignData({
  name: "Septembrová výzva",
  subject: "Dôležitá správa",
  title: "Titulok",
  bodyText: "<strong>Text</strong>",
  cards: '[{"title":"Karta","description":"Popis","url":"https://bovap.sk"}]',
  documents: '[{"name":"Príloha.pdf","url":"https://s3.synthbit.sk/bovap/priloha.pdf"}]',
  imageUrl: "https://s3.synthbit.sk/bovap/obrazok.jpg",
});

assert.deepEqual(copy, {
  name: "Kópia – Septembrová výzva",
  subject: "Dôležitá správa",
  title: "Titulok",
  bodyText: "<strong>Text</strong>",
  cards: '[{"title":"Karta","description":"Popis","url":"https://bovap.sk"}]',
  documents: '[{"name":"Príloha.pdf","url":"https://s3.synthbit.sk/bovap/priloha.pdf"}]',
  imageUrl: "https://s3.synthbit.sk/bovap/obrazok.jpg",
  status: "DRAFT",
});
console.log("campaign-duplicate: OK");
