// Zod-Schemas für sales_leads.custom_fields, pro sales_programs.program_type.
// Wird in /api/sales/leads POST/PATCH zur Validierung eingesetzt und später
// vom LeadModal für dynamisches Field-Rendering genutzt.

import { z, ZodTypeAny } from "zod";
import { genericSchema, genericFieldMeta } from "./generic";
import { recruitingSchema, recruitingFieldMeta } from "./recruiting";
import { realEstateSchema, realEstateFieldMeta } from "./real_estate";
import { coachingSchema, coachingFieldMeta } from "./coaching";
import { ecommerceHighticketSchema, ecommerceHighticketFieldMeta } from "./ecommerce_highticket";
import { handwerkSchema, handwerkFieldMeta } from "./handwerk";

export type SalesProgramType =
  | "generic"
  | "recruiting"
  | "real_estate"
  | "coaching"
  | "ecommerce_highticket"
  | "handwerk";

/** Render-Metadaten für das Lead-Modal (Label, Input-Type, Enum-Werte, required). */
export type FieldMeta = {
  label: string;
  type: "text" | "textarea" | "number" | "email" | "date" | "enum" | "boolean";
  enum?: string[];
  required?: boolean;
  placeholder?: string;
};

export type FieldMetaMap = Record<string, FieldMeta>;

export const schemasByProgramType: Record<SalesProgramType, ZodTypeAny> = {
  generic: genericSchema,
  recruiting: recruitingSchema,
  real_estate: realEstateSchema,
  coaching: coachingSchema,
  ecommerce_highticket: ecommerceHighticketSchema,
  handwerk: handwerkSchema,
};

export const fieldMetaByProgramType: Record<SalesProgramType, FieldMetaMap> = {
  generic: genericFieldMeta,
  recruiting: recruitingFieldMeta,
  real_estate: realEstateFieldMeta,
  coaching: coachingFieldMeta,
  ecommerce_highticket: ecommerceHighticketFieldMeta,
  handwerk: handwerkFieldMeta,
};

/**
 * Validiert custom_fields gegen das Schema des Use-Cases.
 * Returns { ok, data } bei Erfolg, sonst { ok: false, issues } mit strukturierten
 * Field-Pfaden für 400-Responses.
 */
export function validateCustomFields(
  programType: SalesProgramType,
  input: unknown,
):
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; issues: { path: string; message: string }[] } {
  const schema = schemasByProgramType[programType] ?? genericSchema;
  const result = schema.safeParse(input ?? {});
  if (result.success) {
    return { ok: true, data: result.data as Record<string, unknown> };
  }
  return {
    ok: false,
    issues: result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    })),
  };
}

export { z };
