"use client";

import * as React from "react";
import type { Block, BlockProps, BlockType, Layout, LayoutRow, LayoutSettings } from "@/lib/custom-template/schema";

/**
 * State editor layout: semua operasi builder + urungkan/ulangi.
 *
 * Memakai useReducer MURNI: reducer tidak punya efek samping dan semua id baru
 * dibuat DI LUAR reducer. Ini penting karena reactStrictMode menjalankan reducer
 * dua kali di mode dev — efek samping di dalamnya akan mencatat riwayat ganda.
 */

const HISTORY_LIMIT = 60;

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const newId = (p: string) => `${p}_${crypto.randomUUID().slice(0, 8)}`;

export type RowBackground = LayoutRow["background"];

export function findBlock(layout: Layout, id: string) {
  for (let ri = 0; ri < layout.rows.length; ri++) {
    const row = layout.rows[ri];
    for (let ci = 0; ci < row.cells.length; ci++) {
      const bi = row.cells[ci].findIndex((b) => b.id === id);
      if (bi >= 0) return { ri, ci, bi, block: row.cells[ci][bi] };
    }
  }
  return null;
}

function defaultProps(type: BlockType): BlockProps {
  switch (type) {
    case "logo":
    case "spasi":
      return { size: "M" };
    case "teks_bebas":
      return { text: "Tulis teks di sini" };
    default:
      return {};
  }
}

type State = { layout: Layout; past: Layout[]; future: Layout[]; dragStart: Layout | null };
type Action =
  | { t: "mutate"; fn: (draft: Layout) => void }
  | { t: "undo" }
  | { t: "redo" }
  | { t: "beginDrag" }
  | { t: "transient"; layout: Layout }
  | { t: "endDrag"; commit: boolean };

const pushPast = (past: Layout[], l: Layout) => [...past.slice(-(HISTORY_LIMIT - 1)), l];

function reducer(s: State, a: Action): State {
  switch (a.t) {
    case "mutate": {
      const draft = clone(s.layout);
      a.fn(draft);
      if (JSON.stringify(draft) === JSON.stringify(s.layout)) return s; // tanpa perubahan = tanpa riwayat
      return { ...s, layout: draft, past: pushPast(s.past, s.layout), future: [] };
    }
    case "undo": {
      if (s.past.length === 0) return s;
      const prev = s.past[s.past.length - 1];
      return { ...s, layout: prev, past: s.past.slice(0, -1), future: [s.layout, ...s.future].slice(0, HISTORY_LIMIT) };
    }
    case "redo": {
      if (s.future.length === 0) return s;
      const [next, ...rest] = s.future;
      return { ...s, layout: next, past: pushPast(s.past, s.layout), future: rest };
    }
    case "beginDrag":
      return { ...s, dragStart: s.layout };
    case "transient":
      return { ...s, layout: a.layout };
    case "endDrag": {
      const start = s.dragStart;
      if (!start) return s;
      if (!a.commit) return { ...s, layout: start, dragStart: null };
      const changed = JSON.stringify(s.layout) !== JSON.stringify(start);
      return changed
        ? { ...s, dragStart: null, past: pushPast(s.past, start), future: [] }
        : { ...s, dragStart: null };
    }
  }
}

export function useLayoutEditor(initial: Layout) {
  const [state, dispatch] = React.useReducer(reducer, undefined, () => ({
    layout: clone(initial),
    past: [],
    future: [],
    dragStart: null,
  }));
  const [savedJson, setSavedJson] = React.useState(() => JSON.stringify(initial));
  const mutate = React.useCallback((fn: (d: Layout) => void) => dispatch({ t: "mutate", fn }), []);

  /** Tambah blok. Tanpa target → baris baru 1 kolom di akhir. Mengembalikan id blok. */
  const addBlock = React.useCallback(
    (type: BlockType, target?: { rowId: string; cellIndex: number; index?: number }) => {
      const block: Block = { id: newId("b"), type, props: defaultProps(type) };
      const rowId = newId("r");
      mutate((d) => {
        const row = target ? d.rows.find((r) => r.id === target.rowId) : undefined;
        const cell = row?.cells[target!.cellIndex];
        if (cell) {
          const at = target!.index ?? cell.length;
          cell.splice(Math.min(Math.max(at, 0), cell.length), 0, block);
        } else {
          d.rows.push({ id: rowId, columns: 1, background: "none", cells: [[block]] });
        }
      });
      return block.id;
    },
    [mutate]
  );

  /** Tambah blok tepat setelah blok terpilih (sel yang sama); tanpa pilihan → baris baru. */
  const addBlockAfter = React.useCallback(
    (type: BlockType, afterId: string | null) => {
      const block: Block = { id: newId("b"), type, props: defaultProps(type) };
      const rowId = newId("r");
      mutate((d) => {
        const pos = afterId ? findBlock(d, afterId) : null;
        if (pos) d.rows[pos.ri].cells[pos.ci].splice(pos.bi + 1, 0, block);
        else d.rows.push({ id: rowId, columns: 1, background: "none", cells: [[block]] });
      });
      return block.id;
    },
    [mutate]
  );

  const addRow = React.useCallback(
    (columns: 1 | 2 | 3, afterRowId?: string) => {
      const row: LayoutRow = { id: newId("r"), columns, background: "none", cells: Array.from({ length: columns }, () => []) };
      mutate((d) => {
        const i = afterRowId ? d.rows.findIndex((r) => r.id === afterRowId) : -1;
        if (i >= 0) d.rows.splice(i + 1, 0, clone(row));
        else d.rows.push(clone(row));
      });
      return row.id;
    },
    [mutate]
  );

  const removeBlock = React.useCallback(
    (id: string) =>
      mutate((d) => {
        const pos = findBlock(d, id);
        if (pos) d.rows[pos.ri].cells[pos.ci].splice(pos.bi, 1);
      }),
    [mutate]
  );

  const duplicateBlock = React.useCallback(
    (id: string) => {
      const copyId = newId("b");
      mutate((d) => {
        const pos = findBlock(d, id);
        if (pos) d.rows[pos.ri].cells[pos.ci].splice(pos.bi + 1, 0, { ...clone(pos.block), id: copyId });
      });
      return copyId;
    },
    [mutate]
  );

  /** Naik/turun satu langkah dalam urutan baca (baris → sel → blok); bisa pindah sel. */
  const moveBlockStep = React.useCallback(
    (id: string, dir: -1 | 1) =>
      mutate((d) => {
        const pos = findBlock(d, id);
        if (!pos) return;
        const cell = d.rows[pos.ri].cells[pos.ci];
        const target = pos.bi + dir;
        if (target >= 0 && target < cell.length) {
          [cell[pos.bi], cell[target]] = [cell[target], cell[pos.bi]];
          return;
        }
        const seq: { ri: number; ci: number }[] = [];
        d.rows.forEach((row, ri) => row.cells.forEach((_, ci) => seq.push({ ri, ci })));
        const at = seq.findIndex((p) => p.ri === pos.ri && p.ci === pos.ci);
        const next = seq[at + dir];
        if (!next) return;
        const [blk] = cell.splice(pos.bi, 1);
        const dest = d.rows[next.ri].cells[next.ci];
        if (dir === 1) dest.unshift(blk);
        else dest.push(blk);
      }),
    [mutate]
  );

  const updateBlockProps = React.useCallback(
    (id: string, patch: BlockProps) =>
      mutate((d) => {
        const pos = findBlock(d, id);
        if (!pos) return;
        const cur = pos.block.props ?? {};
        pos.block.props = {
          ...cur,
          ...patch,
          ...(patch.fields ? { fields: { ...(cur.fields ?? {}), ...patch.fields } } : {}),
          ...(patch.columns ? { columns: { ...(cur.columns ?? {}), ...patch.columns } } : {}),
        };
      }),
    [mutate]
  );

  const updateSettings = React.useCallback(
    (patch: Partial<LayoutSettings>) =>
      mutate((d) => {
        d.settings = { ...d.settings, ...patch };
      }),
    [mutate]
  );

  /** Ubah jumlah kolom; blok dari kolom yang dibuang pindah ke kolom terakhir yang tersisa. */
  const setRowColumns = React.useCallback(
    (rowId: string, columns: 1 | 2 | 3) =>
      mutate((d) => {
        const row = d.rows.find((r) => r.id === rowId);
        if (!row || row.columns === columns) return;
        if (columns > row.columns) {
          while (row.cells.length < columns) row.cells.push([]);
        } else {
          const extra = row.cells.splice(columns).flat();
          row.cells[columns - 1].push(...extra);
        }
        row.columns = columns;
      }),
    [mutate]
  );

  const setRowBackground = React.useCallback(
    (rowId: string, background: RowBackground) =>
      mutate((d) => {
        const row = d.rows.find((r) => r.id === rowId);
        if (row) row.background = background;
      }),
    [mutate]
  );

  const moveRow = React.useCallback(
    (rowId: string, dir: -1 | 1) =>
      mutate((d) => {
        const i = d.rows.findIndex((r) => r.id === rowId);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= d.rows.length) return;
        [d.rows[i], d.rows[j]] = [d.rows[j], d.rows[i]];
      }),
    [mutate]
  );

  const removeRow = React.useCallback(
    (rowId: string) =>
      mutate((d) => {
        d.rows = d.rows.filter((r) => r.id !== rowId);
      }),
    [mutate]
  );

  return {
    layout: state.layout,
    dirty: JSON.stringify(state.layout) !== savedJson,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    undo: React.useCallback(() => dispatch({ t: "undo" }), []),
    redo: React.useCallback(() => dispatch({ t: "redo" }), []),
    beginDrag: React.useCallback(() => dispatch({ t: "beginDrag" }), []),
    setTransient: React.useCallback((layout: Layout) => dispatch({ t: "transient", layout }), []),
    endDrag: React.useCallback((commit: boolean) => dispatch({ t: "endDrag", commit }), []),
    addBlock,
    addBlockAfter,
    addRow,
    removeBlock,
    duplicateBlock,
    moveBlockStep,
    updateBlockProps,
    updateSettings,
    setRowColumns,
    setRowBackground,
    moveRow,
    removeRow,
    markSaved: React.useCallback((l: Layout) => setSavedJson(JSON.stringify(l)), []),
  };
}

export type LayoutEditor = ReturnType<typeof useLayoutEditor>;
