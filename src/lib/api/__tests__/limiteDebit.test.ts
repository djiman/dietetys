import { describe, expect, it } from "vitest";
import { creerLimiteDebit } from "../limiteDebit";

const HEURE_MS = 3_600_000;

describe("creerLimiteDebit", () => {
  it("refuse une seconde génération tant que la première est en cours", () => {
    const limite = creerLimiteDebit(10, HEURE_MS);
    expect(limite.reserver(0)).toBe("ok");
    expect(limite.reserver(1)).toBe("en_cours");
    limite.liberer();
    expect(limite.reserver(2)).toBe("ok");
  });

  it("refuse au-delà du quota de la fenêtre", () => {
    const limite = creerLimiteDebit(2, HEURE_MS);
    limite.reserver(0);
    limite.liberer();
    limite.reserver(1);
    limite.liberer();
    expect(limite.reserver(2)).toBe("quota");
  });

  it("libère le quota quand la fenêtre est passée", () => {
    const limite = creerLimiteDebit(1, HEURE_MS);
    limite.reserver(0);
    limite.liberer();
    expect(limite.reserver(HEURE_MS - 1)).toBe("quota");
    expect(limite.reserver(HEURE_MS)).toBe("ok");
  });

  it("ne compte pas une demande refusée dans le quota", () => {
    const limite = creerLimiteDebit(2, HEURE_MS);
    limite.reserver(0);
    expect(limite.reserver(1)).toBe("en_cours");
    limite.liberer();
    expect(limite.reserver(2)).toBe("ok");
  });
});
