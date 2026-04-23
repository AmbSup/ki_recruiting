import { z } from "zod";
import type { FieldMetaMap } from "./index";

export const recruitingSchema = z.object({
  position_interested: z.string().min(1, "Position fehlt").optional(),
  shift_preference: z.enum(["früh", "spät", "nacht", "flexibel"]).optional(),
  drivers_license: z.boolean().optional(),
  earliest_start_date: z.string().optional(), // ISO YYYY-MM-DD, freiwillig
  current_situation: z.string().max(500).optional(),
  motivation_quote: z.string().max(500).optional(),
}).strict();

export const recruitingFieldMeta: FieldMetaMap = {
  position_interested: { label: "Gewünschte Position", type: "text" },
  shift_preference:    { label: "Schicht-Präferenz", type: "enum", enum: ["früh", "spät", "nacht", "flexibel"] },
  drivers_license:     { label: "Führerschein B", type: "boolean" },
  earliest_start_date: { label: "Frühester Starttermin", type: "date" },
  current_situation:   { label: "Aktuelle Situation", type: "textarea" },
  motivation_quote:    { label: "Motivation (Zitat aus Funnel)", type: "textarea" },
};
