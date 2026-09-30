/**
 * Tâche 18 (phase 5 — Évaluations) : exécute l'orchestrateur sur le jeu fixe
 * de profils, l'un après l'autre (spécification § "Observabilité,
 * évaluations et limites").
 *
 * Usage : npm run evaluer -- <nom-campagne>
 * Exemple : npm run evaluer -- 1-prompt-actuel
 * Appels facturés : environ 2 $ et 20 minutes par campagne. Les résultats
 * sont écrits dans scripts/evaluation/resultats/<nom-campagne>.json, pour
 * comparer les campagnes entre elles, et chaque réponse brute du modèle dans
 * resultats/sorties/<nom-campagne>/, rejouée par les tests de la validation.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { config } from "dotenv";
import { mkdirSync, writeFileSync } from "node:fs";
import type { Cibles, Entree } from "../../src/lib/contracts";
import { calculerCibles } from "../../src/lib/domain";
import {
  MODELE,
  VERSION_PROMPT,
  appelerClaude,
  genererMenu,
  type AppelerModele,
} from "../../src/lib/llm";
import { validerMenu } from "../../src/lib/validation";
import {
  calculerCoutAppel,
  calculerEcartCaloriqueMoyen,
  resumerCampagne,
  type ResultatProfil,
} from "./mesures";
import { PROFILS_EVALUATION } from "./profils";

// Un script autonome doit charger .env.local lui-même, contrairement à Next.js.
config({ path: ".env.local" });

const DOSSIER_RESULTATS = "scripts/evaluation/resultats";

function identifiant(nom: string): string {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Enregistre chaque réponse avec le verdict de la validation au moment de
 * la campagne : les tests rejouent ces vraies sorties, gratuitement, pour
 * vérifier qu'une modification de la validation ne change pas ses verdicts
 * sans qu'on le voie.
 */
function enregistrerSorties(dossier: string, nom: string, cibles: Cibles, reponses: Anthropic.Message[]) {
  reponses.forEach((reponse, index) => {
    const texte = reponse.content.find((bloc) => bloc.type === "text")?.text ?? "";
    let sortie: unknown;
    try {
      sortie = JSON.parse(texte);
    } catch {
      return;
    }
    const validation = validerMenu(sortie, cibles);
    writeFileSync(
      `${dossier}/${identifiant(nom)}-tentative-${index + 1}.json`,
      JSON.stringify(
        {
          cibles,
          controles_echoues: validation.valide ? [] : validation.controlesEchoues,
          sortie,
        },
        null,
        2
      )
    );
  });
}

async function evaluerProfil(
  nom: string,
  entree: Entree,
  dossierSorties: string
): Promise<ResultatProfil> {
  const cibles = calculerCibles(entree);
  // genererMenu ne renvoie que le menu : l'appel réel est enveloppé pour
  // compter les tentatives et les tokens consommés, relance comprise.
  const reponses: Anthropic.Message[] = [];
  const appelerEtMesurer: AppelerModele = async (messages) => {
    const reponse = await appelerClaude(messages);
    reponses.push(reponse);
    return reponse;
  };

  const debut = Date.now();
  const resultat = await genererMenu(cibles, appelerEtMesurer);
  enregistrerSorties(dossierSorties, nom, cibles, reponses);
  return {
    nom,
    cible_kcal: cibles.kcal,
    tentatives: reponses.length,
    valide_premier_essai: resultat.ok && reponses.length === 1,
    valide: resultat.ok,
    raison_echec: resultat.ok ? null : resultat.raison,
    ecart_calorique_moyen: resultat.ok ? calculerEcartCaloriqueMoyen(resultat.menu, cibles) : null,
    cout_usd: reponses.reduce((somme, r) => somme + calculerCoutAppel(MODELE, r.usage), 0),
    latence_s: (Date.now() - debut) / 1000,
  };
}

function pourcentage(ratio: number | null): string {
  return ratio === null ? "-" : `${(ratio * 100).toFixed(1)} %`;
}

async function main() {
  const campagne = process.argv[2];
  if (!campagne) {
    console.error("Usage : npm run evaluer -- <nom-campagne>");
    process.exit(1);
  }
  const dossierSorties = `${DOSSIER_RESULTATS}/sorties/${campagne}`;
  mkdirSync(dossierSorties, { recursive: true });
  const fichier = `${DOSSIER_RESULTATS}/${campagne}.json`;

  const resultats: ResultatProfil[] = [];
  for (const [index, { nom, entree }] of PROFILS_EVALUATION.entries()) {
    console.error(`[${index + 1}/${PROFILS_EVALUATION.length}] ${nom}`);
    resultats.push(await evaluerProfil(nom, entree, dossierSorties));
    // Écrit après chaque profil : un plantage en cours de campagne ne perd
    // pas les résultats déjà payés.
    writeFileSync(
      fichier,
      JSON.stringify(
        {
          campagne,
          modele: MODELE,
          version_prompt: VERSION_PROMPT,
          date: new Date().toISOString(),
          resultats,
          resume: resumerCampagne(resultats),
        },
        null,
        2
      )
    );
  }

  console.table(
    resultats.map((r) => ({
      profil: r.nom,
      "cible kcal": r.cible_kcal,
      tentatives: r.tentatives,
      valide: r.valide ? "oui" : `non (${r.raison_echec})`,
      "écart kcal": pourcentage(r.ecart_calorique_moyen),
      "coût $": r.cout_usd.toFixed(2),
      "latence s": Math.round(r.latence_s),
    }))
  );
  const resume = resumerCampagne(resultats);
  console.log(`Valide au premier essai : ${pourcentage(resume.taux_valide_premier_essai)}`);
  console.log(`Valide après relance : ${pourcentage(resume.taux_valide)}`);
  console.log(`Écart calorique moyen : ${pourcentage(resume.ecart_calorique_moyen)}`);
  console.log(`Coût : ${resume.cout_moyen_usd.toFixed(2)} $ par génération, ${resume.cout_total_usd.toFixed(2)} $ au total`);
  console.log(`Latence moyenne : ${Math.round(resume.latence_moyenne_s)} s`);
  console.log(`Résultats : ${fichier}`);
}

main();
