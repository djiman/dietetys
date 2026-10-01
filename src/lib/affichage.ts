import type { Repas, TypeRepas } from "@/lib/contracts";

// Ordre de la journée : le modèle peut renvoyer les repas dans n'importe
// quel ordre, et une collation se prend entre le déjeuner et le dîner.
const ORDRE_REPAS: TypeRepas[] = ["petit_dejeuner", "dejeuner", "collation", "diner"];

export function ordonnerRepas(repas: Repas[]): Repas[] {
  return [...repas].sort((a, b) => ORDRE_REPAS.indexOf(a.type) - ORDRE_REPAS.indexOf(b.type));
}

/** Nombre arrondi, avec séparateur de milliers à la française. */
export function formaterNombre(valeur: number): string {
  return Math.round(valeur).toLocaleString("fr-FR");
}

/** Écart d'un total à sa cible, en pourcentage signé : « −3 % », « +2 % ». */
export function formaterEcart(total: number, cible: number): string {
  const pourcentage = Math.round((total / cible - 1) * 100);
  if (pourcentage === 0) return "0 %";
  return `${pourcentage > 0 ? "+" : "−"}${Math.abs(pourcentage)} %`;
}
