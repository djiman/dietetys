import type Anthropic from "@anthropic-ai/sdk";
import type { Cibles, Menu } from "../../src/lib/contracts";
import { calculerTotauxJour } from "../../src/lib/domain";
import type { MODELE, RaisonEchec } from "../../src/lib/llm";

/**
 * Dollars par million de tokens. L'écriture de cache (durée de 5 minutes)
 * coûte 1,25 fois l'entrée, la lecture 0,1 fois. Indexé par le modèle : en
 * changer sans mettre à jour ses tarifs ne compile pas.
 */
const TARIFS: Record<typeof MODELE, Record<"entree" | "sortie" | "cache_ecriture" | "cache_lecture", number>> = {
  "claude-sonnet-5": { entree: 2, sortie: 10, cache_ecriture: 2.5, cache_lecture: 0.2 },
};

export type ResultatProfil = {
  nom: string;
  cible_kcal: number;
  tentatives: number;
  valide_premier_essai: boolean;
  valide: boolean;
  raison_echec: RaisonEchec | null;
  /** null quand aucun menu n'a été validé. */
  ecart_calorique_moyen: number | null;
  cout_usd: number;
  latence_s: number;
};

function moyenne(valeurs: number[]): number {
  return valeurs.reduce((somme, valeur) => somme + valeur, 0) / valeurs.length;
}

export function calculerCoutAppel(modele: typeof MODELE, usage: Anthropic.Usage): number {
  const tarif = TARIFS[modele];
  return (
    (usage.input_tokens * tarif.entree +
      usage.output_tokens * tarif.sortie +
      (usage.cache_creation_input_tokens ?? 0) * tarif.cache_ecriture +
      (usage.cache_read_input_tokens ?? 0) * tarif.cache_lecture) /
    1_000_000
  );
}

/**
 * Écart moyen des kcal journalières à la cible, en proportion (-0,05 : 5 %
 * sous la cible). Signé, pour mesurer le biais vers le bas observé en
 * phase 4, que la seconde campagne cherche à corriger.
 */
export function calculerEcartCaloriqueMoyen(menu: Menu, cibles: Cibles): number {
  return moyenne(menu.jours.map((jour) => calculerTotauxJour(jour).kcal / cibles.kcal - 1));
}

export function resumerCampagne(resultats: ResultatProfil[]) {
  const ecarts = resultats.flatMap((r) => (r.ecart_calorique_moyen === null ? [] : [r.ecart_calorique_moyen]));
  return {
    profils: resultats.length,
    taux_valide_premier_essai: resultats.filter((r) => r.valide_premier_essai).length / resultats.length,
    taux_valide: resultats.filter((r) => r.valide).length / resultats.length,
    ecart_calorique_moyen: ecarts.length > 0 ? moyenne(ecarts) : null,
    cout_moyen_usd: moyenne(resultats.map((r) => r.cout_usd)),
    cout_total_usd: resultats.reduce((somme, r) => somme + r.cout_usd, 0),
    latence_moyenne_s: moyenne(resultats.map((r) => r.latence_s)),
  };
}
