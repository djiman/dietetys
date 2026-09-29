import type { Aliment, Cibles, Menu } from "@/lib/contracts";

/**
 * Menu valide pour CIBLES_FICTIVES, à modifier dans chaque test pour
 * produire un menu invalide d'une seule façon.
 *
 * Chaque repas contient un seul aliment de 638 kcal, cohérent avec Atwater
 * (35 × 4 + 75 × 4 + 22 × 9) : un jour fait 1914 kcal et 105 g de
 * protéines, dans les tolérances des cibles.
 */
export const CIBLES_FICTIVES: Cibles = {
  kcal: 2000,
  proteines_g: 100,
  glucides_g: 225,
  lipides_g: 67,
};

export function alimentFictif(nom: string): Aliment {
  return {
    nom,
    quantite_g: 300,
    kcal: 638,
    proteines_g: 35,
    glucides_g: 75,
    lipides_g: 22,
  };
}

const DEJEUNERS = [
  "Poulet riz brocolis",
  "Lentilles corail et carottes",
  "Pâtes au thon",
  "Bœuf mijoté et pommes de terre",
  "Quiche aux poireaux",
  "Dinde et semoule",
  "Omelette et patates douces",
];

const DINERS = [
  "Saumon et quinoa",
  "Chili sin carne",
  "Cabillaud et riz",
  "Gratin de courgettes",
  "Porc et haricots verts",
  "Curry de pois chiches",
  "Soupe de légumes et pain complet",
];

export function construireMenuFictif(): Menu {
  return {
    jours: Array.from({ length: 7 }, (_, i) => ({
      numero: i + 1,
      repas: [
        {
          type: "petit_dejeuner" as const,
          nom_plat: "Porridge aux fruits",
          aliments: [alimentFictif("Flocons d'avoine")],
        },
        {
          type: "dejeuner" as const,
          nom_plat: DEJEUNERS[i],
          aliments: [alimentFictif("Plat du déjeuner")],
        },
        {
          type: "diner" as const,
          nom_plat: DINERS[i],
          aliments: [alimentFictif("Plat du dîner")],
        },
      ],
    })),
  };
}
