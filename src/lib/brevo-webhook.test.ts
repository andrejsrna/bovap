import assert from "node:assert/strict";
import { normalizeBrevoEvent, parseCustomRef } from "./brevo-webhook";

// Mapovanie Brevo eventov.
assert.equal(normalizeBrevoEvent({ event: "delivered" }), "DELIVERED");
assert.equal(normalizeBrevoEvent({ event: "opened" }), "OPENED");
assert.equal(normalizeBrevoEvent({ event: "unique_opened" }), "OPENED");
assert.equal(normalizeBrevoEvent({ event: "click" }), "CLICKED");
assert.equal(normalizeBrevoEvent({ event: "soft_bounce" }), "SOFT_BOUNCE");
assert.equal(normalizeBrevoEvent({ event: "hard_bounce" }), "HARD_BOUNCE");
assert.equal(normalizeBrevoEvent({ event: "complaint" }), "COMPLAINT");
assert.equal(normalizeBrevoEvent({ event: "unsubscribed" }), "UNSUBSCRIBED");
assert.equal(normalizeBrevoEvent({ event: "blocked" }), "BLOCKED");
assert.equal(normalizeBrevoEvent({ event: "error" }), "ERROR");
// Neznáme / technické eventy sa ignorujú (idempotentne).
assert.equal(normalizeBrevoEvent({ event: "deferred" }), "IGNORED");
assert.equal(normalizeBrevoEvent({ event: "request" }), "IGNORED");
assert.equal(normalizeBrevoEvent({ event: "nieco-neznane" }), "IGNORED");
assert.equal(normalizeBrevoEvent({}), "IGNORED");

// X-Mailin-custom párovanie kampane a príjemcu.
assert.deepEqual(
  parseCustomRef({
    "X-Mailin-custom": JSON.stringify({ campaignId: "c1", recipientId: "r1" }),
  }),
  { campaignId: "c1", recipientId: "r1" },
);
assert.deepEqual(parseCustomRef({}), {});
assert.deepEqual(parseCustomRef({ "X-Mailin-custom": "nie-json" }), {});

console.log("brevo-webhook: OK");
