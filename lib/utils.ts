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
