-- Erweitert das sales_program_type-Enum um 'product_finder'.
-- Pendant zu src/lib/vapi-prompts/schemas/index.ts (TS-Union) und
-- src/lib/vapi-prompts/use-cases/product_finder.ts (Use-Case-Template).
alter type sales_program_type add value if not exists 'product_finder';
