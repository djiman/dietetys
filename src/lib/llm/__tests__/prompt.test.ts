import { describe, expect, it } from "vitest";
import {
  PROMPT_SYSTEME,
  VERSION_PROMPT,
  construireMessageCibles,
  construireMessageRelance,
} from "../prompt";

describe("PROMPT_SYSTEME", () => {
  it("annonce les seuils de la validation", () => {
    expect(PROMPT_SYSTEME).toContain("à 15 % près (ou 10 kcal");
    expect(PROMPT_SYSTEME).toContain("±10 % de la cible");
    expect(PROMPT_SYSTEME).toContain("au moins 90 % de la cible");
    expect(PROMPT_SYSTEME).toContain("au plus 2 fois");
  });
});

describe("VERSION_PROMPT", () => {
  it("est une empreinte courte du prompt système", () => {
    expect(VERSION_PROMPT).toMatch(/^[0-9a-f]{12}$/);
  });
});

describe("construireMessageCibles", () => {
  it("ne contient que les quatre cibles", () => {
    const message = construireMessageCibles({
      kcal: 2150,
      proteines_g: 112,
      glucides_g: 261,
      lipides_g: 72,
    });
    expect(message).toContain("2150 kcal");
    expect(message).toContain("112 g de protéines");
    expect(message).toContain("261 g de glucides");
    expect(message).toContain("72 g de lipides");
    expect(message.match(/\d+/g)).toEqual(["2150", "112", "261", "72", "7"]);
  });
});

describe("construireMessageRelance", () => {
  it("numérote les erreurs", () => {
    const message = construireMessageRelance(["Erreur A.", "Erreur B."]);
    expect(message).toContain("1. Erreur A.\n2. Erreur B.");
  });
});
