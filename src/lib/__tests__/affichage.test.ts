import { describe, expect, it } from "vitest";
import type { Repas } from "@/lib/contracts";
import { formaterEcart, formaterNombre, ordonnerRepas } from "../affichage";

function repas(type: Repas["type"]): Repas {
  return { type, nom_plat: type, aliments: [] };
}

describe("ordonnerRepas", () => {
  it("range les repas dans l'ordre de la journée, collation avant le dîner", () => {
    const desordre = [repas("diner"), repas("collation"), repas("petit_dejeuner"), repas("dejeuner")];
    expect(ordonnerRepas(desordre).map((r) => r.type)).toEqual([
      "petit_dejeuner",
      "dejeuner",
      "collation",
      "diner",
    ]);
  });

  it("ne modifie pas le tableau reçu", () => {
    const desordre = [repas("diner"), repas("petit_dejeuner")];
    ordonnerRepas(desordre);
    expect(desordre.map((r) => r.type)).toEqual(["diner", "petit_dejeuner"]);
  });
});

describe("formaterNombre", () => {
  it("arrondit et sépare les milliers à la française", () => {
    expect(formaterNombre(2049.6)).toBe((2050).toLocaleString("fr-FR"));
    expect(formaterNombre(2049.6)).toMatch(/^2\s050$/u);
  });
});

describe("formaterEcart", () => {
  it.each([
    [1980, 2050, "−3 %"],
    [2091, 2050, "+2 %"],
    [2055, 2050, "0 %"],
  ])("%d pour une cible de %d donne %s", (total, cible, attendu) => {
    expect(formaterEcart(total, cible)).toBe(attendu);
  });
});
