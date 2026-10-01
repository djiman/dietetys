import { z } from "zod";

/**
 * Contrat d'entrée (spécification § "Contrat d'entrée").
 *
 * Six champs, tous obligatoires. Les bornes écartent les fautes de saisie
 * plausibles (ex. taille en mètres au lieu de centimètres) plutôt que de
 * couvrir chaque cas extrême réel — elles ne remplacent pas un avis médical.
 */

export const SEXES = ["homme", "femme"] as const;
export type Sexe = (typeof SEXES)[number];

export const NIVEAUX_ACTIVITE = [
  "sedentaire",
  "leger",
  "modere",
  "actif",
  "tres_actif",
] as const;
export type NiveauActivite = (typeof NIVEAUX_ACTIVITE)[number];

export const OBJECTIFS = ["perte", "maintien", "prise"] as const;
export type Objectif = (typeof OBJECTIFS)[number];

export const entreeSchema = z.object({
  sexe: z.enum(SEXES, { error: "Choisissez un sexe." }),
  age: z
    .number({
      error: (issue) => (issue.input === undefined ? "L'âge est requis." : "L'âge doit être un nombre."),
    })
    .int("L'âge doit être un nombre entier d'années.")
    .min(18, "L'âge minimum est 18 ans (formule validée chez l'adulte).")
    .max(80, "L'âge maximum est 80 ans."),
  taille_cm: z
    .number({
      error: (issue) => (issue.input === undefined ? "La taille est requise." : "La taille doit être un nombre."),
    })
    .int("La taille doit être exprimée en centimètres entiers.")
    .min(140, "La taille minimale est 140 cm.")
    .max(220, "La taille maximale est 220 cm."),
  poids_kg: z
    .number({
      error: (issue) => (issue.input === undefined ? "Le poids est requis." : "Le poids doit être un nombre."),
    })
    .min(40, "Le poids minimal est 40 kg.")
    .max(200, "Le poids maximal est 200 kg."),
  activite: z.enum(NIVEAUX_ACTIVITE, { error: "Choisissez un niveau d'activité." }),
  objectif: z.enum(OBJECTIFS, { error: "Choisissez un objectif." }),
});

export type Entree = z.infer<typeof entreeSchema>;
