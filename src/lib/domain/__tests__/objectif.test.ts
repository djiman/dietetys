import { describe, expect, it } from "vitest";
import { ajusterSelonObjectif, appliquerPlancher, arrondirKcal } from "../objectif";

describe("ajusterSelonObjectif", () => {
  it("maintien : ne change pas la dépense", () => {
    expect(ajusterSelonObjectif(2500, "maintien")).toBe(2500);
  });

  it("prise : ajoute 300 kcal", () => {
    expect(ajusterSelonObjectif(2500, "prise")).toBe(2800);
  });

  it("perte : retire 500 kcal quand 20 % de la dépense dépasse 500", () => {
    // 20 % de 3000 = 600 > 500, donc le déficit est plafonné à 500.
    expect(ajusterSelonObjectif(3000, "perte")).toBe(2500);
  });

  it("perte : plafonne le déficit à 20 % pour un petit gabarit", () => {
    // 20 % de 1200 = 240 < 500, donc le déficit réel est 240.
    expect(ajusterSelonObjectif(1200, "perte")).toBe(960);
  });
});

describe("appliquerPlancher", () => {
  it("ne change rien quand la cible dépasse déjà le métabolisme de base et le seuil", () => {
    expect(appliquerPlancher(2200, 1800, "homme")).toBe(2200);
  });

  it("remonte au métabolisme de base quand la cible ajustée descend en dessous", () => {
    expect(appliquerPlancher(1200, 1500, "femme")).toBe(1500);
  });

  it("remonte au seuil minimal par sexe quand le métabolisme de base est plus bas", () => {
    expect(appliquerPlancher(1000, 1100, "homme")).toBe(1500);
    expect(appliquerPlancher(1000, 1100, "femme")).toBe(1200);
  });
});

describe("arrondirKcal", () => {
  it("arrondit au pas de 50 le plus proche", () => {
    expect(arrondirKcal(2137)).toBe(2150);
    expect(arrondirKcal(2124)).toBe(2100);
    expect(arrondirKcal(2125)).toBe(2150);
  });
});
