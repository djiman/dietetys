/**
 * Critères d'acceptation du menu (spécification § "Validation de sortie").
 * Exportés pour que le prompt système annonce au modèle exactement les
 * mêmes tolérances que celles appliquées ici.
 */

/**
 * Écart toléré entre les kcal déclarées d'un aliment et celles recalculées
 * par Atwater : 15 % des kcal, avec un plancher de 10 kcal. Le plancher
 * est un écart volontaire à la spécification : sans lui, un aliment à
 * 2 kcal (café) ferait échouer le menu pour un simple arrondi.
 */
export const TOLERANCE_ATWATER_RATIO = 0.15;
export const TOLERANCE_ATWATER_MIN_KCAL = 10;

/** Écart toléré entre les kcal d'un jour et la cible. */
export const TOLERANCE_KCAL_JOUR_RATIO = 0.1;

/** Part minimale de la cible de protéines à atteindre chaque jour. */
export const PROTEINES_MIN_RATIO = 0.9;

/**
 * Part maximale de la cible de protéines. Sans plafond, le modèle en ajoute
 * pour être sûr d'atteindre le minimum : un menu réel est monté à 1,9 fois
 * la cible (2,3 g/kg, 26 % des kcal), au-delà des références ANSES (10 à
 * 20 % des kcal) et, les kcal étant tenues, au détriment des glucides et
 * des lipides.
 */
export const PROTEINES_MAX_RATIO = 1.25;

/** Nombre maximal d'occurrences d'un même plat sur la semaine (déjeuners et dîners). */
export const OCCURRENCES_MAX_PLAT = 2;
