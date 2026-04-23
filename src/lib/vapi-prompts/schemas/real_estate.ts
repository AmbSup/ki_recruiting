import { z } from "zod";
import type { FieldMetaMap } from "./index";

export const realEstateSchema = z.object({
  property_type: z.enum(["EFH", "ETW", "MFH", "Gewerbe", "Grundstück"]).optional(),
  construction_year: z.number().int().min(1800).max(2100).optional(),
  living_area_sqm: z.number().int().min(10).max(100000).optional(),
  postal_code: z.string().min(4).max(10).optional(),
  condition: z.enum(["neuwertig", "renoviert", "instandgehalten", "sanierungsbedürftig"]).optional(),
  sale_timeline: z.enum(["sofort", "3-6mon", "6-12mon", "ungewiss"]).optional(),
  asking_price_hint: z.string().max(100).optional(), // free-text "ca. 450k" oder null
}).strict();

export const realEstateFieldMeta: FieldMetaMap = {
  property_type:     { label: "Objekttyp", type: "enum", enum: ["EFH", "ETW", "MFH", "Gewerbe", "Grundstück"] },
  construction_year: { label: "Baujahr", type: "number" },
  living_area_sqm:   { label: "Wohnfläche (m²)", type: "number" },
  postal_code:       { label: "PLZ", type: "text" },
  condition:         { label: "Zustand", type: "enum", enum: ["neuwertig", "renoviert", "instandgehalten", "sanierungsbedürftig"] },
  sale_timeline:     { label: "Verkaufs-Zeitraum", type: "enum", enum: ["sofort", "3-6mon", "6-12mon", "ungewiss"] },
  asking_price_hint: { label: "Preisvorstellung (Hinweis)", type: "text", placeholder: "ca. 450.000 €" },
};
