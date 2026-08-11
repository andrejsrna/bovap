import assert from "node:assert/strict";
import { normalizeSubscriberQuery } from "./subscriber-query";

assert.deepEqual(
  normalizeSubscriberQuery({ q: "  OBEC@TEST.SK ", page: "-2", status: "NOPE" }),
  { q: "obec@test.sk", page: 1, status: undefined, skupina: undefined },
);
assert.deepEqual(
  normalizeSubscriberQuery({ page: "3", status: "UNSUBSCRIBED", skupina: " Západ " }),
  { q: "", page: 3, status: "UNSUBSCRIBED", skupina: "Západ" },
);
console.log("subscriber-query: OK");
