import type { Cibles, Entree } from "@/lib/contracts";
import { calculerDepenseTotale, calculerMetabolismeBase } from "./depense";
import { ajusterSelonObjectif, appliquerPlancher, arrondirKcal } from "./objectif";
import { calculerMacros } from "./macros";

/**
 * Calcule les quatre cibles journalières à partir de l'entrée validée.
 *
 * Fonction pure qui enchaîne les étapes 1 à 6 de la spécification. N'inclut
 * pas la règle de sécurité IMC (src/lib/domain/securite.ts) : c'est à
 * l'appelant (la route API) de la vérifier avant d'appeler cette fonction.
 */
export function calculerCibles(entree: Entree): Cibles {
  const metabolismeBase = calculerMetabolismeBase(entree);
  const depenseTotale = calculerDepenseTotale(entree);
  const cibleAjustee = ajusterSelonObjectif(depenseTotale, entree.objectif);
  const cibleAvecPlancher = appliquerPlancher(
    cibleAjustee,
    metabolismeBase,
    entree.sexe
  );
  const kcal = arrondirKcal(cibleAvecPlancher);
  const macros = calculerMacros(kcal, entree.poids_kg, entree.objectif);

  return { kcal, ...macros };
}
