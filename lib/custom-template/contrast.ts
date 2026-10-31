/** Rasio kontras WCAG antara warna hex dan putih (teks di atas pita/kepala tabel). */
export function contrastWithWhite(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return 1;
  const n = parseInt(m[1], 16);
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const L = 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
  return 1.05 / (L + 0.05);
}

/** WCAG AA untuk teks normal: minimal 4.5:1. */
export const passesAA = (hex: string) => contrastWithWhite(hex) >= 4.5;

/** 8 warna aksen siap pakai — semua lolos AA terhadap teks putih kecuali yang berlabel "kontras rendah". */
export const SWATCHES: { hex: string; label: string }[] = [
  { hex: "#2E7D5B", label: "Hijau Bayaro" },
  { hex: "#1C1A17", label: "Hitam arang" },
  { hex: "#1F4E8C", label: "Biru tua" },
  { hex: "#5B3C88", label: "Ungu" },
  { hex: "#A63D40", label: "Merah bata" },
  { hex: "#0F766E", label: "Toska" },
  { hex: "#8A6D1F", label: "Emas tua" },
  { hex: "#C9A227", label: "Emas terang (kontras rendah)" },
];
