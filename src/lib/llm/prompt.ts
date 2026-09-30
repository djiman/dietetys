import { createHash } from "node:crypto";
import type { Cibles } from "@/lib/contracts";
import {
  OCCURRENCES_MAX_PLAT,
  PROTEINES_MIN_RATIO,
  TOLERANCE_ATWATER_MIN_KCAL,
  TOLERANCE_ATWATER_RATIO,
  TOLERANCE_KCAL_JOUR_RATIO,
} from "@/lib/validation";

/**
 * Prompt de génération du menu (spécification § "Structure du prompt").
 *
 * Les critères d'acceptation sont construits à partir des constantes de
 * validation : le modèle vise mieux une cible quand il connaît le critère
 * exact, et un seuil modifié change le prompt et la validation ensemble.
 */

function pourcentage(ratio: number): string {
  return `${Math.round(ratio * 100)} %`;
}

export const PROMPT_SYSTEME = `Tu composes des menus hebdomadaires équilibrés pour une application de nutrition.

On te donne quatre cibles journalières déjà calculées : kcal, protéines, glucides et lipides. Tu ne les recalcules pas et tu ne les remets pas en question : tu composes des repas qui les respectent.

Format du menu :
- exactement 7 jours, numérotés de 1 à 7 ;
- chaque jour contient un petit-déjeuner, un déjeuner et un dîner, et au plus une collation, facultative ;
- chaque repas a un nom de plat et une liste d'aliments ;
- pour chaque aliment : son nom, sa quantité en grammes, et ses kcal, protéines, glucides et lipides pour cette quantité ;
- ne fournis aucun total : ils sont recalculés à partir des aliments.

Règles :
- aliments courants en France, disponibles en supermarché ;
- quantités en grammes uniquement, jamais en portions, tasses ou unités ;
- pas de compléments alimentaires ;
- aucune allégation médicale ;
- de la variété d'un jour à l'autre.

Ton menu est vérifié automatiquement ; il est refusé si l'un de ces critères n'est pas respecté :
1. Cohérence de chaque aliment : ses kcal doivent correspondre à 4 × protéines + 4 × glucides + 9 × lipides, à ${pourcentage(TOLERANCE_ATWATER_RATIO)} près (ou ${TOLERANCE_ATWATER_MIN_KCAL} kcal pour les aliments peu caloriques). Utilise des valeurs nutritionnelles réalistes et cohérentes entre elles.
2. Calories : le total de chaque jour doit être à ±${pourcentage(TOLERANCE_KCAL_JOUR_RATIO)} de la cible. Vise la cible elle-même : l'erreur la plus fréquente est un total trop bas, d'autant plus que la cible est élevée. Augmente les portions ou ajoute une collation plutôt que de rester en dessous.
3. Protéines : le total de chaque jour doit atteindre au moins ${pourcentage(PROTEINES_MIN_RATIO)} de la cible.
4. Diversité : un même plat apparaît au plus ${OCCURRENCES_MAX_PLAT} fois sur la semaine parmi les déjeuners et les dîners. Les petits-déjeuners peuvent se répéter.

Avant de répondre, additionne les kcal et les protéines des aliments de chaque jour et vérifie les critères 2 et 3. Si un jour est sous la cible, augmente les quantités de ses aliments, en gardant des valeurs cohérentes, avant de répondre.`;

/**
 * Empreinte du prompt système, journalisée avec chaque appel et enregistrée
 * avec chaque campagne d'évaluation : relie un résultat au prompt qui l'a
 * produit sans passer par l'historique git.
 */
export const VERSION_PROMPT = createHash("sha256").update(PROMPT_SYSTEME).digest("hex").slice(0, 12);

export function construireMessageCibles(cibles: Cibles): string {
  return `Cibles journalières :
- ${cibles.kcal} kcal
- ${cibles.proteines_g} g de protéines
- ${cibles.glucides_g} g de glucides
- ${cibles.lipides_g} g de lipides

Compose le menu des 7 jours.`;
}

export function construireMessageRelance(erreurs: string[]): string {
  const liste = erreurs.map((erreur, i) => `${i + 1}. ${erreur}`).join("\n");
  return `Ton menu a été refusé par la vérification automatique :
${liste}

Corrige ces points et renvoie le menu complet des 7 jours. Garde tel quel ce qui était correct.`;
}
