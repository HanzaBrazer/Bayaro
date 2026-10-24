"use client";

import * as React from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { FileText, Send, CheckCircle2, Wallet, Eye, EyeOff, Users } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatCard,
  Select,
  IconButton,
  StatusBadge,
  EmptyState,
  type InvoiceStatus,
} from "@/components/ui";
import { cn, formatRupiah, formatCompactIDR, formatDateID } from "@/lib/utils";
import { CATEGORY_COLOR, CATEGORY_LABEL, type ItemCategory } from "@/lib/invoice/types";
import type { DashboardData } from "@/lib/dashboard/types";

const MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function ymToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit" }).format(new Date());
}
function lastMonths(n: number): string[] {
  const [y, m] = ymToday().split("-").map(Number);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}
function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS_ID[m - 1]} ${y}`;
}

type BarMode = "bulan" | "kuartal" | "tahun";

export function DashboardView({ data }: { data: DashboardData }) {
  const [selMonth, setSelMonth] = React.useState(ymToday());
  const [hide, setHide] = React.useState(false);
  const [barMode, setBarMode] = React.useState<BarMode>("bulan");

  const money = (n: number) => (hide ? "Rp ••••••" : `Rp ${formatRupiah(n)}`);
  const moneyC = (n: number) => (hide ? "Rp ••••••" : formatCompactIDR(n));

  const monthOptions = React.useMemo(() => lastMonths(12).reverse().map((ym) => ({ value: ym, label: monthLabel(ym) })), []);

  // Stat cards
  const totalCount = data.invoices.length;
  const terkirim = data.invoices.filter((i) => i.status === "terkirim").length;
  const lunas = data.invoices.filter((i) => i.status === "lunas").length;
  const nilaiBulan = data.invoices.filter((i) => i.issueDate.startsWith(selMonth)).reduce((s, i) => s + i.total, 0);

  // Bar series (12 bulan) + agregasi
  const barData = React.useMemo(() => {
    const months = lastMonths(12);
    const perMonth = months.map((ym) => ({
      ym,
      value: data.invoices.filter((i) => i.issueDate.startsWith(ym)).reduce((s, i) => s + i.total, 0),
    }));
    if (barMode === "bulan") {
      return perMonth.map((p) => ({ label: MONTHS_SHORT[Number(p.ym.split("-")[1]) - 1], value: p.value }));
    }
    if (barMode === "kuartal") {
      const map = new Map<string, number>();
      perMonth.forEach((p) => {
        const [y, m] = p.ym.split("-").map(Number);
        const key = `Q${Math.floor((m - 1) / 3) + 1} ${String(y).slice(2)}`;
        map.set(key, (map.get(key) ?? 0) + p.value);
      });
      return [...map].map(([label, value]) => ({ label, value }));
    }
    const map = new Map<string, number>();
    perMonth.forEach((p) => {
      const y = p.ym.split("-")[0];
      map.set(y, (map.get(y) ?? 0) + p.value);
    });
    return [...map].map(([label, value]) => ({ label, value }));
  }, [data.invoices, barMode]);

  // Donut kategori (bulan terpilih)
  const donut = React.useMemo(() => {
    const totals = new Map<ItemCategory, number>();
    data.items
      .filter((it) => it.issueDate.startsWith(selMonth))
      .forEach((it) => {
        const c = (["barang", "jasa", "transportasi", "lainnya"].includes(it.category) ? it.category : "lainnya") as ItemCategory;
        totals.set(c, (totals.get(c) ?? 0) + it.subtotal);
      });
    const rows = (["barang", "jasa", "transportasi", "lainnya"] as ItemCategory[])
      .map((c) => ({ key: c, name: CATEGORY_LABEL[c], value: totals.get(c) ?? 0, color: CATEGORY_COLOR[c] }))
      .filter((r) => r.value > 0);
    const total = rows.reduce((s, r) => s + r.value, 0);
    return { rows, total };
  }, [data.items, selMonth]);

  // Aktivitas & klien teratas
  const recent = data.invoices.slice(0, 5);
  const topClients = React.useMemo(() => {
    const map = new Map<string, { id: string | null; name: string; total: number }>();
    data.invoices.forEach((i) => {
      const key = i.clientId ?? `name:${i.clientName ?? "—"}`;
      const cur = map.get(key) ?? { id: i.clientId, name: i.clientName ?? "—", total: 0 };
      cur.total += i.total;
      map.set(key, cur);
    });
    return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 5);
  }, [data.invoices]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="w-44">
          <Select options={monthOptions} value={selMonth} onChange={setSelMonth} />
        </div>
        <IconButton aria-label={hide ? "Tampilkan nominal" : "Sembunyikan nominal"} variant="secondary" onClick={() => setHide((v) => !v)}>
          {hide ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </IconButton>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<FileText className="h-4 w-4" />} label="Total Invoice" value={totalCount} />
        <StatCard icon={<Send className="h-4 w-4" />} label="Terkirim" value={terkirim} />
        <Link href="/invoices?status=lunas" className="rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Lunas" value={lunas} hint="Lihat invoice lunas →" />
        </Link>
        <StatCard icon={<Wallet className="h-4 w-4" />} label={`Nilai ${MONTHS_ID[Number(selMonth.split("-")[1]) - 1]}`} value={moneyC(nilaiBulan)} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Nilai Invoice</CardTitle>
            <div className="flex gap-1 rounded-btn border border-line p-0.5">
              {(["bulan", "kuartal", "tahun"] as BarMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setBarMode(m)}
                  className={cn(
                    "rounded-btn px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                    barMode === m ? "bg-primary-soft text-primary" : "text-muted hover:text-ink"
                  )}
                >
                  {m === "bulan" ? "Bulanan" : m === "kuartal" ? "Kuartal" : "Tahun"}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#E7E3DA" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#6B655B" }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    tick={{ fontSize: 11, fill: "#6B655B" }}
                    tickFormatter={(v: number) =>
                      v >= 1_000_000 ? formatCompactIDR(v, false) : v >= 1000 ? `${Math.round(v / 1000)}rb` : String(v)
                    }
                  />
                  <Tooltip
                    cursor={{ fill: "#E6F1EC" }}
                    content={({ active, payload, label }) =>
                      active && payload && payload.length ? (
                        <div className="rounded-card border border-line bg-surface px-3 py-2 text-xs shadow-dropdown">
                          <p className="font-medium text-ink">{label}</p>
                          <p className="font-mono tabular-nums text-primary">{money(Number(payload[0].value))}</p>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="value" fill="#2E7D5B" radius={[4, 4, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rincian Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            {donut.rows.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted">Belum ada data bulan ini.</p>
            ) : (
              <>
                <div className="relative mx-auto h-44 w-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donut.rows} dataKey="value" nameKey="name" innerRadius={54} outerRadius={78} paddingAngle={2} stroke="none">
                        {donut.rows.map((r) => (
                          <Cell key={r.key} fill={r.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) =>
                          active && payload && payload.length ? (
                            <div className="rounded-card border border-line bg-surface px-3 py-2 text-xs shadow-dropdown">
                              <p className="font-medium text-ink">{payload[0].name}</p>
                              <p className="font-mono tabular-nums text-ink">
                                {money(Number(payload[0].value))} · {Math.round((Number(payload[0].value) / donut.total) * 100)}%
                              </p>
                            </div>
                          ) : null
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] text-muted">Total</span>
                    <span className="text-sm font-bold text-ink">{moneyC(donut.total)}</span>
                  </div>
                </div>
                <ul className="mt-4 space-y-2">
                  {donut.rows.map((r) => (
                    <li key={r.key} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                        {r.name}
                      </span>
                      <span className="font-mono tabular-nums text-muted">{Math.round((r.value / donut.total) * 100)}%</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Aktivitas + klien teratas */}
      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Aktivitas terbaru</CardTitle>
            <Link href="/invoices" className="text-xs font-medium text-primary hover:text-primary-hover">Lihat semua</Link>
          </CardHeader>
          {recent.length === 0 ? (
            <EmptyState icon={<FileText className="h-6 w-6" />} title="Belum ada aktivitas" description="Invoice terbaru akan muncul di sini." />
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((i) => (
                <li key={i.id}>
                  <Link href={`/invoices/${i.id}/edit`} className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-canvas">
                    <div className="min-w-0">
                      <p className="font-mono text-sm text-ink">{i.number}</p>
                      <p className="truncate text-xs text-muted">{i.clientName || "—"} · {formatDateID(i.issueDate)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm tabular-nums text-ink">{money(i.total)}</span>
                      <StatusBadge status={i.status as InvoiceStatus} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Klien teratas</CardTitle>
          </CardHeader>
          {topClients.length === 0 ? (
            <EmptyState icon={<Users className="h-6 w-6" />} title="Belum ada klien" description="Klien dengan nilai tertinggi muncul di sini." />
          ) : (
            <ul className="divide-y divide-line">
              {topClients.map((c, idx) => {
                const inner = (
                  <div className="flex items-center justify-between gap-3 px-5 py-3">
                    <span className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{idx + 1}</span>
                      <span className="truncate font-medium text-ink">{c.name}</span>
                    </span>
                    <span className="font-mono text-sm tabular-nums text-ink">{money(c.total)}</span>
                  </div>
                );
                return (
                  <li key={c.id ?? c.name}>
                    {c.id ? <Link href={`/clients/${c.id}`} className="block transition-colors hover:bg-canvas">{inner}</Link> : inner}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
