"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { appUrl } from "@/lib/app-url";

export type AuthState = { error: string | null; message?: string | null };

function readForm(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    fullName: String(formData.get("fullName") ?? "").trim(),
  };
}

export async function signInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readForm(formData);
  if (!email || !password) return { error: "Email dan password wajib diisi." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email atau password salah." };

  let dest = "/dashboard";
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase.from("users").select("onboarded").eq("id", user.id).maybeSingle();
    dest = profile?.onboarded ? "/dashboard" : "/onboarding";
  }
  redirect(dest);
}

export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password, fullName } = readForm(formData);
  if (!fullName) return { error: "Nama lengkap wajib diisi." };
  if (!email) return { error: "Email wajib diisi." };
  if (password.length < 8) return { error: "Password minimal 8 karakter." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      return { error: "Email sudah terdaftar. Silakan masuk." };
    }
    return { error: "Gagal membuat akun. Coba lagi." };
  }

  // Jika "Confirm email" aktif, sesi belum ada → minta cek email.
  if (!data.session) {
    return { error: null, message: "Cek email untuk verifikasi, lalu masuk." };
  }

  redirect("/onboarding");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Email wajib diisi." };

  const supabase = await createClient();
  const base = appUrl() || "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${base}/auth/callback?next=/reset-password`,
  });
  if (error) return { error: "Gagal mengirim email reset. Coba lagi." };

  return { error: null, message: "Jika email terdaftar, tautan reset sudah dikirim." };
}

export async function resetPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Password minimal 8 karakter." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Gagal memperbarui password. Minta tautan baru." };

  redirect("/dashboard");
}
