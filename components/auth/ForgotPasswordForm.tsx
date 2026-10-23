"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { forgotPasswordAction, type AuthState } from "@/lib/auth/actions";
import { Input, Button } from "@/components/ui";

const initial: AuthState = { error: null };

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, initial);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Lupa password</h1>
        <p className="text-sm text-muted">Masukkan email, kami kirim tautan reset.</p>
      </div>

      {state.error && (
        <div className="flex items-center gap-2 rounded-input border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}
      {state.message && (
        <div className="flex items-center gap-2 rounded-input border border-primary/30 bg-primary-soft px-3 py-2 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {state.message}
        </div>
      )}

      <form action={action} className="space-y-4">
        <Input label="Email" name="email" type="email" placeholder="nama@email.com" required autoComplete="email" />
        <Button type="submit" loading={pending} className="w-full">
          Kirim tautan reset
        </Button>
      </form>

      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Masuk
      </Link>
    </div>
  );
}
