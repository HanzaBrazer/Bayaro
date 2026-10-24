"use client";

/**
 * Ekspor invoice di sisi browser (tanpa server/Chromium) — unduhan nyata ke
 * folder perangkat (HP/laptop). Menangkap elemen #invoice-doc jadi PNG/PDF.
 * Library dimuat dinamis agar tak membebani bundel awal.
 */

async function renderCanvas(el: HTMLElement): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import("html2canvas");
  return html2canvas(el, {
    scale: 2, // tajam untuk cetak
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    windowWidth: el.scrollWidth,
  });
}

function triggerDownload(blobUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function downloadInvoicePng(el: HTMLElement, filename: string): Promise<void> {
  const canvas = await renderCanvas(el);
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Gagal membuat gambar.");
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename.endsWith(".png") ? filename : `${filename}.png`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadInvoicePdf(el: HTMLElement, filename: string): Promise<void> {
  const canvas = await renderCanvas(el);
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const maxW = pageW - margin * 2;

  // Skala gambar agar pas lebar halaman; pecah ke beberapa halaman bila tinggi.
  const imgW = maxW;
  const imgH = (canvas.height * imgW) / canvas.width;
  const img = canvas.toDataURL("image/png");

  if (imgH <= pageH - margin * 2) {
    pdf.addImage(img, "PNG", margin, margin, imgW, imgH);
  } else {
    // Dokumen panjang → potong per halaman.
    const usableH = pageH - margin * 2;
    let remaining = imgH;
    let offset = 0;
    while (remaining > 0) {
      pdf.addImage(img, "PNG", margin, margin - offset, imgW, imgH);
      remaining -= usableH;
      offset += usableH;
      if (remaining > 0) pdf.addPage();
    }
  }

  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
