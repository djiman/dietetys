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

describe("AffichageMenu", () => {
  it("affiche un bloc par jour, seul le premier ouvert", () => {
    const html = rendre(reponseFictive());
    expect(html.match(/<details/g)).toHaveLength(7);
    expect(html.match(/<details[^>]*open/g)).toHaveLength(1);
    expect(html.indexOf("<details open")).toBe(html.indexOf("<details"));
  });

  it("résume chaque jour par son total et son écart à la cible", () => {
    const reponse = reponseFictive();
    reponse.totaux_par_jour[1] = { ...reponse.totaux_par_jour[1], kcal: 2040 };
    const html = rendre(reponse);
    // 1914 kcal pour une cible de 2000.
    expect(html).toContain(`Jour 1</h3>`);
    expect(html).toMatch(/1\s914 kcal, −4 %/u);
    expect(html).toMatch(/2\s040 kcal, \+2 %/u);
  });

  it("affiche les cibles et les totaux de macronutriments du jour", () => {
    const html = rendre(reponseFictive());
    expect(html).toMatch(/Cibles journalières : 2\s000 kcal · 100 g\s+de protéines/u);
    expect(html).toContain("Total du jour : 105 g de protéines");
  });

  it("range les repas dans l'ordre de la journée", () => {
    const jour1 = rendre(reponseFictive()).split("<details")[1];
    const positions = ["Petit-déjeuner", "Déjeuner", "Dîner"].map((libelle) => jour1.indexOf(libelle));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("liste les aliments avec leur quantité et leurs kcal", () => {
    expect(rendre(reponseFictive())).toContain("Flocons d&#x27;avoine, 300 g");
  });

  it("affiche l'avertissement", () => {
    expect(rendre(reponseFictive())).toContain("Ce menu est indicatif.");
  });
});
