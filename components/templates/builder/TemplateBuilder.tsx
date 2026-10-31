"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Building2,
  Calculator,
  Eye,
  FileText,
  FolderKanban,
  GripVertical,
  Image as ImageIcon,
  Minus,
  MoveVertical,
  PanelBottom,
  PenLine,
  Plus,
  Redo2,
  ScrollText,
  StickyNote,
  Table,
  Trash2,
  Type,
  Undo2,
  User,
  Wallet,
} from "lucide-react";
import { Button, Modal, useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import { CustomTemplate } from "@/components/invoice/templates/CustomTemplate";
import {
  BLOCK_LABEL,
  BLOCK_TYPES,
  parseLayout,
  type Block,
  type BlockType,
  type Layout,
  type LayoutRow,
} from "@/lib/custom-template/schema";
import { saveCustomTemplate } from "@/lib/custom-template/actions";
import { SAMPLE_TOTALS, SAMPLE_VALUES } from "@/lib/custom-template/sample";
import type { CustomTemplateRecord, Letterhead } from "@/lib/custom-template/types";
import type { WorkspaceInfo } from "@/lib/invoice/types";
import { BlockInspector } from "./BlockInspector";
import { LetterheadPanel } from "./LetterheadPanel";
import { findBlock, useLayoutEditor, type LayoutEditor } from "./useLayoutEditor";

const A4_W = 794;

const BLOCK_ICON: Record<BlockType, React.ComponentType<{ className?: string }>> = {
  logo: ImageIcon,
  info_usaha: Building2,
  info_klien: User,
  detail_invoice: FileText,
  nama_proyek: FolderKanban,
  tabel_item: Table,
  ringkasan_total: Calculator,
  info_pembayaran: Wallet,
  catatan: StickyNote,
  syarat_ketentuan: ScrollText,
  tanda_tangan: PenLine,
  footer: PanelBottom,
  teks_bebas: Type,
  pemisah: Minus,
  spasi: MoveVertical,
};

/* ------------------------------ id seret-lepas ------------------------------ */

const cellId = (rowId: string, ci: number) => `cell|${rowId}|${ci}`;
const libId = (t: BlockType) => `lib|${t}`;
const parseCell = (id: string) => {
  const [, rowId, ci] = id.split("|");
  return { rowId, cellIndex: Number(ci) };
};

function containerOf(layout: Layout, id: string): string | null {
  if (id.startsWith("cell|")) return id;
  const pos = findBlock(layout, id);
  return pos ? cellId(layout.rows[pos.ri].id, pos.ci) : null;
}

/** Penunjuk dulu (akurat untuk kolom bersarang), lalu irisan kotak untuk keyboard. */
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length > 0 ? hits : rectIntersection(args);
};

const announcements = {
  onDragStart: ({ active }: { active: { id: string | number } }) => `Mengangkat ${labelFor(String(active.id))}.`,
  onDragOver: ({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) =>
    over ? `${labelFor(String(active.id))} berada di atas area tujuan.` : `${labelFor(String(active.id))} di luar area.`,
  onDragEnd: ({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) =>
    over ? `${labelFor(String(active.id))} diletakkan.` : `${labelFor(String(active.id))} dibatalkan.`,
  onDragCancel: ({ active }: { active: { id: string | number } }) => `Memindahkan ${labelFor(String(active.id))} dibatalkan.`,
};
let labelLookup: (id: string) => string = () => "blok";
const labelFor = (id: string) => labelLookup(id);

/* ------------------------------ elemen kanvas ------------------------------ */

const ZoomCtx = React.createContext(1);

/** Skala halaman A4 agar pas selebar wadah. Diukur sebelum paint agar tidak sempat tampil ukuran penuh. */
function useFitZoom(pad: number, min: number) {
  const [el, setEl] = React.useState<HTMLDivElement | null>(null);
  const [zoom, setZoom] = React.useState<number | null>(null);
  React.useLayoutEffect(() => {
    if (!el) return;
    const fit = () => {
      if (el.clientWidth > 0) setZoom(Math.min(1, Math.max(min, (el.clientWidth - pad) / A4_W)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [el, pad, min]);
  // null = belum terukur: halaman disembunyikan dulu agar tidak berkedip.
  return [setEl, zoom ?? min, zoom === null] as const;
}

function SortableBlock({
  block,
  selected,
  onSelect,
  children,
}: {
  block: Block;
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  const zoom = React.useContext(ZoomCtx);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  // Kanvas di-zoom: geser dibagi zoom agar sejalan dengan penunjuk.
  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x / zoom}px, ${transform.y / zoom}px, 0)` : undefined,
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      aria-label={`Blok ${BLOCK_LABEL[block.type]}. Spasi untuk memindahkan.`}
      aria-pressed={selected}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onFocus={onSelect}
      className={cn(
        "group/blk relative -m-1 cursor-grab rounded-md p-1 outline-none transition-shadow active:cursor-grabbing",
        selected ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-primary/50 focus-visible:ring-2 focus-visible:ring-primary",
        isDragging && "opacity-30"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute -left-0.5 top-1 z-10 flex h-5 w-4 items-center justify-center rounded bg-primary text-white transition-opacity",
          selected ? "opacity-100" : "opacity-0 group-hover/blk:opacity-100"
        )}
      >
        <GripVertical className="h-3 w-3" />
      </span>
      {children}
    </div>
  );
}

function DropCell({
  id,
  blockIds,
  empty,
  rowSelected,
  onSelectRow,
  children,
}: {
  id: string;
  blockIds: string[];
  empty: boolean;
  rowSelected: boolean;
  onSelectRow: () => void;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <SortableContext id={id} items={blockIds} strategy={verticalListSortingStrategy}>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[44px] flex-col gap-3 rounded-md transition-colors",
          isOver && "bg-primary/5 outline outline-2 outline-dashed outline-primary/50"
        )}
      >
        {empty ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectRow();
            }}
            className={cn(
              "flex min-h-[44px] w-full items-center justify-center rounded-md border border-dashed text-[11px] text-[color:var(--c-muted)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              rowSelected ? "border-primary text-primary" : "border-[color:var(--c-line)] hover:border-primary/60"
            )}
          >
            Taruh blok di sini
          </button>
        ) : (
          children
        )}
      </div>
    </SortableContext>
  );
}

function LibraryItem({ type, onAdd }: { type: BlockType; onAdd: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: libId(type) });
  const Icon = BLOCK_ICON[type];
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center gap-2 rounded-btn border border-line bg-surface pr-1 transition-colors hover:border-primary/50",
        isDragging && "opacity-40"
      )}
    >
      <span
        {...attributes}
        {...listeners}
        aria-label={`Seret blok ${BLOCK_LABEL[type]} ke kanvas`}
        className="flex h-9 flex-1 cursor-grab items-center gap-2 rounded-btn pl-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-primary active:cursor-grabbing"
      >
        <Icon className="h-4 w-4 shrink-0 text-muted" />
        <span className="truncate">{BLOCK_LABEL[type]}</span>
      </span>
      <button
        type="button"
        onClick={onAdd}
        aria-label={`Tambah blok ${BLOCK_LABEL[type]}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ------------------------------ pengaturan baris ------------------------------ */

function RowSettings({ row, index, total, editor, onRemoved }: {
  row: LayoutRow;
  index: number;
  total: number;
  editor: LayoutEditor;
  onRemoved: () => void;
}) {
  const btn =
    "inline-flex h-8 items-center justify-center gap-1 rounded-btn border border-line px-2 text-xs font-medium text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40";
  const seg = (active: boolean) =>
    cn(
      "h-8 flex-1 rounded-[8px] text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      active ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
    );
  return (
    <div className="space-y-2.5 border-b border-line px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Baris {index + 1} dari {total}</p>
      <div className="space-y-1.5">
        <span className="block text-[13px] font-medium text-ink">Kolom</span>
        <div role="radiogroup" aria-label="Jumlah kolom" className="flex gap-1 rounded-btn border border-line bg-canvas p-0.5">
          {([1, 2, 3] as const).map((n) => (
            <button key={n} type="button" role="radio" aria-checked={row.columns === n} onClick={() => editor.setRowColumns(row.id, n)} className={seg(row.columns === n)}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <span className="block text-[13px] font-medium text-ink">Pita latar</span>
        <div role="radiogroup" aria-label="Pita latar baris" className="flex gap-1 rounded-btn border border-line bg-canvas p-0.5">
          {(
            [
              ["none", "Tanpa"],
              ["muted", "Abu"],
              ["accent", "Aksen"],
            ] as const
          ).map(([v, l]) => (
            <button key={v} type="button" role="radio" aria-checked={row.background === v} onClick={() => editor.setRowBackground(row.id, v)} className={seg(row.background === v)}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <button type="button" className={btn} disabled={index === 0} onClick={() => editor.moveRow(row.id, -1)}>
          <ArrowUp className="h-3.5 w-3.5" /> Naik
        </button>
        <button type="button" className={btn} disabled={index === total - 1} onClick={() => editor.moveRow(row.id, 1)}>
          <ArrowDown className="h-3.5 w-3.5" /> Turun
        </button>
        <button type="button" className={btn} onClick={() => editor.addRow(row.columns, row.id)}>
          <Plus className="h-3.5 w-3.5" /> Baris di bawah
        </button>
        <button
          type="button"
          className={cn(btn, "text-danger hover:bg-danger-soft")}
          onClick={() => {
            editor.removeRow(row.id);
            onRemoved();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" /> Hapus baris
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------- builder ---------------------------------- */

type Sel = { kind: "block"; id: string } | { kind: "row"; id: string } | null;

export function TemplateBuilder({ template, workspace }: { template: CustomTemplateRecord; workspace: WorkspaceInfo }) {
  const router = useRouter();
  const toast = useToast();
  const editor = useLayoutEditor(template.layout);
  const { layout } = editor;

  const [name, setName] = React.useState(template.name);
  const [savedName, setSavedName] = React.useState(template.name);
  const initialLetterhead: Letterhead | null = template.letterheadUrl
    ? { url: template.letterheadUrl, top: template.letterheadTop, bottom: template.letterheadBottom }
    : null;
  // URL kop surat tersimpan saat diunggah; offset-nya ikut tombol Simpan.
  const [letterhead, setLetterhead] = React.useState(initialLetterhead);
  const [savedLetterhead, setSavedLetterhead] = React.useState(initialLetterhead);
  const [sel, setSel] = React.useState<Sel>(null);
  const [saving, setSaving] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [leaveOpen, setLeaveOpen] = React.useState(false);
  const [libOpen, setLibOpen] = React.useState(false);
  const [tab, setTab] = React.useState<"susun" | "pratinjau">("susun");
  const [active, setActive] = React.useState<{ kind: "block"; id: string } | { kind: "lib"; type: BlockType } | null>(null);

  const dirty =
    editor.dirty || name !== savedName || JSON.stringify(letterhead) !== JSON.stringify(savedLetterhead);
  const check = React.useMemo(() => parseLayout(layout), [layout]);

  // Lacak layout terbaru untuk handler seret (event bisa datang sebelum render ulang).
  const layoutRef = React.useRef(layout);
  layoutRef.current = layout;

  labelLookup = (id: string) => {
    if (id.startsWith("lib|")) return `blok baru ${BLOCK_LABEL[id.slice(4) as BlockType]}`;
    const pos = findBlock(layoutRef.current, id);
    return pos ? `blok ${BLOCK_LABEL[pos.block.type]}` : "blok";
  };

  const selectedBlock = sel?.kind === "block" ? findBlock(layout, sel.id)?.block ?? null : null;
  const selectedRowIndex =
    sel?.kind === "row"
      ? layout.rows.findIndex((r) => r.id === sel.id)
      : sel?.kind === "block"
      ? findBlock(layout, sel.id)?.ri ?? -1
      : -1;
  const selectedRow = selectedRowIndex >= 0 ? layout.rows[selectedRowIndex] : null;

  // Pilihan yang tak lagi ada (mis. setelah urungkan) dibersihkan.
  React.useEffect(() => {
    if (sel?.kind === "block" && !findBlock(layout, sel.id)) setSel(null);
    if (sel?.kind === "row" && !layout.rows.some((r) => r.id === sel.id)) setSel(null);
  }, [layout, sel]);

  /* ----------------------------- simpan ----------------------------- */

  const save = React.useCallback(async () => {
    if (saving) return;
    if (!check.ok) {
      toast.error("Belum bisa disimpan", check.error);
      return;
    }
    if (!name.trim()) {
      toast.error("Belum bisa disimpan", "Nama template wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      const res = await saveCustomTemplate(template.id, {
        name,
        layout,
        letterheadTop: letterhead?.top ?? 0,
        letterheadBottom: letterhead?.bottom ?? 0,
      });
      if (res.error) return toast.error("Gagal menyimpan", res.error);
      editor.markSaved(layout);
      setSavedName(name);
      setSavedLetterhead(letterhead);
      toast.success("Template tersimpan");
      router.refresh();
    } catch {
      toast.error("Gagal menyimpan", "Jaringan bermasalah. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }, [saving, check, name, template, layout, letterhead, editor, toast, router]);

  /* --------------------------- pintasan keyboard --------------------------- */

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
        return;
      }
      if (typing) return;
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        editor.undo();
      } else if (mod && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
        e.preventDefault();
        editor.redo();
      } else if ((e.key === "Delete" || e.key === "Backspace") && sel?.kind === "block") {
        e.preventDefault();
        editor.removeBlock(sel.id);
        setSel(null);
      } else if (e.key === "Escape" && sel) {
        setSel(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor, sel, save]);

  // Peringatan bawaan browser saat menutup tab dengan perubahan belum tersimpan.
  React.useEffect(() => {
    if (!dirty) return;
    const onBefore = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [dirty]);

  /* ----------------------------- seret-lepas ----------------------------- */

  const dndId = React.useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function onDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    if (id.startsWith("lib|")) {
      setActive({ kind: "lib", type: id.slice(4) as BlockType });
    } else {
      setActive({ kind: "block", id });
      setSel({ kind: "block", id });
      editor.beginDrag();
    }
  }

  function onDragOver(e: DragOverEvent) {
    const id = String(e.active.id);
    if (id.startsWith("lib|") || !e.over) return;
    const cur = layoutRef.current;
    const from = containerOf(cur, id);
    const to = containerOf(cur, String(e.over.id));
    if (!from || !to || from === to) return;

    // Pindah antarsel selama menyeret (sementara — dicatat sekali saat dilepas).
    const next: Layout = JSON.parse(JSON.stringify(cur));
    const a = parseCell(from);
    const b = parseCell(to);
    const src = next.rows.find((r) => r.id === a.rowId)!.cells[a.cellIndex];
    const dst = next.rows.find((r) => r.id === b.rowId)!.cells[b.cellIndex];
    const bi = src.findIndex((x) => x.id === id);
    if (bi < 0) return;
    const [blk] = src.splice(bi, 1);
    const overIdx = dst.findIndex((x) => x.id === String(e.over!.id));
    dst.splice(overIdx >= 0 ? overIdx : dst.length, 0, blk);
    layoutRef.current = next;
    editor.setTransient(next);
  }

  function onDragEnd(e: DragEndEvent) {
    const id = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    setActive(null);

    if (id.startsWith("lib|")) {
      if (!overId) return;
      const cur = layoutRef.current;
      const to = containerOf(cur, overId);
      if (!to) return;
      const { rowId, cellIndex } = parseCell(to);
      const cell = cur.rows.find((r) => r.id === rowId)?.cells[cellIndex] ?? [];
      const idx = cell.findIndex((x) => x.id === overId);
      const newId = editor.addBlock(id.slice(4) as BlockType, { rowId, cellIndex, index: idx >= 0 ? idx : cell.length });
      setSel({ kind: "block", id: newId });
      return;
    }

    if (!overId) {
      editor.endDrag(false);
      return;
    }
    const cur = layoutRef.current;
    const c = containerOf(cur, id);
    if (c && c === containerOf(cur, overId) && overId !== id) {
      const { rowId, cellIndex } = parseCell(c);
      const next: Layout = JSON.parse(JSON.stringify(cur));
      const cell = next.rows.find((r) => r.id === rowId)!.cells[cellIndex];
      const from = cell.findIndex((x) => x.id === id);
      const to = cell.findIndex((x) => x.id === overId);
      if (from >= 0 && to >= 0) {
        next.rows.find((r) => r.id === rowId)!.cells[cellIndex] = arrayMove(cell, from, to);
        editor.setTransient(next);
      }
    }
    editor.endDrag(true);
  }

  function onDragCancel() {
    if (active?.kind === "block") editor.endDrag(false);
    setActive(null);
  }

  /* ------------------------------ zoom kanvas ------------------------------ */

  const [canvasRef, zoom, measuring] = useFitZoom(32, 0.35);
  const [mobileRef, mobileZoom, mobileMeasuring] = useFitZoom(16, 0.2);

  /* ------------------------------ tampilan ------------------------------ */

  const addFromLibrary = (t: BlockType) => {
    const id = editor.addBlockAfter(t, sel?.kind === "block" ? sel.id : null);
    setSel({ kind: "block", id });
    setLibOpen(false);
  };

  const render = (editing: boolean, docId: string) => (
    <CustomTemplate
      docId={docId}
      layout={layout}
      letterhead={letterhead}
      workspace={workspace}
      values={SAMPLE_VALUES}
      totals={SAMPLE_TOTALS}
      editing={editing}
      wrapCell={
        editing
          ? ({ rowId, cellIndex, blockIds, children }) => (
              <DropCell
                id={cellId(rowId, cellIndex)}
                blockIds={blockIds}
                empty={blockIds.length === 0}
                rowSelected={sel?.kind === "row" && sel.id === rowId}
                onSelectRow={() => setSel({ kind: "row", id: rowId })}
              >
                {children}
              </DropCell>
            )
          : undefined
      }
      wrapBlock={
        editing
          ? (block, node) => (
              <SortableBlock
                block={block}
                selected={sel?.kind === "block" && sel.id === block.id}
                onSelect={() => setSel({ kind: "block", id: block.id })}
              >
                {node}
              </SortableBlock>
            )
          : undefined
      }
    />
  );

  const inspector = (
    <>
      {selectedRow && (
        <RowSettings
          row={selectedRow}
          index={selectedRowIndex}
          total={layout.rows.length}
          editor={editor}
          onRemoved={() => setSel(null)}
        />
      )}
      {!sel && <LetterheadPanel templateId={template.id} letterhead={letterhead} onChange={setLetterhead} />}
      {sel?.kind !== "row" && (
        <BlockInspector block={selectedBlock} settings={layout.settings} editor={editor} onDeselect={() => setSel(null)} />
      )}
    </>
  );

  const library = (
    <div className="space-y-1.5">
      {BLOCK_TYPES.map((t) => (
        <LibraryItem key={t} type={t} onAdd={() => addFromLibrary(t)} />
      ))}
    </div>
  );

  const iconBtn =
    "flex h-9 w-9 items-center justify-center rounded-btn border border-line bg-surface text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="space-y-4">
      {/* Bar atas */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => (dirty ? setLeaveOpen(true) : router.push("/templates"))}
          className="inline-flex h-9 items-center gap-1.5 rounded-btn px-2 text-sm text-muted transition-colors hover:bg-canvas hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Template
        </button>
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 80))}
          aria-label="Nama template"
          className="order-last h-9 w-full min-w-0 rounded-input border border-line bg-surface px-2 text-base font-semibold text-ink transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:order-none sm:w-auto sm:flex-1 sm:border-transparent sm:bg-transparent sm:hover:border-line sm:focus-visible:bg-surface sm:max-w-sm"
        />
        <div className="ml-auto flex items-center gap-1.5">
          <button type="button" className={iconBtn} onClick={editor.undo} disabled={!editor.canUndo} aria-label="Urungkan (Ctrl+Z)" title="Urungkan (Ctrl+Z)">
            <Undo2 className="h-4 w-4" />
          </button>
          <button type="button" className={iconBtn} onClick={editor.redo} disabled={!editor.canRedo} aria-label="Ulangi (Ctrl+Shift+Z)" title="Ulangi (Ctrl+Shift+Z)">
            <Redo2 className="h-4 w-4" />
          </button>
          <Button variant="secondary" leftIcon={<Eye className="h-4 w-4" />} onClick={() => setPreviewOpen(true)} className="hidden sm:inline-flex">
            Pratinjau penuh
          </Button>
          <Button onClick={save} loading={saving} disabled={!dirty && !saving}>
            {dirty ? "Simpan" : "Tersimpan"}
          </Button>
        </div>
      </div>

      {!check.ok && (
        <div role="alert" className="flex items-start gap-2 rounded-card border border-warning/30 bg-warning-soft px-3 py-2 text-sm text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{check.error}</span>
        </div>
      )}

      {/* Tab HP/tablet */}
      <div role="tablist" aria-label="Mode builder" className="flex gap-1 rounded-btn border border-line bg-surface p-1 xl:hidden">
        {(
          [
            ["susun", "Susun"],
            ["pratinjau", "Pratinjau"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn(
              "flex-1 rounded-[8px] py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              tab === k ? "bg-primary-soft text-primary" : "text-muted"
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {/* ============ Desktop: tiga panel dengan seret-lepas ============ */}
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={collision}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable:
              "Tekan spasi untuk mengangkat blok. Gunakan panah untuk memindahkan, spasi lagi untuk meletakkan, atau Escape untuk membatalkan.",
          },
        }}
      >
        <div className="hidden gap-4 xl:grid xl:grid-cols-[220px_minmax(0,1fr)_288px] xl:items-start">
          <aside className="sticky top-20 max-h-[calc(100vh-6rem)] space-y-3 overflow-auto rounded-card border border-line bg-surface p-3">
            <div>
              <p className="text-sm font-semibold text-ink">Pustaka blok</p>
              <p className="text-xs text-muted">Seret ke kanvas, atau klik + untuk menambah setelah blok terpilih.</p>
            </div>
            {library}
            <Button variant="secondary" size="sm" className="w-full" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setSel({ kind: "row", id: editor.addRow(2) })}>
              Baris 2 kolom
            </Button>
          </aside>

          <div ref={canvasRef} className="min-w-0 rounded-card border border-line bg-canvas p-4" onClick={() => setSel(null)}>
            <ZoomCtx.Provider value={zoom}>
              <div className="mx-auto shadow-card" style={{ width: A4_W, zoom, visibility: measuring ? "hidden" : undefined } as React.CSSProperties}>
                {render(true, "builder-doc")}
              </div>
            </ZoomCtx.Provider>
            <p className="mt-3 text-center text-xs text-muted">
              Pratinjau memakai data contoh · Ctrl+Z urungkan · Delete hapus blok · Esc batal pilih
            </p>
          </div>

          <aside className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-auto rounded-card border border-line bg-surface" aria-label="Pengaturan">
            {inspector}
          </aside>
        </div>

        <DragOverlay dropAnimation={null}>
          {active && (
            <div className="flex items-center gap-2 rounded-btn border border-primary bg-surface px-3 py-2 text-sm font-medium text-ink shadow-dropdown">
              <GripVertical className="h-4 w-4 text-primary" />
              {active.kind === "lib"
                ? BLOCK_LABEL[active.type]
                : (() => {
                    const b = findBlock(layout, active.id)?.block;
                    return b ? BLOCK_LABEL[b.type] : "Blok";
                  })()}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* ============ HP/tablet: tanpa seret ============ */}
      <div className="xl:hidden">
        {tab === "susun" ? (
          <div className="space-y-3">
            {layout.rows.map((row, ri) => (
              <div key={row.id} className={cn("rounded-card border bg-surface", sel?.kind === "row" && sel.id === row.id ? "border-primary" : "border-line")}>
                <button
                  type="button"
                  onClick={() => setSel({ kind: "row", id: row.id })}
                  className="flex w-full items-center justify-between border-b border-line px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span>Baris {ri + 1} · {row.columns} kolom{row.background !== "none" ? " · pita" : ""}</span>
                  <span className="normal-case tracking-normal text-primary">Atur</span>
                </button>
                <div className="divide-y divide-line">
                  {row.cells.map((cell, ci) => (
                    <div key={ci} className="px-3 py-2">
                      {row.columns > 1 && <p className="pb-1 text-[11px] text-muted">Kolom {ci + 1}</p>}
                      {cell.length === 0 ? (
                        <p className="py-1 text-xs text-muted">Kosong</p>
                      ) : (
                        <ul className="space-y-1">
                          {cell.map((b) => {
                            const Icon = BLOCK_ICON[b.type];
                            return (
                              <li key={b.id} className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setSel({ kind: "block", id: b.id })}
                                  className={cn(
                                    "flex min-h-[44px] flex-1 items-center gap-2 rounded-btn px-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                    sel?.kind === "block" && sel.id === b.id ? "bg-primary-soft text-primary" : "text-ink hover:bg-canvas"
                                  )}
                                >
                                  <Icon className="h-4 w-4 shrink-0 text-muted" />
                                  {BLOCK_LABEL[b.type]}
                                </button>
                                <button type="button" onClick={() => editor.moveBlockStep(b.id, -1)} aria-label={`Naikkan ${BLOCK_LABEL[b.type]}`} className="flex h-11 w-11 items-center justify-center rounded-btn text-muted hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                                  <ArrowUp className="h-4 w-4" />
                                </button>
                                <button type="button" onClick={() => editor.moveBlockStep(b.id, 1)} aria-label={`Turunkan ${BLOCK_LABEL[b.type]}`} className="flex h-11 w-11 items-center justify-center rounded-btn text-muted hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                                  <ArrowDown className="h-4 w-4" />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setLibOpen(true)}>
                Tambah blok
              </Button>
              <Button variant="secondary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setSel({ kind: "row", id: editor.addRow(1) })}>
                Tambah baris
              </Button>
            </div>
            <div className="rounded-card border border-line bg-surface">
              {inspector}
            </div>
          </div>
        ) : (
          <div ref={mobileRef} className="overflow-hidden rounded-card border border-line bg-canvas p-2">
            <div className="shadow-card" style={{ width: A4_W, zoom: mobileZoom, visibility: mobileMeasuring ? "hidden" : undefined } as React.CSSProperties}>{render(false, "builder-doc-mobile")}</div>
          </div>
        )}
      </div>

      {/* Pustaka (HP) */}
      <Modal open={libOpen} onClose={() => setLibOpen(false)} size="sm" title="Tambah blok" description="Blok ditambahkan setelah blok yang sedang dipilih.">
        <div className="grid grid-cols-2 gap-2">
          {BLOCK_TYPES.map((t) => {
            const Icon = BLOCK_ICON[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => addFromLibrary(t)}
                className="flex min-h-[44px] items-center gap-2 rounded-btn border border-line px-2.5 text-left text-sm text-ink transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Icon className="h-4 w-4 shrink-0 text-muted" />
                {BLOCK_LABEL[t]}
              </button>
            );
          })}
        </div>
      </Modal>

      {/* Pratinjau penuh */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} size="lg" title="Pratinjau penuh" description="Tampilan persis seperti hasil ekspor (dengan data contoh).">
        <div className="max-h-[70vh] overflow-auto rounded-card border border-line bg-canvas p-3">
          <div className="mx-auto" style={{ width: A4_W, zoom: 0.7 } as React.CSSProperties}>
            {render(false, "builder-doc-preview")}
          </div>
        </div>
      </Modal>

      {/* Konfirmasi keluar */}
      <Modal
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        size="sm"
        title="Tinggalkan tanpa menyimpan?"
        description="Perubahan pada template ini akan hilang."
        footer={
          <>
            <Button variant="secondary" onClick={() => setLeaveOpen(false)}>Lanjut mengedit</Button>
            <Button className="bg-danger hover:bg-danger/90" onClick={() => router.push("/templates")}>
              Tinggalkan
            </Button>
          </>
        }
      />
    </div>
  );
}
