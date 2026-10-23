import { midtransConfig, snapApiUrl } from "./config";

export interface SnapParams {
  orderId: string;
  grossAmount: number;
  itemName: string;
  customer: { email: string; name: string };
}

export async function createSnapTransaction(
  params: SnapParams
): Promise<{ token?: string; redirectUrl?: string; error?: string }> {
  if (!midtransConfig.serverKey) return { error: "Midtrans server key belum diisi." };

  const auth = Buffer.from(`${midtransConfig.serverKey}:`).toString("base64");
  try {
    const res = await fetch(snapApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        transaction_details: { order_id: params.orderId, gross_amount: params.grossAmount },
        item_details: [{ id: "pro-monthly", price: params.grossAmount, quantity: 1, name: params.itemName }],
        customer_details: { email: params.customer.email, first_name: params.customer.name },
        credit_card: { secure: true },
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.token) {
      const msg = Array.isArray(data.error_messages) ? data.error_messages.join(", ") : "Gagal membuat transaksi Snap.";
      return { error: msg };
    }
    return { token: data.token as string, redirectUrl: data.redirect_url as string };
  } catch {
    return { error: "Gagal menghubungi Midtrans." };
  }
}
