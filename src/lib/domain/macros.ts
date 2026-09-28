import type { Objectif } from "@/lib/contracts";
import type { Cibles } from "@/lib/contracts";
import {
  KCAL_PAR_G_GLUCIDES,
  KCAL_PAR_G_LIPIDES,
  KCAL_PAR_G_PROTEINES,
  PLAFOND_PROTEINES_RATIO,
  PROTEINES_G_PAR_KG,
  RATIO_LIPIDES,
} from "./constants";

/**
 * Répartition des macronutriments (spécification § "Domaine nutritionnel",
 * point 6), à partir de la cible calorique déjà arrondie.
 *
 * - Protéines : g/kg selon l'objectif, plafonnées à 30 % des kcal.
 * - Lipides : 30 % des kcal.
 * - Glucides : le reste.
 */
export function calculerMacros(
  kcal: number,
  poids_kg: number,
  objectif: Objectif
): Omit<Cibles, "kcal"> {
  const proteinesParPoids = poids_kg * PROTEINES_G_PAR_KG[objectif];
  const plafondProteinesG =
    (kcal * PLAFOND_PROTEINES_RATIO) / KCAL_PAR_G_PROTEINES;
  const proteines_g = Math.min(proteinesParPoids, plafondProteinesG);

  const lipides_g = (kcal * RATIO_LIPIDES) / KCAL_PAR_G_LIPIDES;

  const kcalRestantes =
    kcal - proteines_g * KCAL_PAR_G_PROTEINES - lipides_g * KCAL_PAR_G_LIPIDES;
  const glucides_g = Math.max(0, kcalRestantes / KCAL_PAR_G_GLUCIDES);

  return {
    proteines_g: arrondirGrammes(proteines_g),
    glucides_g: arrondirGrammes(glucides_g),
    lipides_g: arrondirGrammes(lipides_g),
  };
}

function arrondirGrammes(valeur: number): number {
  return Math.round(valeur);
}
