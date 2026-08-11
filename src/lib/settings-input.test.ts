import assert from "node:assert/strict";
import { parseTestRecipients, validGroupName } from "./settings-input";

assert.deepEqual(parseTestRecipients("A@EXAMPLE.SK, b@example.sk\ninvalid, A@example.sk"), ["a@example.sk", "b@example.sk"]);
assert.equal(validGroupName(" Západ "), "Západ");
assert.equal(validGroupName(" "), null);
console.log("settings-input: OK");
