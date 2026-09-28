import { describe, expect, it } from "vitest";
import { menuSchema, type Repas } from "../menu";

const aliment = {
  nom: "Poulet rôti",
  quantite_g: 150,
  kcal: 250,
  proteines_g: 30,
  glucides_g: 0,
  lipides_g: 14,
};

const repasObligatoires: Repas[] = [
  { type: "petit_dejeuner", nom_plat: "Porridge", aliments: [aliment] },
  { type: "dejeuner", nom_plat: "Poulet riz", aliments: [aliment] },
  { type: "diner", nom_plat: "Saumon légumes", aliments: [aliment] },
];

function menuValide() {
  return {
    jours: Array.from({ length: 7 }, (_, i) => ({
      numero: i + 1,
      repas: repasObligatoires,
    })),
  };
}

describe("menuSchema", () => {
  it("accepte un menu de 7 jours avec les 3 repas obligatoires", () => {
    const result = menuSchema.safeParse(menuValide());
    expect(result.success).toBe(true);
  });

  it("accepte une collation en 4e repas", () => {
    const menu = menuValide();
    menu.jours[0].repas = [
      ...repasObligatoires,
      { type: "collation", nom_plat: "Fruits secs", aliments: [aliment] },
    ];
    expect(menuSchema.safeParse(menu).success).toBe(true);
  });

  it("rejette un menu de 6 jours", () => {
    const menu = menuValide();
    menu.jours.pop();
    expect(menuSchema.safeParse(menu).success).toBe(false);
  });

  it("rejette un menu de 8 jours", () => {
    const menu = menuValide();
    menu.jours.push({ numero: 8, repas: repasObligatoires });
    expect(menuSchema.safeParse(menu).success).toBe(false);
  });

  it("rejette un jour sans dîner", () => {
    const menu = menuValide();
    menu.jours[0].repas = repasObligatoires.filter((r) => r.type !== "diner");
    expect(menuSchema.safeParse(menu).success).toBe(false);
  });

  it("rejette un jour avec un type de repas en double", () => {
    const menu = menuValide();
    menu.jours[0].repas = [...repasObligatoires, repasObligatoires[0]];
    expect(menuSchema.safeParse(menu).success).toBe(false);
  });

  it("rejette un repas sans aliment", () => {
    const menu = menuValide();
    menu.jours[0].repas = [
      { type: "petit_dejeuner", nom_plat: "Porridge", aliments: [] },
      repasObligatoires[1],
      repasObligatoires[2],
    ];
    expect(menuSchema.safeParse(menu).success).toBe(false);
  });
});
