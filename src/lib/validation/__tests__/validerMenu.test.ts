import { describe, expect, it } from "vitest";
import { validerMenu } from "../validerMenu";
import {
  CIBLES_FICTIVES,
  alimentFictif,
  construireMenuFictif,
} from "./menuFictif";

function erreursDe(sortie: unknown) {
  const resultat = validerMenu(sortie, CIBLES_FICTIVES);
  if (resultat.valide) return { erreurs: [], controlesEchoues: [] };
  return resultat;
}

describe("validerMenu", () => {
  it("accepte le menu fictif et renvoie le menu typé", () => {
    const menu = construireMenuFictif();
    const resultat = validerMenu(menu, CIBLES_FICTIVES);
    expect(resultat).toEqual({ valide: true, menu });
  });

  describe("contrôle 1 : schéma", () => {
    it("rejette un menu de 6 jours sans exécuter les autres contrôles", () => {
      const menu = construireMenuFictif();
      menu.jours.pop();
      // Ce menu aurait aussi des plats répétés si la diversité était vérifiée.
      menu.jours.forEach((jour) => (jour.repas[1].nom_plat = "Même plat"));
      const { erreurs, controlesEchoues } = erreursDe(menu);
      expect(controlesEchoues).toEqual(["schema"]);
      expect(erreurs.join("\n")).toContain("exactement 7 jours");
    });

    it("rejette un aliment sans kcal, en indiquant son emplacement", () => {
      const menu = construireMenuFictif() as unknown as {
        jours: { repas: { aliments: Record<string, unknown>[] }[] }[];
      };
      delete menu.jours[2].repas[1].aliments[0].kcal;
      const { erreurs, controlesEchoues } = erreursDe(menu);
      expect(controlesEchoues).toEqual(["schema"]);
      expect(erreurs[0]).toMatch(/^jours\.2\.repas\.1\.aliments\.0\.kcal : /);
    });

    it("rejette une sortie qui n'est pas un objet", () => {
      expect(erreursDe("pas un menu").controlesEchoues).toEqual(["schema"]);
    });
  });

  describe("contrôle 2 : cohérence d'Atwater", () => {
    it("rejette un aliment dont les kcal dépassent de 30 % celles des macros", () => {
      const menu = construireMenuFictif();
      menu.jours[2].repas[2].aliments[0] = {
        ...alimentFictif("Riz basmati"),
        kcal: 638 * 1.3,
      };
      const { erreurs, controlesEchoues } = erreursDe(menu);
      expect(controlesEchoues).toEqual(["atwater"]);
      expect(erreurs).toEqual([
        "Jour 3, dîner « Cabillaud et riz », aliment « Riz basmati » : 829 kcal déclarées, 638 kcal d'après ses macronutriments (écart toléré 124 kcal).",
      ]);
    });

    it("accepte un écart de 10 %", () => {
      const menu = construireMenuFictif();
      menu.jours[0].repas[0].aliments[0].kcal = 638 * 1.1;
      expect(validerMenu(menu, CIBLES_FICTIVES).valide).toBe(true);
    });

    it("tolère au moins 10 kcal d'écart pour un aliment peu calorique", () => {
      const menu = construireMenuFictif();
      menu.jours[0].repas[0].aliments.push({
        nom: "Café noir",
        quantite_g: 150,
        kcal: 2,
        proteines_g: 0.5,
        glucides_g: 0.5,
        lipides_g: 0.1,
      });
      expect(validerMenu(menu, CIBLES_FICTIVES).valide).toBe(true);
    });
  });

  describe("contrôle 3 : respect des cibles", () => {
    it("rejette un jour à 15 % sous la cible calorique", () => {
      const menu = construireMenuFictif();
      // 1700 kcal au lieu de 1800 minimum ; protéines maintenues à 105 g.
      menu.jours[4].repas[1].aliments[0] = {
        ...alimentFictif("Plat allégé"),
        kcal: 424,
        glucides_g: 21.5,
      };
      const { erreurs, controlesEchoues } = erreursDe(menu);
      expect(controlesEchoues).toEqual(["cibles"]);
      expect(erreurs).toEqual([
        "Jour 5 : 1700 kcal au total, attendu entre 1800 et 2200.",
      ]);
    });

    it("rejette un jour à 15 % au-dessus de la cible calorique", () => {
      const menu = construireMenuFictif();
      menu.jours[1].repas[1].aliments.push({
        nom: "Pain complet",
        quantite_g: 150,
        kcal: 386,
        proteines_g: 13,
        glucides_g: 70,
        lipides_g: 4,
      });
      const { erreurs, controlesEchoues } = erreursDe(menu);
      expect(controlesEchoues).toEqual(["cibles"]);
      expect(erreurs[0]).toMatch(/^Jour 2 : 2300 kcal au total/);
    });

    it("rejette un jour à 85 % de la cible de protéines", () => {
      const menu = construireMenuFictif();
      // 20 g de protéines en moins, compensés en glucides : kcal inchangées.
      menu.jours[6].repas[2].aliments[0] = {
        ...alimentFictif("Plat peu protéiné"),
        proteines_g: 15,
        glucides_g: 95,
      };
      const { erreurs, controlesEchoues } = erreursDe(menu);
      expect(controlesEchoues).toEqual(["cibles"]);
      expect(erreurs).toEqual([
        "Jour 7 : 85 g de protéines au total, attendu entre 90 et 125 g.",
      ]);
    });

    it("rejette un jour à 130 % de la cible de protéines", () => {
      const menu = construireMenuFictif();
      // 25 g de protéines en plus, pris sur les glucides : kcal inchangées.
      menu.jours[3].repas[1].aliments[0] = {
        ...alimentFictif("Plat très protéiné"),
        proteines_g: 60,
        glucides_g: 50,
      };
      const { erreurs, controlesEchoues } = erreursDe(menu);
      expect(controlesEchoues).toEqual(["cibles"]);
      expect(erreurs).toEqual([
        "Jour 4 : 130 g de protéines au total, attendu entre 90 et 125 g.",
      ]);
    });
  });

  describe("contrôle 4 : diversité", () => {
    it("rejette un plat présent 3 fois entre déjeuners et dîners", () => {
      const menu = construireMenuFictif();
      menu.jours[1].repas[1].nom_plat = "Poulet riz brocolis";
      menu.jours[3].repas[2].nom_plat = "Poulet riz brocolis";
      const { erreurs, controlesEchoues } = erreursDe(menu);
      expect(controlesEchoues).toEqual(["diversite"]);
      expect(erreurs[0]).toContain(
        "« Poulet riz brocolis » apparaît 3 fois (jours 1, 2, 4)"
      );
    });

    it("accepte un plat présent 2 fois", () => {
      const menu = construireMenuFictif();
      menu.jours[1].repas[1].nom_plat = "Poulet riz brocolis";
      expect(validerMenu(menu, CIBLES_FICTIVES).valide).toBe(true);
    });

    it("exempte les petits-déjeuners, identiques les 7 jours dans le menu fictif", () => {
      const menu = construireMenuFictif();
      expect(menu.jours.every((j) => j.repas[0].nom_plat === "Porridge aux fruits")).toBe(true);
      expect(validerMenu(menu, CIBLES_FICTIVES).valide).toBe(true);
    });

    it("ignore la casse et les espaces superflus", () => {
      const menu = construireMenuFictif();
      menu.jours[1].repas[1].nom_plat = "poulet riz brocolis";
      menu.jours[2].repas[1].nom_plat = "  Poulet  riz brocolis ";
      expect(erreursDe(menu).controlesEchoues).toEqual(["diversite"]);
    });
  });

  it("cumule les erreurs de plusieurs contrôles", () => {
    const menu = construireMenuFictif();
    menu.jours[0].repas[0].aliments[0].kcal = 1000;
    menu.jours[1].repas[1].nom_plat = "Poulet riz brocolis";
    menu.jours[2].repas[1].nom_plat = "Poulet riz brocolis";
    const { erreurs, controlesEchoues } = erreursDe(menu);
    expect(controlesEchoues).toEqual(["atwater", "cibles", "diversite"]);
    expect(erreurs).toHaveLength(3);
  });
});
