/**
 * Tâche 16 (Phase 4 — Orchestrateur LLM) : exécute la chaîne réelle sur
 * trois profils, pour régler le prompt avant les évaluations.
 *
 * Usage : npm run generer:menu
 * Chaque profil appelle l'API (jusqu'à deux appels facturés avec la relance).
 */
import { config } from "dotenv";
import type { Entree } from "../src/lib/contracts";
import { calculerCibles, calculerTotauxJour } from "../src/lib/domain";
import { genererMenu } from "../src/lib/llm";

// Un script autonome doit charger .env.local lui-même, contrairement à Next.js.
config({ path: ".env.local" });

const PROFILS: Record<string, Entree> = {
  "Femme petite, sédentaire, perte": {
    sexe: "femme",
    age: 45,
    taille_cm: 155,
    poids_kg: 68,
    activite: "sedentaire",
    objectif: "perte",
  },
  "Homme modéré, maintien": {
    sexe: "homme",
    age: 35,
    taille_cm: 178,
    poids_kg: 75,
    activite: "modere",
    objectif: "maintien",
  },
  "Homme grand, très actif, prise": {
    sexe: "homme",
    age: 25,
    taille_cm: 190,
    poids_kg: 85,
    activite: "tres_actif",
    objectif: "prise",
  },
};

async function main() {
  for (const [nom, entree] of Object.entries(PROFILS)) {
    const cibles = calculerCibles(entree);
    console.log(`\n=== ${nom}`);
    console.log(
      `Cibles : ${cibles.kcal} kcal, ${cibles.proteines_g} g protéines, ` +
        `${cibles.glucides_g} g glucides, ${cibles.lipides_g} g lipides`
    );

    const resultat = await genererMenu(cibles);
    if (!resultat.ok) {
      console.log(`Échec : ${resultat.raison}`);
      continue;
    }

    for (const jour of resultat.menu.jours) {
      const totaux = calculerTotauxJour(jour);
      console.log(
        `Jour ${jour.numero} : ${Math.round(totaux.kcal)} kcal, ` +
          `${Math.round(totaux.proteines_g)} g protéines`
      );
    }
    const exemple = resultat.menu.jours[0].repas[1];
    console.log(
      `Exemple (jour 1, ${exemple.type}) : ${exemple.nom_plat} — ` +
        exemple.aliments.map((a) => `${a.nom} ${a.quantite_g} g`).join(", ")
    );
  }
}

main();
