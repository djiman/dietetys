import type { Aliment, Cibles, Jour } from "@/lib/contracts";
import {
  KCAL_PAR_G_GLUCIDES,
  KCAL_PAR_G_LIPIDES,
  KCAL_PAR_G_PROTEINES,
} from "./constants";

/**
 * Totaux nutritionnels d'un jour : mêmes quatre grandeurs que les cibles,
 * pour pouvoir les comparer directement.
 */
export type Totaux = Cibles;

/**
 * Kcal d'un aliment recalculées à partir de ses macronutriments (règle
 * d'Atwater). Sert à détecter les valeurs inventées de façon incohérente
 * par le LLM.
 */
export function calculerKcalAtwater(aliment: Aliment): number {
  return (
    aliment.proteines_g * KCAL_PAR_G_PROTEINES +
    aliment.glucides_g * KCAL_PAR_G_GLUCIDES +
    aliment.lipides_g * KCAL_PAR_G_LIPIDES
  );
}

/**
 * Somme des valeurs de tous les aliments du jour, collation comprise. Le
 * LLM ne fournit aucun total : ils sont toujours recalculés ici. Pas
 * d'arrondi : c'est une affaire d'affichage.
 */
export function calculerTotauxJour(jour: Jour): Totaux {
  const totaux: Totaux = { kcal: 0, proteines_g: 0, glucides_g: 0, lipides_g: 0 };
  for (const repas of jour.repas) {
    for (const aliment of repas.aliments) {
      totaux.kcal += aliment.kcal;
      totaux.proteines_g += aliment.proteines_g;
      totaux.glucides_g += aliment.glucides_g;
      totaux.lipides_g += aliment.lipides_g;
    }
  }
  return totaux;
}
