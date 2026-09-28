import { describe, expect, it } from "vitest";
import { calculerIMC, doitRefuserPourSecurite } from "../securite";
import type { Entree } from "@/lib/contracts";

const base: Entree = {
  sexe: "femme",
  age: 25,
  taille_cm: 165,
  poids_kg: 55,
  activite: "sedentaire",
  objectif: "perte",
};

describe("calculerIMC", () => {
  it("calcule l'IMC à partir du poids et de la taille", () => {
    // 55 / 1.65² ≈ 20.20
    expect(calculerIMC(55, 165)).toBeCloseTo(20.2, 1);
  });
});

describe("doitRefuserPourSecurite", () => {
  it("refuse un objectif de perte avec un IMC inférieur à 18,5", () => {
    // 50 / 1.70² ≈ 17.30
    const entree: Entree = { ...base, poids_kg: 50, taille_cm: 170 };
    expect(doitRefuserPourSecurite(entree)).toBe(true);
  });

  it("ne refuse pas un IMC tout juste à 18,5", () => {
    // poids choisi pour un IMC exactement à 18,5 avec taille 170 cm.
    const poidsSeuil = 18.5 * 1.7 * 1.7;
    const entree: Entree = { ...base, poids_kg: poidsSeuil, taille_cm: 170 };
    expect(doitRefuserPourSecurite(entree)).toBe(false);
  });

  it("ne refuse pas un IMC bas quand l'objectif n'est pas la perte", () => {
    const entree: Entree = {
      ...base,
      poids_kg: 50,
      taille_cm: 170,
      objectif: "maintien",
    };
    expect(doitRefuserPourSecurite(entree)).toBe(false);
  });

  it("ne refuse pas un IMC normal en perte", () => {
    expect(doitRefuserPourSecurite(base)).toBe(false);
  });
});
