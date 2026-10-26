"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "payment-proofs";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp"];

export interface PendingProof {
  id: string;
  invoiceId: string;
  number: string;
  clientName: string | null;
  amount: number | null;
  paidAt: string | null;
  note: string | null;
  createdAt: string;
  /** Signed URL berumur pendek (bucket privat). */
  imageUrl: string | null;
}

/* ===================== SISI PUBLIK (tanpa login) ===================== */

/**
 * Siapkan unggahan bukti: validasi invoice & kuota klaim, lalu balas
 * signed upload URL. File diunggah LANGSUNG dari browser ke bucket privat,
 * jadi tidak melewati server (bebas batas body Server Action).
 */
export async function requestProofUpload(
  publicToken: string,
  ext: string
): Promise<{ error: string | null; path?: string; uploadToken?: string }> {
  const safeExt = ALLOWED_EXT.includes(ext.toLowerCase()) ? ext.toLowerCase() : null;
  if (!safeExt) return { error: "Format bukti harus JPG, PNG, atau WebP." };

  const admin = createAdminClient();
  const { data: inv } = await admin
    .from("invoices")
    .select("id,status")
    .eq("public_token", publicToken)
    .maybeSingle();
  if (!inv) return { error: "Invoice tidak ditemukan." };
  if (inv.status === "lunas") return { error: "Invoice ini sudah lunas." };

  const { data: pending } = await admin
    .from("payment_proofs")
    .select("id")
    .eq("invoice_id", inv.id)
    .eq("status", "pending")
    .maybeSingle();
  if (pending) return { error: "Sudah ada konfirmasi yang menunggu ditinjau." };

  const path = `${inv.id}/${crypto.randomUUID()}.${safeExt}`;
  const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { error: "Gagal menyiapkan unggahan. Coba lagi." };

  return { error: null, path: data.path, uploadToken: data.token };
}

/** Kirim klaim pembayaran setelah bukti terunggah. */
export async function submitPaymentProof(
  publicToken: string,
  input: { path: string; amount: number; paidAt: string; note: string }
): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const { data: inv } = await admin
    .from("invoices")
    .select("id,status")
    .eq("public_token", publicToken)
    .maybeSingle();
  if (!inv) return { error: "Invoice tidak ditemukan." };
  if (inv.status === "lunas") return { error: "Invoice ini sudah lunas." };

  const folder = inv.id as string;
  if (!input.path.startsWith(`${folder}/`)) return { error: "Berkas bukti tidak valid." };
  if (!input.amount || input.amount <= 0) return { error: "Nominal pembayaran wajib diisi." };
  if (!input.paidAt) return { error: "Tanggal pembayaran wajib diisi." };

  // Pastikan file benar-benar ada & ukurannya wajar (klien bisa saja mengarang path).
  const name = input.path.slice(folder.length + 1);
  const { data: files } = await admin.storage.from(BUCKET).list(folder, { search: name, limit: 1 });
  const file = files?.find((f) => f.name === name);
  if (!file) return { error: "Bukti pembayaran belum terunggah." };
  const size = (file.metadata as { size?: number } | null)?.size ?? 0;
  if (size > MAX_BYTES) {
    await admin.storage.from(BUCKET).remove([input.path]);
    return { error: "Ukuran bukti maksimal 5 MB." };
  }

  const { error } = await admin.from("payment_proofs").insert({
    invoice_id: folder,
    image_path: input.path,
    amount: input.amount,
    paid_at: input.paidAt,
    note: input.note.trim() || null,
  });
  if (error) {
    // 23505 = unique index parsial: sudah ada klaim pending.
    if (error.code === "23505") return { error: "Sudah ada konfirmasi yang menunggu ditinjau." };
    return { error: "Gagal mengirim konfirmasi. Coba lagi." };
  }
  return { error: null };
}

/** Status klaim untuk ditampilkan di halaman publik. */
export async function getPublicClaimStatus(publicToken: string): Promise<"none" | "pending" | "rejected"> {
  const admin = createAdminClient();
  const { data: inv } = await admin.from("invoices").select("id").eq("public_token", publicToken).maybeSingle();
  if (!inv) return "none";
  const { data } = await admin
    .from("payment_proofs")
    .select("status")
    .eq("invoice_id", inv.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return "none";
  return data.status === "pending" ? "pending" : data.status === "rejected" ? "rejected" : "none";
}

/* ===================== SISI OWNER (perlu login) ===================== */

/** Semua klaim menunggu konfirmasi milik workspace user (RLS yang membatasi). */
export async function listPendingProofs(): Promise<PendingProof[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("payment_proofs")
    .select("id,invoice_id,image_path,amount,paid_at,note,created_at,invoices(number,client_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (!data || data.length === 0) return [];

  const admin = createAdminClient();
  return Promise.all(
    data.map(async (p: Record<string, unknown>) => {
      const inv = p.invoices as { number?: string; client_name?: string | null } | null;
      const { data: signed } = await admin.storage
        .from(BUCKET)
        .createSignedUrl(p.image_path as string, 300);
      return {
        id: p.id as string,
        invoiceId: p.invoice_id as string,
        number: inv?.number ?? "—",
        clientName: inv?.client_name ?? null,
        amount: p.amount === null ? null : Number(p.amount),
        paidAt: (p.paid_at as string) ?? null,
        note: (p.note as string) ?? null,
        createdAt: p.created_at as string,
        imageUrl: signed?.signedUrl ?? null,
      };
    })
  );
}

/** Klaim menunggu konfirmasi untuk satu invoice (dipakai modal tinjau). */
export async function getPendingProofFor(invoiceId: string): Promise<PendingProof | null> {
  const all = await listPendingProofs();
  return all.find((p) => p.invoiceId === invoiceId) ?? null;
}

/** Owner menyetujui klaim → invoice jadi LUNAS. */
export async function confirmProof(proofId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir. Masuk lagi." };

  // RLS memastikan baris ini milik workspace user.
  const { data: proof } = await supabase
    .from("payment_proofs")
    .select("id,invoice_id,status")
    .eq("id", proofId)
    .maybeSingle();
  if (!proof) return { error: "Konfirmasi tidak ditemukan." };
  if (proof.status !== "pending") return { error: "Konfirmasi ini sudah ditinjau." };

  const { error: upErr } = await supabase
    .from("payment_proofs")
    .update({ status: "accepted", reviewed_at: new Date().toISOString() })
    .eq("id", proofId);
  if (upErr) return { error: "Gagal menyimpan konfirmasi." };

  const { error: invErr } = await supabase
    .from("invoices")
    .update({ status: "lunas" })
    .eq("id", proof.invoice_id);
  if (invErr) return { error: "Status invoice gagal diperbarui." };

  return { error: null };
}

/** Owner menolak klaim → klien boleh mengirim ulang. */
export async function rejectProof(proofId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir. Masuk lagi." };

  const { error } = await supabase
    .from("payment_proofs")
    .update({ status: "rejected", reviewed_at: new Date().toISOString() })
    .eq("id", proofId)
    .eq("status", "pending");
  return { error: error ? "Gagal menolak konfirmasi." : null };
}
