import type { Browser } from "playwright-core";

/**
 * Luncurkan Chromium yang tepat per lingkungan:
 * - Vercel (serverless): @sparticuz/chromium + playwright-core
 * - Lokal/dev: playwright penuh (chromium sudah ter-install Langkah 0)
 */
export async function launchBrowser(): Promise<Browser> {
  if (process.env.VERCEL) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const { chromium: pw } = await import("playwright-core");
    return pw.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const { chromium } = await import("playwright");
  return (await chromium.launch({ headless: true })) as unknown as Browser;
}
