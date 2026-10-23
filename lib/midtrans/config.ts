export const midtransConfig = {
  serverKey: process.env.MIDTRANS_SERVER_KEY ?? "",
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? "",
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
};

export const snapApiUrl = midtransConfig.isProduction
  ? "https://app.midtrans.com/snap/v1/transactions"
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";

export const snapJsUrl = midtransConfig.isProduction
  ? "https://app.midtrans.com/snap/snap.js"
  : "https://app.sandbox.midtrans.com/snap/snap.js";
