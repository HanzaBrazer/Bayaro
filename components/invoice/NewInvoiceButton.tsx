"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button, PaywallModal } from "@/components/ui";
import { getQuotaStatus } from "@/lib/plan/actions";

export function NewInvoiceButton() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [paywall, setPaywall] = React.useState(false);
  const [quota, setQuota] = React.useState({ used: 10, limit: 10 });

  async function handleClick() {
    setLoading(true);
    const q = await getQuotaStatus();
    setLoading(false);
    if (q.plan === "free" && q.limit !== null && q.used >= q.limit) {
      setQuota({ used: q.used, limit: q.limit });
      setPaywall(true);
      return;
    }
    router.push("/invoices/new");
  }

  return (
    <>
      <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleClick} loading={loading}>
        Invoice Baru
      </Button>
      <PaywallModal
        open={paywall}
        onClose={() => setPaywall(false)}
        onUpgrade={() => router.push("/settings")}
        used={quota.used}
        limit={quota.limit}
      />
    </>
  );
}
