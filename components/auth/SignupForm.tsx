"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { signUpAction, type AuthState } from "@/lib/auth/actions";
import { Input, PasswordInput, Checkbox, Button } from "@/components/ui";
import { GoogleButton } from "./GoogleButton";

const initial: AuthState = { error: null };

export function SignupForm() {
  const [state, action, pending] = useActionState(signUpAction, initial);
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Buat akun Bayaro</h1>
        <p className="text-sm text-muted">Mulai menagih klien dengan rapi.</p>
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
        <Input label="Nama lengkap" name="fullName" placeholder="Nama kamu" required autoComplete="name" />
        <Input label="Email" name="email" type="email" placeholder="nama@email.com" required autoComplete="email" />
        <PasswordInput
          label="Password"
          name="password"
          placeholder="Minimal 8 karakter"
          required
          minLength={8}
          autoComplete="new-password"
          showStrength
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Checkbox
          name="agree"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          label={
            <span>
              Saya setuju dengan{" "}
              <span className="font-medium text-primary">Syarat &amp; Ketentuan</span>
            </span>
          }
        />

        <Button type="submit" loading={pending} disabled={!agree} className="w-full">
          Buat akun
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        atau
        <span className="h-px flex-1 bg-line" />
      </div>

      <GoogleButton label="Daftar dengan Google" />

      <p className="text-center text-sm text-muted">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-primary hover:text-primary-hover">
          Masuk
        </Link>
      </p>
    </div>
  );
}
