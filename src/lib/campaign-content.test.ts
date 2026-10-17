import * as assert from "node:assert/strict";
import { formatFileSize, parseCampaignCards, renderCampaignHtml } from "./campaign-content";

assert.deepEqual(parseCampaignCards('[{"title":"Výzva","description":"Popis","url":"https://bovap.sk"}]'), [{ title: "Výzva", description: "Popis", url: "https://bovap.sk" }]);
assert.deepEqual(parseCampaignCards('not-json'), []);
assert.deepEqual(parseCampaignCards('[{"title":"PDF","description":"","url":""}]'), [{ title: "PDF", description: "", url: "" }]);
const email = renderCampaignHtml({ title: "Dôležité", bodyText: "Dobrý deň", cards: [{ title: "Výzva", description: "<script>", url: "https://bovap.sk" }], unsubscribeUrl: "https://mail.bovap.sk/odhlasenie/token" });
assert.doesNotMatch(email, /<script>|&lt;script&gt;/);
assert.match(email, /Praktické<br>informácie/);
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
assert.doesNotMatch(pdfCard, /Stiahnuť PDF|<a [^>]*display:block/);
// Starší PDF odkaz bez uložených metaúdajov: typ sa pozná z URL, veľkosť sa nevymýšľa.
const legacyPdf = renderCampaignHtml({ title: "T", bodyText: "", cards: [{ title: "Výzva", description: "", url: pdfUrl }], unsubscribeUrl: "https://bovap.sk/odhlasenie" });
assert.match(legacyPdf, /Pozrieť podrobnosti&nbsp; →<span[^>]*> · PDF<\/span>/);
// Obyčajný odkaz ostáva nezmenený.
assert.match(renderCampaignHtml({ title: "T", bodyText: "", cards: [{ title: "Web", description: "", url: "https://bovap.sk" }], unsubscribeUrl: "https://bovap.sk/odhlasenie" }), /Pozrieť podrobnosti/);
// Karta bez odkazu nemá prázdny href ani výzvu na kliknutie.
const noLink = renderCampaignHtml({ title: "T", bodyText: "", cards: [{ title: "Len info", description: "Text", url: "" }], unsubscribeUrl: "https://bovap.sk/odhlasenie" });
assert.doesNotMatch(noLink, /href=""/);
assert.doesNotMatch(noLink, /Pozrieť podrobnosti/);
// Body and card prose are justified, without stretching the last line or headings.
assert.match(paragraphs, /<div (?:class="email-text" )?style="[^"]*text-align:justify;text-align-last:left[^"]*">/);
assert.match(noLink, /<div class="email-text" style="[^"]*text-align:justify;text-align-last:left[^"]*">Text<\/div>/);
assert.doesNotMatch(paragraphs, /<h1[^>]*text-align:justify/);

// Logo v hlavičke: verejná absolútna URL, alt text, pevná šírka; súbor existuje v public/.
import { existsSync } from "node:fs";
assert.match(email, /<img src="https:\/\/mail\.bovap\.sk\/bovap-logo\.png" alt="Občianske združenie BOVAP" width="230"/);
assert.match(email, /background="https:\/\/mail\.bovap\.sk\/bovap-header\.png"[^>]*bgcolor="#173b52"/);
assert.ok(existsSync("public/bovap-header.png"), "public/bovap-header.png chýba");
assert.ok(existsSync("public/bovap-logo.png"), "public/bovap-logo.png chýba");

// Mobil: hlavička sa zmenší a popisok sa skryje, inak by roztiahla email nad šírku displeja.
assert.match(email, /@media only screen and \(max-width:620px\)\{[^<]*\.header-logo\{width:170px!important\}\.header-tag\{display:none!important\}/);
assert.match(email, /class="header-logo"/);
assert.match(email, /class="header-tag"/);

// Štruktúra: tabuľky sú vyvážené a obsah aj pätička sú vnútri 620 px kontajnera (inak sa email roztiahne).
const opens = (email.match(/<table\b/g) ?? []).length, closes = (email.match(/<\/table>/g) ?? []).length;
assert.equal(opens, closes);
const shellStart = email.lastIndexOf("<table", email.indexOf('class="email-shell"'));
let depth = 0, shellEnd = -1;
for (const m of email.slice(shellStart).matchAll(/<table\b|<\/table>/g)) { depth += m[0] === "</table>" ? -1 : 1; if (depth === 0) { shellEnd = shellStart + m.index!; break; } }
assert.ok(email.indexOf('class="email-pad"') < shellEnd && email.indexOf('class="footer-pad"') < shellEnd, "obsah musí byť v email-shell");
// Dlhé nezalomiteľné reťazce (napr. ______) nesmú rozťahovať email na mobile.
assert.match(email, /overflow-wrap:anywhere/);

// Mobil: odsadenie medzerami (&nbsp;) sa skryje, text nie je do bloku a čiara z „_“ sa nezalomí.
const spaced = renderCampaignHtml({ title: "T", bodyText: "<p>Úvod<br>&nbsp; &nbsp; &nbsp; • MOaPS<br>Slovo dva</p><p>____________________</p>", cards: [], unsubscribeUrl: "u" });
assert.match(spaced, / <span class="email-sp">&nbsp; &nbsp; &nbsp; <\/span>• MOaPS/);
assert.match(spaced, /Slovo dva/); // bežné medzery ostávajú
assert.match(spaced, /<span style="display:inline-block;max-width:100%;overflow:hidden;white-space:nowrap;vertical-align:bottom">_{20}<\/span>/);
assert.match(spaced, /\.email-sp\{display:none!important\}\.email-text\{text-align:left!important\}/);
assert.equal((spaced.match(/class="email-text"/g) ?? []).length, 1);
