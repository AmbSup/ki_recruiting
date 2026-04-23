import { z } from "zod";
import type { FieldMetaMap } from "./index";

// Generic = kein striktes Schema. Alle Felder erlaubt, nur Objekt-Shape pflicht.
export const genericSchema = z.record(z.string(), z.unknown());

export const genericFieldMeta: FieldMetaMap = {};
