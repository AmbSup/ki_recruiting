// Unit-Tests für getFunnelPublicUrl.
// Wichtig: diese Funktion wurde 2026-05-28 gefixt um die alte Vercel-Default-
// Domain (ki-recruiting.vercel.app) zu ignorieren, weil ein veralteter
// NEXT_PUBLIC_FUNNEL_BASE_URL-Wert sonst kaputte Links produzierte. Die Tests
// fixieren dieses Verhalten gegen Regression.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getFunnelPublicUrl } from "./funnel-url";

describe("getFunnelPublicUrl — externe Funnels", () => {
  it("externer Funnel gibt external_url zurück (keine Platform-Domain)", () => {
    const result = getFunnelPublicUrl({
      funnel_type: "external",
      external_url: "https://example.com/special-funnel",
      slug: "ignored",
    });
    expect(result).toBe("https://example.com/special-funnel");
  });

  it("externer Funnel mit NULL external_url fällt durch auf interne URL", () => {
    // Edge-Case: type='external' aber kein external_url gesetzt — wir bauen
    // die Platform-URL als Fallback statt zu crashen.
    const result = getFunnelPublicUrl({
      funnel_type: "external",
      external_url: null,
      slug: "fallback-slug",
    });
    expect(result).toBe("https://app.neuronic-automation.ai/fallback-slug");
  });
});

describe("getFunnelPublicUrl — interne Funnels (slug-basiert)", () => {
  beforeEach(() => {
    // Default: Env-Var nicht gesetzt → Code-Default wird genutzt
    vi.stubEnv("NEXT_PUBLIC_FUNNEL_BASE_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("ohne Env-Var → Code-Default app.neuronic-automation.ai", () => {
    const result = getFunnelPublicUrl({
      funnel_type: "internal",
      external_url: null,
      slug: "car-special-offers",
    });
    expect(result).toBe("https://app.neuronic-automation.ai/car-special-offers");
  });

  it("Env-Var gesetzt auf custom Domain → die wird genutzt", () => {
    vi.stubEnv("NEXT_PUBLIC_FUNNEL_BASE_URL", "https://custom.example.com");
    const result = getFunnelPublicUrl({
      funnel_type: "internal",
      external_url: null,
      slug: "abc",
    });
    expect(result).toBe("https://custom.example.com/abc");
  });
});

describe("getFunnelPublicUrl — Legacy-Vercel-Domain (Regression-Schutz)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("Env-Var auf alte Vercel-Domain wird IGNORIERT → Code-Default greift", () => {
    // Schutz gegen den Bug vom 2026-05-28: alte Vercel-Default-Env-Var in
    // Vercel-Dashboard war auf ki-recruiting.vercel.app gesetzt und
    // überschrieb den neuen Code-Default. Test fixiert das Verhalten:
    // wenn Env-Var diese Legacy-Domain enthält → ignorieren.
    vi.stubEnv("NEXT_PUBLIC_FUNNEL_BASE_URL", "https://ki-recruiting.vercel.app");
    const result = getFunnelPublicUrl({
      funnel_type: "internal",
      external_url: null,
      slug: "car-special-offers",
    });
    expect(result).toBe("https://app.neuronic-automation.ai/car-special-offers");
  });

  it("auch mit Subpath: Legacy-Vercel-Domain in Env-Var → ignoriert", () => {
    vi.stubEnv("NEXT_PUBLIC_FUNNEL_BASE_URL", "https://ki-recruiting.vercel.app/funnels");
    const result = getFunnelPublicUrl({
      funnel_type: "internal",
      external_url: null,
      slug: "xyz",
    });
    expect(result).toBe("https://app.neuronic-automation.ai/xyz");
  });
});
