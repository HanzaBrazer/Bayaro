import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Menggabungkan nama class Tailwind dengan aman
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format angka ke format Rupiah Indonesia (misal: 1500000 -> "1.500.000")
 */
export function formatRupiah(amount: number | string): string {
  const numeric = typeof amount === "string" ? parseFloat(amount.replace(/[^0-9.-]+/g, "")) : amount;
  if (isNaN(numeric)) return "0";
  return new Intl.NumberFormat("id-ID").format(numeric);
}

/**
 * Format tanggal ke format lokal Indonesia (misal: "17 Okt 2026")
 */
export function formatDateID(dateInput: Date | string): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(d);
}

/**
 * Ubah angka rupiah menjadi kata (untuk kwitansi).
 * mis. 1500000 -> "Satu juta lima ratus ribu rupiah"
 */
export function terbilang(input: number): string {
  const n = Math.floor(Math.abs(input || 0));
  const satuan = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];
  const toWords = (x: number): string => {
    if (x < 12) return satuan[x];
    if (x < 20) return `${toWords(x - 10)} belas`;
    if (x < 100) return `${toWords(Math.floor(x / 10))} puluh${x % 10 ? ` ${toWords(x % 10)}` : ""}`;
    if (x < 200) return `seratus${x % 100 ? ` ${toWords(x % 100)}` : ""}`;
    if (x < 1000) return `${toWords(Math.floor(x / 100))} ratus${x % 100 ? ` ${toWords(x % 100)}` : ""}`;
    if (x < 2000) return `seribu${x % 1000 ? ` ${toWords(x % 1000)}` : ""}`;
    if (x < 1_000_000) return `${toWords(Math.floor(x / 1000))} ribu${x % 1000 ? ` ${toWords(x % 1000)}` : ""}`;
    if (x < 1_000_000_000) return `${toWords(Math.floor(x / 1_000_000))} juta${x % 1_000_000 ? ` ${toWords(x % 1_000_000)}` : ""}`;
    if (x < 1_000_000_000_000) return `${toWords(Math.floor(x / 1_000_000_000))} miliar${x % 1_000_000_000 ? ` ${toWords(x % 1_000_000_000)}` : ""}`;
    return `${toWords(Math.floor(x / 1_000_000_000_000))} triliun${x % 1_000_000_000_000 ? ` ${toWords(x % 1_000_000_000_000)}` : ""}`;
  };
  if (n === 0) return "Nol rupiah";
  const w = toWords(n).replace(/\s+/g, " ").trim();
  return `${w.charAt(0).toUpperCase()}${w.slice(1)} rupiah`;
}
