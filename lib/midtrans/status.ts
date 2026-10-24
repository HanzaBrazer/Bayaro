import { midtransConfig, coreApiUrl } from "./config";

export interface MidtransStatus {
  transactionStatus: string;
  fraudStatus?: string;
  grossAmount?: string;
  error?: string;
}

/**
 * Cek status transaksi langsung ke Midtrans (server-to-server, otoritatif).
 * GET {coreApiUrl}/v2/{order_id}/status, Basic auth = base64(serverKey:).
 */
export async function getTransactionStatus(orderId: string): Promise<MidtransStatus> {
  if (!midtransConfig.serverKey) return { transactionStatus: "", error: "Midtrans server key belum diisi." };

  const auth = Buffer.from(`${midtransConfig.serverKey}:`).toString("base64");
  try {
    const res = await fetch(`${coreApiUrl}/v2/${encodeURIComponent(orderId)}/status`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${auth}`,
      },
      cache: "no-store",
    });
    const data = await res.json();
    // 404 = transaksi belum terbentuk di Midtrans (belum bayar).
    if (!res.ok) {
      return { transactionStatus: String(data.transaction_status ?? ""), error: data.status_message ?? undefined };
    }
    return {
      transactionStatus: String(data.transaction_status ?? ""),
      fraudStatus: data.fraud_status ? String(data.fraud_status) : undefined,
      grossAmount: data.gross_amount ? String(data.gross_amount) : undefined,
    };
  } catch {
    return { transactionStatus: "", error: "Gagal menghubungi Midtrans." };
  }
}
