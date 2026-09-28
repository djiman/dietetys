import { describe, expect, it } from "vitest";
import { calculerMacros } from "../macros";

describe("calculerMacros", () => {
  it("applique 1,2 g/kg en maintien quand le plafond n'est pas atteint", () => {
    const macros = calculerMacros(2750, 80, "maintien");
    expect(macros.proteines_g).toBe(96); // 1.2 * 80
    expect(macros.lipides_g).toBe(92); // 30 % de 2750 / 9
    expect(macros.glucides_g).toBe(385);
  });

  it("plafonne les protéines à 30 % des kcal pour un poids élevé en perte", () => {
    // 1.6 g/kg * 200 kg = 320 g, plafond = 2300 * 0.3 / 4 = 172.5 g.
    const macros = calculerMacros(2300, 200, "perte");
    expect(macros.proteines_g).toBe(173);
    expect(macros.lipides_g).toBe(77);
    expect(macros.glucides_g).toBe(230);
  });

  it("les kcal des trois macros reconstituent la cible, à l'arrondi près", () => {
    const kcal = 1900;
    const macros = calculerMacros(kcal, 65, "prise");
    const kcalRecalculees =
      macros.proteines_g * 4 + macros.glucides_g * 4 + macros.lipides_g * 9;
    expect(Math.abs(kcalRecalculees - kcal)).toBeLessThanOrEqual(4);
  });
});
