import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ReponseMenu } from "@/lib/contracts";
import { calculerTotauxJour } from "@/lib/domain";
import { CIBLES_FICTIVES, construireMenuFictif } from "@/lib/validation/__tests__/menuFictif";
import { AffichageMenu } from "../AffichageMenu";

function reponseFictive(): ReponseMenu {
  const menu = construireMenuFictif();
  // Repas dans le désordre, comme le modèle peut les renvoyer.
  menu.jours[0].repas.reverse();
  return {
    cibles: CIBLES_FICTIVES,
    menu,
    totaux_par_jour: menu.jours.map(calculerTotauxJour),
    avertissement: "Ce menu est indicatif.",
  };
}

const rendre = (reponse: ReponseMenu) => renderToStaticMarkup(<AffichageMenu reponse={reponse} />);

/** Texte visible, sans balises ni entités, espaces normalisées. */
function texte(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/gu, " ")
    .trim();
}

/** Texte de chaque onglet de jour, dans l'ordre. */
function onglets(html: string): string[] {
  return [...html.matchAll(/<button[^>]*role="tab"[^>]*>(.*?)<\/button>/g)].map(([, contenu]) => texte(contenu));
}

/** Contenu du panneau du jour affiché. */
function panneau(html: string): string {
  return texte(html.split('role="tabpanel"')[1]);
}

describe("AffichageMenu", () => {
  it("propose un onglet par jour, le premier sélectionné", () => {
    const html = rendre(reponseFictive());
    expect(onglets(html)).toHaveLength(7);
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(html).toMatch(/id="onglet-jour-0"[^>]*aria-selected="true"|aria-selected="true"[^>]*id="onglet-jour-0"/);
  });

  it("résume chaque jour par son total et son écart à la cible", () => {
    const reponse = reponseFictive();
    reponse.totaux_par_jour[1] = { ...reponse.totaux_par_jour[1], kcal: 2040 };
    const [jour1, jour2] = onglets(rendre(reponse));
    // 1914 kcal pour une cible de 2000.
    expect(jour1).toBe("Jour 1 1 914 kcal −4 %");
    expect(jour2).toBe("Jour 2 2 040 kcal +2 %");
  });

  it("affiche les cibles en tuiles", () => {
    expect(texte(rendre(reponseFictive()))).toContain("Énergie 2 000 kcal Protéines 100 g Glucides 225 g Lipides 67 g");
  });

  it("montre la semaine en un coup d'œil, plats principaux compris", () => {
    const contenu = texte(rendre(reponseFictive()).split("</table>")[0]);
    expect(contenu).toContain("La semaine en un coup d'œil");
    expect(contenu).toContain("Lentilles corail et carottes");
    expect(contenu).toContain("Soupe de légumes et pain complet");
  });

  it("compare chaque total du jour à sa cible", () => {
    const contenu = panneau(rendre(reponseFictive()));
    expect(contenu).toContain("Énergie 1 914 / 2 000 kcal");
    expect(contenu).toContain("Protéines 105 / 100 g");
    expect(contenu).toContain("Lipides 66 / 67 g");
  });

  it("range les repas du jour dans l'ordre de la journée, avec leurs kcal", () => {
    const contenu = panneau(rendre(reponseFictive()));
    const positions = ["Petit-déjeuner", "Déjeuner", "Dîner"].map((libelle) => contenu.indexOf(libelle));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(contenu).toContain("Porridge aux fruits 638 kcal");
  });

  it("liste les aliments avec leur quantité et leurs kcal", () => {
    expect(panneau(rendre(reponseFictive()))).toContain("Flocons d'avoine 300 g · 638 kcal");
  });

  it("affiche l'avertissement", () => {
    expect(rendre(reponseFictive())).toContain("Ce menu est indicatif.");
  });
});
