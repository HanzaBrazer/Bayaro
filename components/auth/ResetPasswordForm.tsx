"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { resetPasswordAction, type AuthState } from "@/lib/auth/actions";
import { PasswordInput, Button } from "@/components/ui";

const initial: AuthState = { error: null };

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPasswordAction, initial);
  const [password, setPassword] = useState("");
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.error && !pending) {
      passwordRef.current?.focus();
      passwordRef.current?.select();
    }
  }, [state, pending]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Password baru</h1>
        <p className="text-sm text-muted">Masukkan password baru untuk akunmu.</p>
      </div>

      {state.error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-input border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <PasswordInput
          ref={passwordRef}
          label="Password baru"
          name="password"
          aria-invalid={state.error ? true : undefined}
          placeholder="Minimal 8 karakter"
          required
          minLength={8}
          autoComplete="new-password"
          showStrength
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" loading={pending} className="w-full">
          Simpan password
        </Button>
      </form>
    </div>
  );
}
