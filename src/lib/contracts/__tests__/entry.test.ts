import { describe, expect, it } from "vitest";
import { entreeSchema } from "../entry";

const base = {
  sexe: "homme" as const,
  age: 30,
  taille_cm: 180,
  poids_kg: 80,
  activite: "modere" as const,
  objectif: "maintien" as const,
};

describe("entreeSchema", () => {
  it("accepte une entrée nominale", () => {
    expect(entreeSchema.safeParse(base).success).toBe(true);
  });

  it.each([
    ["age", 18],
    ["age", 80],
    ["taille_cm", 140],
    ["taille_cm", 220],
    ["poids_kg", 40],
    ["poids_kg", 200],
  ] as const)("accepte la borne incluse %s = %d", (champ, valeur) => {
    const result = entreeSchema.safeParse({ ...base, [champ]: valeur });
    expect(result.success).toBe(true);
  });

  it.each([
    ["age", 17],
    ["age", 81],
    ["taille_cm", 139],
    ["taille_cm", 221],
    ["poids_kg", 39],
    ["poids_kg", 200.1],
  ] as const)("rejette la valeur hors borne %s = %s", (champ, valeur) => {
    const result = entreeSchema.safeParse({ ...base, [champ]: valeur });
    expect(result.success).toBe(false);
  });

  it("rejette une énumération inconnue pour activite", () => {
    const result = entreeSchema.safeParse({ ...base, activite: "extreme" });
    expect(result.success).toBe(false);
  });

  it("rejette une énumération inconnue pour objectif", () => {
    const result = entreeSchema.safeParse({ ...base, objectif: "seche" });
    expect(result.success).toBe(false);
  });

  it("rejette un âge non entier", () => {
    const result = entreeSchema.safeParse({ ...base, age: 30.5 });
    expect(result.success).toBe(false);
  });

  it("rejette un champ manquant", () => {
    const { sexe, ...sansSexe } = base;
    void sexe;
    const result = entreeSchema.safeParse(sansSexe);
    expect(result.success).toBe(false);
  });
});
