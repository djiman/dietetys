import type { NiveauActivite } from "@/lib/contracts";

/**
 * Constantes du domaine nutritionnel (spécification § "Domaine nutritionnel").
 * Conventions usuelles de nutrition, pas des recommandations médicales.
 */

/** Multiplicateurs d'activité appliqués au métabolisme de base. */
export const MULTIPLICATEURS_ACTIVITE: Record<NiveauActivite, number> = {
  sedentaire: 1.2,
  leger: 1.375,
  modere: 1.55,
  actif: 1.725,
  tres_actif: 1.9,
};

/** Constante de sexe dans la formule de Mifflin-St Jeor. */
export const CONSTANTE_SEXE = {
  homme: 5,
  femme: -161,
} as const;

/** Déficit calorique visé en `perte`, plafonné à 20 % de la dépense. */
export const DEFICIT_PERTE_KCAL = 500;
export const DEFICIT_PERTE_RATIO_MAX = 0.2;

/** Surplus calorique visé en `prise`. */
export const SURPLUS_PRISE_KCAL = 300;

/** Planchers de sécurité, en kcal/jour, en plus du métabolisme de base. */
export const PLANCHER_KCAL = {
  homme: 1500,
  femme: 1200,
} as const;

/** Pas d'arrondi de la cible calorique finale. */
export const PAS_ARRONDI_KCAL = 50;

/** Grammes de protéines par kg de poids, selon l'objectif. */
export const PROTEINES_G_PAR_KG = {
  perte: 1.6,
  maintien: 1.2,
  prise: 1.6,
} as const;

/** Plafond des protéines, en proportion des kcal totales. */
export const PLAFOND_PROTEINES_RATIO = 0.3;

/** Part des lipides dans les kcal totales. */
export const RATIO_LIPIDES = 0.3;

/** Kcal par gramme, règle d'Atwater. */
export const KCAL_PAR_G_PROTEINES = 4;
export const KCAL_PAR_G_GLUCIDES = 4;
export const KCAL_PAR_G_LIPIDES = 9;

/** Seuil d'IMC en dessous duquel une personne est en insuffisance pondérale. */
export const SEUIL_IMC_INSUFFISANCE = 18.5;
