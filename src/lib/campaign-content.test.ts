import * as assert from "node:assert/strict";
import { formatFileSize, parseCampaignCards, renderCampaignHtml } from "./campaign-content";

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
// Odseky v texte nesmú byť vnorené do ďalšieho <p> (rozbíja zobrazenie v emailových klientoch).
const paragraphs = renderCampaignHtml({ title: "T", bodyText: "<p>Prvý</p><p>Druhý</p>", cards: [], unsubscribeUrl: "https://bovap.sk/odhlasenie" });
assert.doesNotMatch(paragraphs, /<p[^>]*>(?:(?!<\/p>).)*<p>/);
// Odseky majú explicitný okraj, aby ich emailové programy nerozťahovali podľa vlastných predvolieb.
assert.match(paragraphs, /<p style="margin:0 0 6px">Prvý<\/p><p style="margin:0 0 6px">Druhý<\/p>/);

// Odkazy v texte majú farbu šablóny, nie predvolenú modrú z emailového programu.
const linked = renderCampaignHtml({ title: "T", bodyText: '<a href="https://bovap.sk">Web</a>', cards: [{ title: "K", description: '<a href="https://bovap.sk/x.pdf">Súbor</a>', url: "" }], unsubscribeUrl: "https://bovap.sk/odhlasenie" });
assert.equal((linked.match(/<a href="https:\/\/bovap\.sk(?:\/x\.pdf)?" style="color:#1f668d;text-decoration:underline">/g) ?? []).length, 2);

// Veľkosť súboru: KB do 1 MB, inak MB so slovenskou desatinnou čiarkou.
assert.equal(formatFileSize(372720), "364 KB");
assert.equal(formatFileSize(1_572_864), "1,5 MB");
assert.equal(formatFileSize(0), "");

// Metaúdaje o súbore sa pri načítaní zachovajú a neplatné sa zahodia.
const pdfUrl = "https://s3.synthbit.sk/bovap/kampane/x/vyzva.pdf";
assert.deepEqual(parseCampaignCards(JSON.stringify([{ title: "A", description: "", url: pdfUrl, file: { type: "PDF", size: 372720 } }])), [{ title: "A", description: "", url: pdfUrl, file: { type: "PDF", size: 372720 } }]);
assert.deepEqual(parseCampaignCards(JSON.stringify([{ title: "A", description: "", url: pdfUrl, file: { type: "EXE", size: -1 } }])), [{ title: "A", description: "", url: pdfUrl }]);

// Karta s PDF: ostáva odkaz „Pozrieť podrobnosti →“, za ním typ a veľkosť (všetko v jednom odkaze).
const pdfCard = renderCampaignHtml({ title: "T", bodyText: "", cards: [{ title: "Výzva", description: "", url: pdfUrl, file: { type: "PDF", size: 372720 } }], unsubscribeUrl: "https://bovap.sk/odhlasenie" });
assert.match(pdfCard, new RegExp(`<a href="${pdfUrl.replace(/[.]/g, "\\.")}"[^>]*>Pozrieť podrobnosti&nbsp; →<span[^>]*> · PDF, 364 KB</span></a>`));
assert.doesNotMatch(pdfCard, /Stiahnuť PDF|display:block/);
// Starší PDF odkaz bez uložených metaúdajov: typ sa pozná z URL, veľkosť sa nevymýšľa.
const legacyPdf = renderCampaignHtml({ title: "T", bodyText: "", cards: [{ title: "Výzva", description: "", url: pdfUrl }], unsubscribeUrl: "https://bovap.sk/odhlasenie" });
assert.match(legacyPdf, /Pozrieť podrobnosti&nbsp; →<span[^>]*> · PDF<\/span>/);
// Obyčajný odkaz ostáva nezmenený.
assert.match(renderCampaignHtml({ title: "T", bodyText: "", cards: [{ title: "Web", description: "", url: "https://bovap.sk" }], unsubscribeUrl: "https://bovap.sk/odhlasenie" }), /Pozrieť podrobnosti/);
// Karta bez odkazu nemá prázdny href ani výzvu na kliknutie.
const noLink = renderCampaignHtml({ title: "T", bodyText: "", cards: [{ title: "Len info", description: "Text", url: "" }], unsubscribeUrl: "https://bovap.sk/odhlasenie" });
assert.doesNotMatch(noLink, /href=""/);
assert.doesNotMatch(noLink, /Pozrieť podrobnosti/);
