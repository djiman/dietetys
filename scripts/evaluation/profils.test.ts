import { describe, expect, it } from "vitest";
import { entreeSchema } from "../../src/lib/contracts";
import { calculerCibles, doitRefuserPourSecurite } from "../../src/lib/domain";
import { PROFILS_EVALUATION } from "./profils";

// Un profil invalide ou refusé ne serait sinon découvert qu'en pleine
// campagne, après des appels déjà facturés.
describe("PROFILS_EVALUATION", () => {
  it.each(PROFILS_EVALUATION)("$nom est une entrée valide et acceptée", ({ entree }) => {
    expect(entreeSchema.safeParse(entree).success).toBe(true);
    expect(doitRefuserPourSecurite(entree)).toBe(false);
  });

  it("couvre les trois objectifs, chacun avec une petite et une grande cible", () => {
    for (const objectif of ["perte", "maintien", "prise"] as const) {
      const cibles = PROFILS_EVALUATION.filter((p) => p.entree.objectif === objectif).map(
        (p) => calculerCibles(p.entree).kcal
      );
      expect(cibles).toHaveLength(2);
      expect(Math.max(...cibles) - Math.min(...cibles)).toBeGreaterThanOrEqual(750);
    }
  });
});
