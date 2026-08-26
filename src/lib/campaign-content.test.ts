import * as assert from "node:assert/strict";
import { parseCampaignCards, renderCampaignHtml } from "./campaign-content";

assert.deepEqual(parseCampaignCards('[{"title":"Výzva","description":"Popis","url":"https://bovap.sk"}]'), [{ title: "Výzva", description: "Popis", url: "https://bovap.sk" }]);
assert.deepEqual(parseCampaignCards('not-json'), []);
const email = renderCampaignHtml({ title: "Dôležité", bodyText: "Dobrý deň", cards: [{ title: "Výzva", description: "<script>", url: "https://bovap.sk" }], unsubscribeUrl: "https://mail.bovap.sk/odhlasenie/token" });
assert.match(email, /&lt;script&gt;/);
assert.match(email, /Praktické informácie/);
assert.match(email, /Pozrieť podrobnosti/);
assert.match(email, /max-width: 620px/);
console.log("campaign-content: OK");
