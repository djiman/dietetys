import type { Entree } from "@/lib/contracts";
import { CONSTANTE_SEXE, MULTIPLICATEURS_ACTIVITE } from "./constants";

/**
 * Métabolisme de base, formule de Mifflin-St Jeor (spécification §
 * "Domaine nutritionnel", point 1).
 */
export function calculerMetabolismeBase(entree: Entree): number {
  const { poids_kg, taille_cm, age, sexe } = entree;
  return 10 * poids_kg + 6.25 * taille_cm - 5 * age + CONSTANTE_SEXE[sexe];
}

/**
 * Dépense énergétique totale = métabolisme de base × multiplicateur
 * d'activité (spécification § "Domaine nutritionnel", point 2).
 */
export function calculerDepenseTotale(entree: Entree): number {
  const mb = calculerMetabolismeBase(entree);
  return mb * MULTIPLICATEURS_ACTIVITE[entree.activite];
}
