import type { Objectif, Sexe } from "@/lib/contracts";
import {
  DEFICIT_PERTE_KCAL,
  DEFICIT_PERTE_RATIO_MAX,
  PAS_ARRONDI_KCAL,
  PLANCHER_KCAL,
  SURPLUS_PRISE_KCAL,
} from "./constants";

/**
 * Ajuste la dépense totale selon l'objectif (spécification § "Domaine
 * nutritionnel", point 3).
 *
 * - `perte` : déficit d'au plus 500 kcal, plafonné à 20 % de la dépense
 *   (protège les petits gabarits).
 * - `maintien` : aucun ajustement.
 * - `prise` : surplus modéré de 300 kcal.
 */
export function ajusterSelonObjectif(
  depenseTotale: number,
  objectif: Objectif
): number {
  switch (objectif) {
    case "perte": {
      const deficit = Math.min(
        DEFICIT_PERTE_KCAL,
        depenseTotale * DEFICIT_PERTE_RATIO_MAX
      );
      return depenseTotale - deficit;
    }
    case "maintien":
      return depenseTotale;
    case "prise":
      return depenseTotale + SURPLUS_PRISE_KCAL;
  }
}

/**
 * Plancher de sécurité (spécification § "Domaine nutritionnel", point 4) :
 * on ne descend jamais sous le métabolisme de base, ni sous les seuils
 * couramment admis sans suivi médical.
 */
export function appliquerPlancher(
  cibleKcal: number,
  metabolismeBase: number,
  sexe: Sexe
): number {
  return Math.max(cibleKcal, metabolismeBase, PLANCHER_KCAL[sexe]);
}

/**
 * Arrondit au pas de 50 kcal le plus proche (spécification § "Domaine
 * nutritionnel", point 5) : la formule a une marge d'erreur individuelle
 * de l'ordre de ±10 %, une précision plus fine serait trompeuse.
 */
export function arrondirKcal(kcal: number): number {
  return Math.round(kcal / PAS_ARRONDI_KCAL) * PAS_ARRONDI_KCAL;
}
