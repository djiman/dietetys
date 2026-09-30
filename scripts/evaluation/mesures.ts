import type { Cibles, Menu } from "../../src/lib/contracts";
import { calculerTotauxJour } from "../../src/lib/domain";
import type { RaisonEchec } from "../../src/lib/llm";

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
