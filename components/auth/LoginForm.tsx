"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { signInAction, type AuthState } from "@/lib/auth/actions";
import { Input, PasswordInput, Checkbox, Button } from "@/components/ui";
import { GoogleButton } from "./GoogleButton";

const initial: AuthState = { error: null };

export function LoginForm() {
  const [state, action, pending] = useActionState(signInAction, initial);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Selamat datang kembali</h1>
        <p className="text-sm text-muted">Masuk untuk mengelola invoice-mu.</p>
      </div>

      {state.error && (
        <div className="flex items-center gap-2 rounded-input border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <Input label="Email" name="email" type="email" placeholder="nama@email.com" required autoComplete="email" />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-[13px] font-medium text-ink">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:text-primary-hover">
              Lupa password?
            </Link>
          </div>
          <PasswordInput id="login-password" name="password" placeholder="••••••••" required autoComplete="current-password" />
        </div>

        <Checkbox name="remember" label="Ingat saya" defaultChecked />

        <Button type="submit" loading={pending} className="w-full">
          Masuk
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        atau
        <span className="h-px flex-1 bg-line" />
      </div>

      <GoogleButton />

      <p className="text-center text-sm text-muted">
        Belum punya akun?{" "}
        <Link href="/signup" className="font-medium text-primary hover:text-primary-hover">
          Daftar
        </Link>
      </p>
    </div>
  );
}
