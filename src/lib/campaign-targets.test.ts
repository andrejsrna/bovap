import assert from "node:assert/strict";
import { ALL_GROUPS, checkSendTarget, lockedGroups, parseSentGroups, recordSentGroups } from "./campaign-targets";

const at = new Date("2026-10-19T16:00:00Z");

// Nová kampaň: nič nie je zamknuté.
assert.deepEqual(parseSentGroups("[]"), []);
assert.deepEqual(parseSentGroups("nie-json"), []);
assert.deepEqual(parseSentGroups('[{"name":"Stred","at":"2026-10-19T16:00:00.000Z"},{"x":1}]'), [{ name: "Stred", at: "2026-10-19T16:00:00.000Z" }]);
assert.equal(checkSendTarget([], true, []), null);
assert.equal(checkSendTarget([], false, ["Stred"]), null);
assert.equal(checkSendTarget([], false, []), "empty");

// Po odoslaní na Stred: Stred aj „Všetci“ sú zamknuté, ostatné skupiny voľné.
const stred = recordSentGroups([], false, ["Stred"], at);
assert.deepEqual(stred, [{ name: "Stred", at: at.toISOString() }]);
assert.equal(checkSendTarget(stred, false, ["Stred"]), "locked");
assert.equal(checkSendTarget(stred, false, ["Východ", "Stred"]), "locked");
assert.equal(checkSendTarget(stred, true, []), "all-locked");
assert.equal(checkSendTarget(stred, false, ["Východ"]), null);
assert.deepEqual(lockedGroups(stred), { all: true, everything: false, names: ["Stred"] });

// Ďalšie odoslanie sa pripíše, existujúce záznamy (dátum) ostanú.
const both = recordSentGroups(stred, false, ["Východ"], new Date("2026-10-21T08:00:00Z"));
assert.deepEqual(both.map((entry) => entry.name), ["Stred", "Východ"]);
assert.equal(both[0].at, at.toISOString());

// Odoslanie všetkým zamkne úplne všetko.
const all = recordSentGroups([], true, [], at);
assert.deepEqual(all, [{ name: ALL_GROUPS, at: at.toISOString() }]);
assert.equal(checkSendTarget(all, false, ["Západ"]), "all-locked");
assert.equal(lockedGroups(all).all, true);
assert.equal(lockedGroups(all).everything, true);
assert.equal(lockedGroups(stred).everything, false);

console.log("campaign-targets: OK");
