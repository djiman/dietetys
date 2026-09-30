import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { calculerCoutAppel } from "../cout";

describe("calculerCoutAppel", () => {
  it("applique un tarif distinct à chaque catégorie de tokens", () => {
    const usage = {
      input_tokens: 1_000_000,
      output_tokens: 1_000_000,
      cache_creation_input_tokens: 1_000_000,
      cache_read_input_tokens: 1_000_000,
    } as Anthropic.Usage;
    expect(calculerCoutAppel("claude-sonnet-5", usage)).toBeCloseTo(2 + 10 + 2.5 + 0.2);
  });

  it("compte zéro pour un cache absent de la réponse", () => {
    const usage = {
      input_tokens: 500_000,
      output_tokens: 0,
      cache_creation_input_tokens: null,
      cache_read_input_tokens: null,
    } as Anthropic.Usage;
    expect(calculerCoutAppel("claude-sonnet-5", usage)).toBeCloseTo(1);
  });
});
