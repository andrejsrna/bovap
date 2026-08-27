const MAX_PDF_SIZE = 10 * 1024 * 1024;

export function pdfUploadInput(file: File) {
  if (!file.size) return null;
  if (file.type !== "application/pdf" || file.size > MAX_PDF_SIZE) return null;
  const key = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return key ? { key } : null;
}

const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), (value) => value.toString(16).padStart(2, "0")).join("");
const sha256 = async (value: string | ArrayBuffer) => hex(await crypto.subtle.digest("SHA-256", typeof value === "string" ? new TextEncoder().encode(value) : value));
const hmac = async (key: ArrayBuffer | Uint8Array, value: string) => {
  const source = key instanceof Uint8Array ? key : new Uint8Array(key);
  const raw = source.slice().buffer;
  return crypto.subtle.sign("HMAC", await crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]), new TextEncoder().encode(value));
};
const dateParts = () => {
  const now = new Date();
  const iso = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { date: iso.slice(0, 8), amzDate: iso.slice(0, 16) + "Z" };
};

export async function uploadCampaignPdf(file: File, campaignId: string) {
  const input = pdfUploadInput(file);
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secret = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  if (!input || !accountId || !accessKey || !secret || !bucket || !publicUrl) throw new Error("PDF alebo R2 nastavenia nie sú platné.");
  const bytes = await file.arrayBuffer();
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") throw new Error("Súbor nie je platný PDF dokument.");

  const objectKey = `bovap/kampane/${campaignId}/${crypto.randomUUID()}-${input.key}`;
  const encodedKey = objectKey.split("/").map(encodeURIComponent).join("/");
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const payloadHash = await sha256(bytes);
  const { date, amzDate } = dateParts();
  const canonicalHeaders = `content-type:application/pdf\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = `PUT\n/${bucket}/${encodedKey}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const scope = `${date}/auto/s3/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${await sha256(canonicalRequest)}`;
  const dateKey = await hmac(new TextEncoder().encode(`AWS4${secret}`), date);
  const regionKey = await hmac(dateKey, "auto");
  const serviceKey = await hmac(regionKey, "s3");
  const signingKey = await hmac(serviceKey, "aws4_request");
  const signature = hex(await hmac(signingKey, stringToSign));
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const response = await fetch(`https://${host}/${bucket}/${encodedKey}`, { method: "PUT", headers: { "content-type": "application/pdf", host, "x-amz-content-sha256": payloadHash, "x-amz-date": amzDate, authorization }, body: bytes });
  if (!response.ok) throw new Error("PDF sa nepodarilo nahrať do úložiska.");
  return `${publicUrl}/${encodedKey}`;
}

export async function attachPdfLinks(cards: { title: string; description: string; url: string }[], formData: FormData, campaignId: string) {
  const result = [...cards];
  for (let index = 0; index < result.length; index++) {
    const file = formData.get(`pdf-${index}`);
    if (file instanceof File && file.size) result[index] = { ...result[index], url: await uploadCampaignPdf(file, campaignId) };
  }
  return result;
}
