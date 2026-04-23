import { z } from "zod";
import type { FieldMetaMap } from "./index";

export const ecommerceHighticketSchema = z.object({
  product_category: z.string().max(100).optional(),
  price_point: z.number().min(0).optional(),
  quiz_result_key: z.string().max(100).optional(), // z.B. "hauttyp-trocken" / "matratze-m"
  cart_value: z.number().min(0).optional(),
  purchase_hesitation: z.string().max(500).optional(),
}).strict();

export const ecommerceHighticketFieldMeta: FieldMetaMap = {
  product_category:     { label: "Produktkategorie", type: "text" },
  price_point:          { label: "Preispunkt (€)", type: "number" },
  quiz_result_key:      { label: "Quiz-Ergebnis", type: "text", placeholder: "z.B. hauttyp-trocken" },
  cart_value:           { label: "Warenkorb-Wert (€)", type: "number" },
  purchase_hesitation:  { label: "Kaufzögern (Funnel-Antwort)", type: "textarea" },
};
