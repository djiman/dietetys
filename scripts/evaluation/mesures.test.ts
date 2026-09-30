import { describe, expect, it } from "vitest";
import {
  CIBLES_FICTIVES,
  construireMenuFictif,
} from "../../src/lib/validation/__tests__/menuFictif";
import {
  calculerEcartCaloriqueMoyen,
  resumerCampagne,
  type ResultatProfil,
} from "./mesures";

describe("calculerEcartCaloriqueMoyen", () => {
  it("est négatif quand les jours sont sous la cible", () => {
    // 1914 kcal par jour pour une cible de 2000.
    expect(calculerEcartCaloriqueMoyen(construireMenuFictif(), CIBLES_FICTIVES)).toBeCloseTo(-0.043);
  });

  it("moyenne les écarts des sept jours, signes compris", () => {
    const menu = construireMenuFictif();
    // Jour 1 porté à 1914 + 7 × 86 kcal : son écart compense les six autres.
    menu.jours[0].repas[0].aliments[0].kcal += 7 * 86;
    expect(calculerEcartCaloriqueMoyen(menu, CIBLES_FICTIVES)).toBeCloseTo(0);
  });
});

describe("resumerCampagne", () => {
  const resultat: ResultatProfil = {
    nom: "Profil",
    cible_kcal: 2000,
    tentatives: 1,
    valide_premier_essai: true,
    valide: true,
    raison_echec: null,
    ecart_calorique_moyen: -0.06,
    cout_usd: 0.3,
    latence_s: 120,
  };

  it("agrège taux, écart, coût et latence ; l'écart ignore les profils sans menu", () => {
    const resume = resumerCampagne([
      resultat,
      { ...resultat, tentatives: 2, valide_premier_essai: false, ecart_calorique_moyen: -0.02, cout_usd: 0.5, latence_s: 240 },
      { ...resultat, tentatives: 2, valide_premier_essai: false, valide: false, raison_echec: "validation", ecart_calorique_moyen: null, cout_usd: 0.4, latence_s: 180 },
    ]);
    expect(resume.profils).toBe(3);
    expect(resume.taux_valide_premier_essai).toBeCloseTo(1 / 3);
    expect(resume.taux_valide).toBeCloseTo(2 / 3);
    expect(resume.ecart_calorique_moyen).toBeCloseTo(-0.04);
    expect(resume.cout_total_usd).toBeCloseTo(1.2);
    expect(resume.cout_moyen_usd).toBeCloseTo(0.4);
    expect(resume.latence_moyenne_s).toBeCloseTo(180);
  });

  it("n'a pas d'écart quand aucun menu n'est validé", () => {
    expect(resumerCampagne([{ ...resultat, valide: false, ecart_calorique_moyen: null }]).ecart_calorique_moyen).toBeNull();
  });
});
