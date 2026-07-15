import { describe, expect, it } from "vitest";
import { buildFirstMessage } from "./builder";

describe("buildFirstMessage name fallback", () => {
  it("uses a neutral greeting when the first name is missing", () => {
    const message = buildFirstMessage("generic", {
      first_name: "",
      lead_greeting: "Guten Tag",
      first_message_override: "{{lead_greeting}}, hier spricht Andrea.",
      require_consent: false,
    });

    expect(message).toContain("Guten Tag, hier spricht Andrea.");
    expect(message).not.toContain("Hallo ,");
  });
});
