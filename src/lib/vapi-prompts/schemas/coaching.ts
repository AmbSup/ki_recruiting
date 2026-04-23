import { z } from "zod";
import type { FieldMetaMap } from "./index";

export const coachingSchema = z.object({
  current_revenue_monthly: z.number().min(0).optional(),
  revenue_goal_6mo: z.number().min(0).optional(),
  biggest_bottleneck: z.string().max(500).optional(),
  available_budget_monthly: z.number().min(0).optional(),
  time_commitment_hours_week: z.number().int().min(0).max(80).optional(),
  has_existing_offer: z.boolean().optional(),
}).strict();

export const coachingFieldMeta: FieldMetaMap = {
  current_revenue_monthly:    { label: "Aktueller Umsatz / Monat (€)", type: "number" },
  revenue_goal_6mo:           { label: "Umsatzziel in 6 Monaten (€)", type: "number" },
  biggest_bottleneck:         { label: "Größter Engpass", type: "textarea" },
  available_budget_monthly:   { label: "Verfügbares Budget / Monat (€)", type: "number" },
  time_commitment_hours_week: { label: "Zeit / Woche (h)", type: "number" },
  has_existing_offer:         { label: "Bestehendes Angebot?", type: "boolean" },
};
