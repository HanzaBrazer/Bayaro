import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { midtransConfig } from "@/lib/midtrans/config";
import { PRO_DAYS } from "@/lib/billing/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Webhook Midtrans — SUMBER KEBENARAN pembayaran.
// Verifikasi signature + idempotent (notifikasi ganda tak menggandakan upgrade).
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new NextResponse("bad request", { status: 400 });
  }

  const orderId = String(body.order_id ?? "");
  const statusCode = String(body.status_code ?? "");
  const grossAmount = String(body.gross_amount ?? "");
  const signature = String(body.signature_key ?? "");
  const transactionStatus = String(body.transaction_status ?? "");
  const fraudStatus = body.fraud_status ? String(body.fraud_status) : undefined;

  // Verifikasi signature: sha512(order_id + status_code + gross_amount + ServerKey)
  const expected = crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${midtransConfig.serverKey}`)
    .digest("hex");
  if (!signature || expected !== signature) {
    return new NextResponse("invalid signature", { status: 403 });
  }

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("id,status")
    .eq("midtrans_order_id", orderId)
    .maybeSingle();

  // Order tak dikenal → balas 200 (idempotent, tak melakukan apa-apa).
  if (!sub) return NextResponse.json({ ok: true });

  const paid =
    (transactionStatus === "settlement" || transactionStatus === "capture") &&
    (fraudStatus === undefined || fraudStatus === "accept");

  if (paid) {
    // Idempotent: jika sudah active, jangan perpanjang lagi.
    if (sub.status !== "active") {
      const end = new Date();
      end.setDate(end.getDate() + PRO_DAYS);
      await admin
        .from("subscriptions")
        .update({ status: "active", current_period_end: end.toISOString(), updated_at: new Date().toISOString() })
        .eq("id", sub.id);
    }
  } else if (["deny", "cancel", "expire", "failure"].includes(transactionStatus)) {
    if (sub.status === "pending") {
      await admin
        .from("subscriptions")
        .update({ status: "inactive", updated_at: new Date().toISOString() })
        .eq("id", sub.id);
    }
  }

  return NextResponse.json({ ok: true });
}
