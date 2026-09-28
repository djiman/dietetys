import { describe, expect, it } from "vitest";
import { calculerCibles } from "../cibles";
import type { Entree } from "@/lib/contracts";

describe("calculerCibles", () => {
  it("cas nominal : homme, 30 ans, 180 cm, 80 kg, modéré, maintien", () => {
    const entree: Entree = {
      sexe: "homme",
      age: 30,
      taille_cm: 180,
      poids_kg: 80,
      activite: "modere",
      objectif: "maintien",
    };
    // MB = 10*80 + 6.25*180 - 5*30 + 5 = 1780
    // Dépense = 1780 * 1.55 = 2759 -> arrondi à 2750
    const cibles = calculerCibles(entree);
    expect(cibles.kcal).toBe(2750);
    expect(cibles.proteines_g).toBe(96);
    expect(cibles.lipides_g).toBe(92);
    expect(cibles.glucides_g).toBe(385);
  });

  it("plancher déclenché : femme légère et sédentaire en perte", () => {
    const entree: Entree = {
      sexe: "femme",
      age: 25,
      taille_cm: 165,
      poids_kg: 55,
      activite: "sedentaire",
      objectif: "perte",
    };
    // MB = 1295.25 ; dépense = 1554.3 ; cible ajustée = 1243.44
    // Le plancher (MB = 1295.25) dépasse la cible ajustée -> plancher appliqué.
    const cibles = calculerCibles(entree);
    expect(cibles.kcal).toBe(1300);
    expect(cibles.proteines_g).toBe(88);
    expect(cibles.lipides_g).toBe(43);
    expect(cibles.glucides_g).toBe(140);
  });

  it("plafond de protéines déclenché : poids élevé en perte", () => {
    const entree: Entree = {
      sexe: "femme",
      age: 80,
      taille_cm: 140,
      poids_kg: 200,
      activite: "sedentaire",
      objectif: "perte",
    };
    // 1,6 g/kg * 200 kg = 320 g, très au-dessus du plafond de 30 % des kcal.
    const cibles = calculerCibles(entree);
    expect(cibles.kcal).toBe(2300);
    expect(cibles.proteines_g).toBe(173);
    expect(cibles.lipides_g).toBe(77);
    expect(cibles.glucides_g).toBe(230);
  });

  it("les kcal totales reconstituées à partir des macros restent proches de la cible", () => {
    const entree: Entree = {
      sexe: "homme",
      age: 45,
      taille_cm: 175,
      poids_kg: 90,
      activite: "actif",
      objectif: "prise",
    };
    const cibles = calculerCibles(entree);
    const kcalRecalculees =
      cibles.proteines_g * 4 + cibles.glucides_g * 4 + cibles.lipides_g * 9;
    expect(Math.abs(kcalRecalculees - cibles.kcal)).toBeLessThanOrEqual(4);
  });
});
