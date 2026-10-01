import { describe, expect, it } from "vitest";
import type { Jour } from "@/lib/contracts";
import { calculerKcalAtwater, calculerTotauxJour, calculerTotauxRepas } from "../menu";

const riz = {
  nom: "Riz basmati cuit",
  quantite_g: 200,
  kcal: 260,
  proteines_g: 5,
  glucides_g: 56,
  lipides_g: 1,
};

const yaourt = {
  nom: "Yaourt nature",
  quantite_g: 125,
  kcal: 60,
  proteines_g: 5,
  glucides_g: 6,
  lipides_g: 2,
};

const jour: Jour = {
  numero: 1,
  repas: [
    { type: "petit_dejeuner", nom_plat: "Yaourt", aliments: [yaourt] },
    { type: "dejeuner", nom_plat: "Riz", aliments: [riz, yaourt] },
    { type: "diner", nom_plat: "Riz", aliments: [riz] },
  ],
};

describe("calculerKcalAtwater", () => {
  it("applique 4 kcal/g aux protéines et glucides, 9 kcal/g aux lipides", () => {
    // 5 * 4 + 56 * 4 + 1 * 9
    expect(calculerKcalAtwater(riz)).toBe(253);
  });
});

describe("calculerTotauxRepas", () => {
  it("additionne les aliments du repas", () => {
    expect(calculerTotauxRepas(jour.repas[1])).toEqual({
      kcal: 320,
      proteines_g: 10,
      glucides_g: 62,
      lipides_g: 3,
    });
  });
});

describe("calculerTotauxJour", () => {
  it("additionne tous les aliments de tous les repas", () => {
    expect(calculerTotauxJour(jour)).toEqual({
      kcal: 640,
      proteines_g: 20,
      glucides_g: 124,
      lipides_g: 6,
    });
  });

  it("inclut la collation", () => {
    const avecCollation: Jour = {
      ...jour,
      repas: [
        ...jour.repas,
        { type: "collation", nom_plat: "Yaourt", aliments: [yaourt] },
      ],
    };
    expect(calculerTotauxJour(avecCollation).kcal).toBe(700);
  });
});
