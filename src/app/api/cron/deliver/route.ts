import { NextResponse } from "next/server";
import { processSendQueue } from "@/lib/campaign-send";

/**
 * Worker fronty odosielania: GET /api/cron/deliver?token=CRON_SECRET
 * Spracuje jednu dávku PENDING príjemcov vo všetkých SENDING kampaniach.
 * Volá Coolify cron (napr. každú minútu) alebo ručne pri retry.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "cron-off" }, { status: 503 });
  const url = new URL(req.url);
  if (url.searchParams.get("token") !== secret)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const result = await processSendQueue({});
  return NextResponse.json(result);
}
