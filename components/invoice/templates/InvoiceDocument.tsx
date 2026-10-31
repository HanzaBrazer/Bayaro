import * as React from "react";
import { CustomTemplate } from "./CustomTemplate";
import { getTemplate } from "./registry";
import type { TemplateProps } from "./types";
import { isCustomTemplateId, CUSTOM_PREFIX } from "@/lib/custom-template/schema";
import type { CustomTemplateRecord } from "@/lib/custom-template/types";

/** Template kustom yang tersedia, dikunci pada id invoice ("custom:<uuid>"). */
export type CustomTemplateMap = Record<string, CustomTemplateRecord>;

export const toCustomMap = (list: CustomTemplateRecord[]): CustomTemplateMap =>
  Object.fromEntries(list.map((t) => [`${CUSTOM_PREFIX}${t.id}`, t]));

export const customRecord = (templateId: string, customs?: CustomTemplateMap) =>
  isCustomTemplateId(templateId) ? customs?.[templateId] ?? null : null;

/** Nama template untuk label UI; template kustom yang hilang jatuh ke bawaan. */
export function templateLabel(templateId: string, customs?: CustomTemplateMap): string {
  return customRecord(templateId, customs)?.name ?? getTemplate(templateId).name;
}

/**
 * Satu pintu render invoice: template bawaan atau kustom.
 * Template kustom yang sudah dihapus otomatis jatuh ke template bawaan,
 * supaya invoice lama tetap bisa dibuka & diekspor.
 */
export function InvoiceDocument({
  templateId,
  customs,
  ...props
}: TemplateProps & { templateId: string; customs?: CustomTemplateMap }) {
  const custom = customRecord(templateId, customs);
  if (custom) {
    return (
      <CustomTemplate
        {...props}
        layout={custom.layout}
        letterhead={
          custom.letterheadUrl
            ? { url: custom.letterheadUrl, top: custom.letterheadTop, bottom: custom.letterheadBottom }
            : null
        }
      />
    );
  }
  const Builtin = getTemplate(templateId).component;
  return <Builtin {...props} />;
}
