import assert from "node:assert/strict";
import nextConfig from "../../next.config";

// PDF až 10 MB (r2-pdf.ts) musí prejsť server akciou aj proxy; predvolený limit je 1 MB.
const MB = 1024 * 1024;
const toBytes = (value: string | number | undefined) => {
  if (typeof value === "number") return value;
  const m = /^(\d+(?:\.\d+)?)\s*(mb|kb|b)?$/i.exec(value ?? "");
  if (!m) return 0;
  return Number(m[1]) * ({ mb: MB, kb: 1024, b: 1 }[(m[2] ?? "b").toLowerCase() as "mb" | "kb" | "b"]);
};
const exp = nextConfig.experimental;
assert.ok(toBytes(exp?.serverActions?.bodySizeLimit) >= 11 * MB, "serverActions.bodySizeLimit musí byť aspoň 11 MB");
assert.ok(toBytes(exp?.proxyClientMaxBodySize) >= 11 * MB, "proxyClientMaxBodySize musí byť aspoň 11 MB");
console.log("next-config: OK");
