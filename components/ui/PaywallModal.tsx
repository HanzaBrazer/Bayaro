"use client";

import * as React from "react";
import { Crown } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  used?: number;
  limit?: number;
}

export function PaywallModal({ open, onClose, onUpgrade, used = 10, limit = 10 }: PaywallModalProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm" closeOnOverlay>
      <div className="flex flex-col items-center text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Crown className="h-6 w-6" />
        </span>
        <h2 className="text-lg font-semibold text-ink">Kuota harian Free habis</h2>
        <p className="mt-1 text-sm text-muted">
          Kamu sudah memakai {used}/{limit} invoice hari ini. Upgrade ke Pro untuk membuat invoice
          tanpa batas.
        </p>
        <div className="mt-6 flex w-full flex-col gap-2">
          <Button variant="primary" onClick={onUpgrade} className="w-full">
            Upgrade ke Pro
          </Button>
          <Button variant="secondary" onClick={onClose} className="w-full">
            Nanti saja
          </Button>
        </div>
      </div>
    </Modal>
  );
}
