import * as assert from "node:assert/strict";
import { parseCampaignCards, renderCampaignHtml } from "./campaign-content";

assert.deepEqual(parseCampaignCards('[{"title":"Výzva","description":"Popis","url":"https://bovap.sk"}]'), [{ title: "Výzva", description: "Popis", url: "https://bovap.sk" }]);
assert.deepEqual(parseCampaignCards('not-json'), []);
assert.deepEqual(parseCampaignCards('[{"title":"PDF","description":"","url":""}]'), [{ title: "PDF", description: "", url: "" }]);
const email = renderCampaignHtml({ title: "Dôležité", bodyText: "Dobrý deň", cards: [{ title: "Výzva", description: "<script>", url: "https://bovap.sk" }], unsubscribeUrl: "https://mail.bovap.sk/odhlasenie/token" });
assert.doesNotMatch(email, /<script>|&lt;script&gt;/);
assert.match(email, /Praktické informácie/);
assert.match(email, /Pozrieť podrobnosti/);
assert.match(email, /max-width: 620px/);
assert.match(renderCampaignHtml({ title: "T", bodyText: "", cards: [], documents: [{ name: "Výzva.pdf", url: "https://s3.synthbit.sk/bovap/vyzva.pdf" }], unsubscribeUrl: "https://bovap.sk/odhlasenie" }), /Dokumenty na stiahnutie/);
const formattedCard = renderCampaignHtml({ title: "T", bodyText: "", cards: [{ title: "Karta", description: "<strong>Dôležité</strong><script>alert(1)</script><a href=\"javascript:alert(1)\">Zlý odkaz</a><a href=\"https://bovap.sk\">Bezpečný odkaz</a>", url: "https://bovap.sk" }], unsubscribeUrl: "https://bovap.sk/odhlasenie" });
assert.match(formattedCard, /<strong>Dôležité<\/strong>/);
assert.match(formattedCard, /Bezpečný odkaz/);
assert.doesNotMatch(formattedCard, /<script>|javascript:/);
console.log("campaign-content: OK");
