import { z } from "zod";

/**
 * Schéma du menu produit par le LLM (spécification § "Schéma du menu produit
 * par le LLM"). Sert à la fois de définition d'outil (tool use) et de
 * validation de la sortie — une seule source de vérité pour le format.
 *
 * Le LLM ne fournit aucun total : ils sont recalculés par le code à partir
 * des aliments (voir src/lib/validation, phase 3).
 */

const TYPES_REPAS = [
  "petit_dejeuner",
  "dejeuner",
  "diner",
  "collation",
] as const;
export type TypeRepas = (typeof TYPES_REPAS)[number];

const TYPES_REPAS_OBLIGATOIRES: readonly TypeRepas[] = [
  "petit_dejeuner",
  "dejeuner",
  "diner",
];

const alimentSchema = z.object({
  nom: z.string().min(1, "Le nom de l'aliment est requis."),
  quantite_g: z.number().positive("La quantité doit être positive."),
  kcal: z.number().nonnegative(),
  proteines_g: z.number().nonnegative(),
  glucides_g: z.number().nonnegative(),
  lipides_g: z.number().nonnegative(),
});
export type Aliment = z.infer<typeof alimentSchema>;

const repasSchema = z.object({
  type: z.enum(TYPES_REPAS),
  nom_plat: z.string().min(1, "Le nom du plat est requis."),
  aliments: z
    .array(alimentSchema)
    .min(1, "Un repas contient au moins un aliment."),
});
export type Repas = z.infer<typeof repasSchema>;

const jourSchema = z
  .object({
    numero: z.number().int().min(1).max(7),
    repas: z
      .array(repasSchema)
      .min(3, "Un jour contient au moins les 3 repas obligatoires.")
      .max(4, "Un jour contient au plus 4 repas (dont une collation)."),
  })
  .superRefine((jour, ctx) => {
    const types = jour.repas.map((r) => r.type);
    const doublons = types.filter((t, i) => types.indexOf(t) !== i);
    if (doublons.length > 0) {
      ctx.addIssue({
        code: "custom",
        message: `Le jour ${jour.numero} contient un type de repas en double : ${doublons.join(", ")}.`,
        path: ["repas"],
      });
    }
    for (const obligatoire of TYPES_REPAS_OBLIGATOIRES) {
      if (!types.includes(obligatoire)) {
        ctx.addIssue({
          code: "custom",
          message: `Le jour ${jour.numero} n'a pas de repas de type "${obligatoire}".`,
          path: ["repas"],
        });
      }
    }
  });
export type Jour = z.infer<typeof jourSchema>;

export const menuSchema = z.object({
  jours: z
    .array(jourSchema)
    .length(7, "Le menu doit contenir exactement 7 jours.")
    .superRefine((jours, ctx) => {
      const numeros = jours.map((j) => j.numero);
      const attendus = [1, 2, 3, 4, 5, 6, 7];
      const manquants = attendus.filter((n) => !numeros.includes(n));
      if (manquants.length > 0) {
        ctx.addIssue({
          code: "custom",
          message: `Numéros de jour manquants ou dupliqués : attendus 1 à 7, reçus ${numeros.join(", ")}.`,
        });
      }
    }),
});
export type Menu = z.infer<typeof menuSchema>;
