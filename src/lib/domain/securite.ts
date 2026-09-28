import type { Entree } from "@/lib/contracts";
import { SEUIL_IMC_INSUFFISANCE } from "./constants";

/**
 * Règle de sécurité (spécification § "Contrat d'entrée").
 *
 * Calculée et appliquée en code, avant tout appel au LLM : l'application ne
 * produit pas de plan d'amaigrissement pour une personne déjà en
 * insuffisance pondérale.
 */

/** IMC = poids (kg) / taille (m)². */
export function calculerIMC(poids_kg: number, taille_cm: number): number {
  const taille_m = taille_cm / 100;
  return poids_kg / (taille_m * taille_m);
}

/**
 * true si la requête doit être refusée (code 422) : IMC < 18,5 et objectif
 * de perte de poids.
 */
export function doitRefuserPourSecurite(entree: Entree): boolean {
  if (entree.objectif !== "perte") return false;
  return calculerIMC(entree.poids_kg, entree.taille_cm) < SEUIL_IMC_INSUFFISANCE;
}

export const MESSAGE_REFUS_SECURITE =
  "Cette application ne peut pas générer de plan de perte de poids pour un indice de masse corporelle déjà inférieur à 18,5. Nous vous invitons à consulter un professionnel de santé.";
