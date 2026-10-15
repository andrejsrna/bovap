import assert from "node:assert/strict";
import { BG_COLORS, parseBodyBlocks, serializeBodyBlocks } from "./body-blocks";
import { parseCampaignCards, renderCampaignHtml } from "./campaign-content";

const blue = BG_COLORS[0].value;

// Starý formát: jeden obyčajný text/HTML = jeden blok bez pozadia.
assert.deepEqual(parseBodyBlocks("<p>Ahoj</p>"), [{ html: "<p>Ahoj</p>", bg: "" }]);
assert.deepEqual(parseBodyBlocks(""), [{ html: "", bg: "" }]);
// Text začínajúci hranatou zátvorkou nie je JSON blokov.
assert.deepEqual(parseBodyBlocks("[1] Poznámka"), [{ html: "[1] Poznámka", bg: "" }]);

// Jeden blok bez farby sa ukladá ako čistý text (spätná kompatibilita, duplikácia, odosielanie).
assert.equal(serializeBodyBlocks([{ html: "<p>Ahoj</p>", bg: "" }]), "<p>Ahoj</p>");
// Viac blokov alebo farba = JSON; prázdne bloky sa zahodia.
const json = serializeBodyBlocks([{ html: "A", bg: blue }, { html: "  ", bg: blue }, { html: "B", bg: "" }]);
assert.deepEqual(parseBodyBlocks(json), [{ html: "A", bg: blue }, { html: "B", bg: "" }]);
// Neplatná farba (injekcia štýlu) sa zahodí.
assert.deepEqual(parseBodyBlocks('[{"html":"X","bg":"red;background:url(x)"}]'), [{ html: "X", bg: "" }]);

const render = (bodyText: string, cards: Parameters<typeof renderCampaignHtml>[0]["cards"] = []) =>
  renderCampaignHtml({ title: "T", bodyText, cards, unsubscribeUrl: "https://bovap.sk/odhlasenie" });

// Email: každý blok zvlášť, farebný v bunke s pozadím; bez farby bez pozadia.
const multi = render(json);
assert.match(multi, new RegExp(`<td style="background:${blue};padding:12px 16px;border-radius:10px">`));
assert.equal((multi.match(/text-align:justify/g) ?? []).length, 2);
assert.ok(multi.indexOf(">A<") < multi.indexOf(">B<"));
assert.doesNotMatch(render("<p>Ahoj</p>"), /padding:12px 16px/);

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
