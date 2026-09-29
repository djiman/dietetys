import { menuSchema, type Cibles, type Menu, type TypeRepas } from "@/lib/contracts";
import { calculerKcalAtwater, calculerTotauxJour } from "@/lib/domain";
import {
  OCCURRENCES_MAX_PLAT,
  PROTEINES_MIN_RATIO,
  TOLERANCE_ATWATER_MIN_KCAL,
  TOLERANCE_ATWATER_RATIO,
  TOLERANCE_KCAL_JOUR_RATIO,
} from "./constants";

/**
 * Les quatre contrôles de la spécification. Chaque message est injecté tel
 * quel dans la relance du LLM : il doit localiser l'erreur et donner la
 * valeur attendue, pour que le modèle corrige au lieu de tout régénérer.
 */

const LIBELLES_REPAS: Record<TypeRepas, string> = {
  petit_dejeuner: "petit-déjeuner",
  dejeuner: "déjeuner",
  diner: "dîner",
  collation: "collation",
};

export function verifierSchema(
  sortieBrute: unknown
): { menu: Menu; erreurs: [] } | { menu: null; erreurs: string[] } {
  const resultat = menuSchema.safeParse(sortieBrute);
  if (resultat.success) return { menu: resultat.data, erreurs: [] };
  return {
    menu: null,
    erreurs: resultat.error.issues.map((issue) =>
      issue.path.length > 0
        ? `${issue.path.join(".")} : ${issue.message}`
        : issue.message
    ),
  };
}

export function verifierAtwater(menu: Menu): string[] {
  const erreurs: string[] = [];
  for (const jour of menu.jours) {
    for (const repas of jour.repas) {
      for (const aliment of repas.aliments) {
        const kcalCalculees = calculerKcalAtwater(aliment);
        const tolerance = Math.max(
          aliment.kcal * TOLERANCE_ATWATER_RATIO,
          TOLERANCE_ATWATER_MIN_KCAL
        );
        if (Math.abs(aliment.kcal - kcalCalculees) > tolerance) {
          erreurs.push(
            `Jour ${jour.numero}, ${LIBELLES_REPAS[repas.type]} « ${repas.nom_plat} », aliment « ${aliment.nom} » : ` +
              `${Math.round(aliment.kcal)} kcal déclarées, ${Math.round(kcalCalculees)} kcal d'après ses macronutriments ` +
              `(écart toléré ${Math.round(tolerance)} kcal).`
          );
        }
      }
    }
  }
  return erreurs;
}

export function verifierCibles(menu: Menu, cibles: Cibles): string[] {
  const erreurs: string[] = [];
  const kcalMin = cibles.kcal * (1 - TOLERANCE_KCAL_JOUR_RATIO);
  const kcalMax = cibles.kcal * (1 + TOLERANCE_KCAL_JOUR_RATIO);
  const proteinesMin = cibles.proteines_g * PROTEINES_MIN_RATIO;

  for (const jour of menu.jours) {
    const totaux = calculerTotauxJour(jour);
    if (totaux.kcal < kcalMin || totaux.kcal > kcalMax) {
      erreurs.push(
        `Jour ${jour.numero} : ${Math.round(totaux.kcal)} kcal au total, attendu entre ${Math.round(kcalMin)} et ${Math.round(kcalMax)}.`
      );
    }
    if (totaux.proteines_g < proteinesMin) {
      erreurs.push(
        `Jour ${jour.numero} : ${Math.round(totaux.proteines_g)} g de protéines au total, attendu au moins ${Math.round(proteinesMin)} g.`
      );
    }
  }
  return erreurs;
}

/**
 * Seuls les déjeuners et dîners comptent : répéter un petit-déjeuner ou une
 * collation est normal, pas un repas principal.
 */
export function verifierDiversite(menu: Menu): string[] {
  const occurrences = new Map<string, { nom: string; jours: number[] }>();
  for (const jour of menu.jours) {
    for (const repas of jour.repas) {
      if (repas.type !== "dejeuner" && repas.type !== "diner") continue;
      const cle = repas.nom_plat.trim().toLowerCase().replace(/\s+/g, " ");
      const entree = occurrences.get(cle) ?? { nom: repas.nom_plat.trim(), jours: [] };
      entree.jours.push(jour.numero);
      occurrences.set(cle, entree);
    }
  }

  const erreurs: string[] = [];
  for (const { nom, jours } of occurrences.values()) {
    if (jours.length > OCCURRENCES_MAX_PLAT) {
      erreurs.push(
        `Le plat « ${nom} » apparaît ${jours.length} fois (jours ${jours.join(", ")}) ; ` +
          `un même plat est autorisé au plus ${OCCURRENCES_MAX_PLAT} fois sur la semaine pour les déjeuners et dîners.`
      );
    }
  }
  return erreurs;
}
