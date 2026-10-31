/**
 * Menyiapkan berkas kop surat di sisi BROWSER.
 *
 * PDF dirender halaman pertamanya menjadi PNG selebar A4 (794px @ 96dpi → 2x
 * supaya tajam saat dicetak), sehingga renderer invoice & ekspor PDF/PNG cukup
 * menangani satu jenis berkas: gambar.
 */

import { MAX_LETTERHEAD_BYTES } from "./types";

export const LETTERHEAD_ACCEPT = "application/pdf,image/png,image/jpeg";

/** Lebar A4 pada 96dpi; dikali 2 agar tetap tajam saat diekspor. */
const A4_W = 794;
const SCALE = 2;

export type PreparedLetterhead = { blob: Blob; ext: "png" | "jpg"; contentType: string };

const fail = (message: string) => ({ error: message } as const);

export async function prepareLetterhead(
  file: File
): Promise<{ error: string } | { error: null; file: PreparedLetterhead }> {
  if (file.size === 0) return fail("Berkas kosong. Pilih berkas lain.");
  if (file.size > MAX_LETTERHEAD_BYTES) {
    return fail(`Ukuran berkas maksimal 5 MB (berkas ini ${(file.size / 1024 / 1024).toFixed(1)} MB).`);
  }

  const type = file.type || "";
  if (type === "image/png") return { error: null, file: { blob: file, ext: "png", contentType: "image/png" } };
  if (type === "image/jpeg") return { error: null, file: { blob: file, ext: "jpg", contentType: "image/jpeg" } };
  if (type !== "application/pdf") return fail("Format harus PDF, PNG, atau JPG.");

  return pdfFirstPageToPng(file);
}

async function pdfFirstPageToPng(
  file: File
): Promise<{ error: string } | { error: null; file: PreparedLetterhead }> {
  let page;
  try {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    page = await doc.getPage(1);
  } catch (e) {
    const name = (e as { name?: string })?.name ?? "";
    if (name === "PasswordException") return fail("PDF ini terkunci kata sandi. Buka proteksinya lalu unggah lagi.");
    if (name === "InvalidPDFException") return fail("Berkas PDF rusak atau tidak bisa dibaca.");
    return fail("Gagal membaca PDF. Coba simpan ulang sebagai PNG lalu unggah.");
  }

  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: (A4_W * SCALE) / base.width });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const canvasContext = canvas.getContext("2d");
  if (!canvasContext) return fail("Browser tidak mendukung pembuatan gambar dari PDF.");

  // Latar putih: PDF transparan tidak boleh jadi hitam saat diubah ke PNG.
  canvasContext.fillStyle = "#FFFFFF";
  canvasContext.fillRect(0, 0, canvas.width, canvas.height);

  try {
    await page.render({ canvasContext, viewport }).promise;
  } catch {
    return fail("Gagal menggambar halaman PDF. Coba simpan ulang sebagai PNG lalu unggah.");
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return fail("Gagal membuat gambar dari PDF.");
  if (blob.size > MAX_LETTERHEAD_BYTES) {
    return fail("Hasil konversi PDF lebih dari 5 MB. Sederhanakan desain kop surat lalu unggah lagi.");
  }
  return { error: null, file: { blob, ext: "png", contentType: "image/png" } };
}
