import { z } from "zod";
import type { FieldMetaMap } from "./index";

export const handwerkSchema = z.object({
  trade_type: z.enum(["PV", "Dach", "Heizung", "Elektro", "Sanitär", "Sonstiges"]).optional(),
  property_address_hint: z.string().max(200).optional(),
  urgency: z.enum(["sofort", "nächste3mon", "informativ"]).optional(),
  technical_blocker_hint: z.string().max(500).optional(),
  needs_site_visit: z.boolean().optional(),
}).strict();

export const handwerkFieldMeta: FieldMetaMap = {
  trade_type:             { label: "Gewerk", type: "enum", enum: ["PV", "Dach", "Heizung", "Elektro", "Sanitär", "Sonstiges"] },
  property_address_hint:  { label: "Adresse (Hinweis)", type: "text", placeholder: "Stadt + PLZ reicht" },
  urgency:                { label: "Dringlichkeit", type: "enum", enum: ["sofort", "nächste3mon", "informativ"] },
  technical_blocker_hint: { label: "Technischer Blocker (Hinweis)", type: "textarea" },
  needs_site_visit:       { label: "Vor-Ort-Termin nötig?", type: "boolean" },
};
