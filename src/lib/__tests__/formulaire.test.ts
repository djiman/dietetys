import { describe, expect, it } from "vitest";
import { lireEntreeFormulaire } from "../formulaire";

const SAISIE_VALIDE = {
  sexe: "femme",
  age: "30",
  taille_cm: "165",
  poids_kg: "60",
  activite: "modere",
  objectif: "maintien",
};

function formulaire(champs: Record<string, string>): FormData {
  const donnees = new FormData();
  for (const [nom, valeur] of Object.entries(champs)) donnees.set(nom, valeur);
  return donnees;
}

describe("lireEntreeFormulaire", () => {
  it("convertit une saisie valide en entrée typée", () => {
    expect(lireEntreeFormulaire(formulaire(SAISIE_VALIDE))).toEqual({
      ok: true,
      entree: {
        sexe: "femme",
        age: 30,
        taille_cm: 165,
        poids_kg: 60,
        activite: "modere",
        objectif: "maintien",
      },
    });
  });

  it("accepte la virgule décimale et les espaces autour du nombre", () => {
    const resultat = lireEntreeFormulaire(formulaire({ ...SAISIE_VALIDE, poids_kg: " 62,5 " }));
    expect(resultat).toMatchObject({ ok: true, entree: { poids_kg: 62.5 } });
  });

  it("signale chaque champ vide avec un message en français", () => {
    const vide = Object.fromEntries(Object.keys(SAISIE_VALIDE).map((champ) => [champ, ""]));
    expect(lireEntreeFormulaire(formulaire(vide))).toEqual({
      ok: false,
      erreurs: {
        sexe: "Choisissez un sexe.",
        age: "L'âge est requis.",
        taille_cm: "La taille est requise.",
        poids_kg: "Le poids est requis.",
        activite: "Choisissez un niveau d'activité.",
        objectif: "Choisissez un objectif.",
      },
    });
  });

  it("reprend les messages de bornes du schéma serveur", () => {
    const resultat = lireEntreeFormulaire(formulaire({ ...SAISIE_VALIDE, age: "12", taille_cm: "1,65" }));
    expect(resultat).toEqual({
      ok: false,
      erreurs: {
        age: "L'âge minimum est 18 ans (formule validée chez l'adulte).",
        taille_cm: "La taille doit être exprimée en centimètres entiers.",
      },
    });
  });

  it("signale un texte qui n'est pas un nombre", () => {
    const resultat = lireEntreeFormulaire(formulaire({ ...SAISIE_VALIDE, age: "trente" }));
    expect(resultat).toEqual({ ok: false, erreurs: { age: "L'âge doit être un nombre." } });
  });
});
