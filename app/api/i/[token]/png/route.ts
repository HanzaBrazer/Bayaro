import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { launchBrowser } from "@/lib/pdf/browser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const admin = createAdminClient();
  const { data: inv } = await admin.from("invoices").select("number").eq("public_token", token).maybeSingle();
  if (!inv) return new NextResponse("Invoice tidak ditemukan", { status: 404 });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin).replace(/\/$/, "");
  const target = `${appUrl}/i/${token}?print=1`;

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 2 });
    await page.goto(target, { waitUntil: "networkidle", timeout: 30000 });
    const el = page.locator("#invoice-doc").first();
    await el.waitFor({ state: "visible", timeout: 10000 });
    const png = await el.screenshot({ type: "png" });
    return new NextResponse(Buffer.from(png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${inv.number || "invoice"}.png"`,
      },
    });
  } catch {
    return new NextResponse("Gagal membuat PNG", { status: 500 });
  } finally {
    await browser.close();
  }
}
