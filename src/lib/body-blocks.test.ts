import assert from "node:assert/strict";
import { BG_COLORS, blockBoxStyle, blockInset, parseBodyBlocks, serializeBodyBlocks } from "./body-blocks";
import { parseCampaignCards, renderCampaignHtml } from "./campaign-content";

const blue = BG_COLORS[0].value;

// Starý formát: jeden obyčajný text/HTML = jeden blok bez pozadia.
assert.deepEqual(parseBodyBlocks("<p>Ahoj</p>"), [{ html: "<p>Ahoj</p>", bg: "", border: "" }]);
assert.deepEqual(parseBodyBlocks(""), [{ html: "", bg: "", border: "" }]);
// Text začínajúci hranatou zátvorkou nie je JSON blokov.
assert.deepEqual(parseBodyBlocks("[1] Poznámka"), [{ html: "[1] Poznámka", bg: "", border: "" }]);

// Jeden blok bez farby sa ukladá ako čistý text (spätná kompatibilita, duplikácia, odosielanie).
assert.equal(serializeBodyBlocks([{ html: "<p>Ahoj</p>", bg: "", border: "" }]), "<p>Ahoj</p>");
// Viac blokov alebo farba = JSON; prázdne bloky sa zahodia.
const json = serializeBodyBlocks([{ html: "A", bg: blue, border: "" }, { html: "  ", bg: blue, border: "" }, { html: "B", bg: "", border: "left" }]);
assert.deepEqual(parseBodyBlocks(json), [{ html: "A", bg: blue, border: "" }, { html: "B", bg: "", border: "left" }]);
// Neplatná farba (injekcia štýlu) sa zahodí.
assert.deepEqual(parseBodyBlocks('[{"html":"X","bg":"red;background:url(x)"}]'), [{ html: "X", bg: "", border: "" }]);

const render = (bodyText: string, cards: Parameters<typeof renderCampaignHtml>[0]["cards"] = []) =>
  renderCampaignHtml({ title: "T", bodyText, cards, unsubscribeUrl: "https://bovap.sk/odhlasenie" });

// Email: každý blok zvlášť, farebný v bunke s pozadím; bez farby bez pozadia.
// Samotný rámik (bez farby) je tiež nastavenie bloku; neplatný rámik sa zahodí.
assert.equal(parseBodyBlocks(serializeBodyBlocks([{ html: "R", bg: "", border: "accent" }]))[0].border, "accent");
assert.equal(parseBodyBlocks('[{"html":"R","border":"x;y"}]')[0].border, "");
assert.deepEqual(blockBoxStyle("", ""), {});
assert.equal(blockBoxStyle("", "thin").border, "1px solid #cfd8e2");
assert.equal(blockBoxStyle("", "accent").border, "1px solid #1f668d");
assert.equal(blockBoxStyle("", "left").borderLeft, "4px solid #1f668d");
assert.equal(blockInset("", ""), 0);
assert.equal(blockInset("", "thin"), 32 + 2);
assert.equal(blockInset(blue, "left"), 32 + 5);

const multi = render(json);
assert.match(multi, new RegExp(`<td style="background:${blue};padding:12px 16px;border-radius:10px">`));
assert.equal((multi.match(/text-align:justify/g) ?? []).length, 2);
assert.ok(multi.indexOf(">A<") < multi.indexOf(">B<"));
assert.doesNotMatch(render("<p>Ahoj</p>"), /padding:12px 16px/);
// Orámovanie v emaile: rámik aj pruh vľavo na bunke tabuľky (funguje aj v Outlooku).
const framed = render(serializeBodyBlocks([{ html: "Rámik", bg: "", border: "thin" }, { html: "Pruh", bg: blue, border: "left" }]));
assert.match(framed, /<td style="border:1px solid #cfd8e2;padding:12px 16px;border-radius:10px">/);
assert.match(framed, new RegExp(`<td style="background-color:${blue};border:1px solid #dce4ed;border-left:4px solid #1f668d;padding:12px 16px;border-radius:10px">`.replace("background-color", "background")));

// Hlavný titulok: voliteľné pozadie z palety, neplatná farba sa ignoruje.
const titled = renderCampaignHtml({ title: "Nadpis", titleBg: blue, bodyText: "", cards: [], unsubscribeUrl: "https://bovap.sk/odhlasenie" });
assert.match(titled, new RegExp(`<td style="background:${blue};padding:12px 16px;border-radius:10px"><h1`));
assert.doesNotMatch(renderCampaignHtml({ title: "Nadpis", titleBg: "red;x:y", bodyText: "", cards: [], unsubscribeUrl: "u" }), /padding:12px 16px/);
assert.doesNotMatch(render(""), /padding:12px 16px/);

// Karty: farba pozadia sa overuje a vykreslí ako pozadie karty.
const cards = parseCampaignCards(JSON.stringify([
  { title: "Farebná", description: "", url: "", bg: blue },
  { title: "Zlá", description: "", url: "", bg: "red;x:y" },
]));
assert.equal(cards[0].bg, blue);
assert.equal(cards[1].bg, undefined);
assert.match(render("", cards), new RegExp(`style="background:${blue};border:1px solid #dce4ed;border-radius:14px"`));
assert.match(render("", [cards[1]]), /style="background:#ffffff;border:1px solid #dce4ed/);
console.log("body-blocks: OK");
