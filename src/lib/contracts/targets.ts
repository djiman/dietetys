import { z } from "zod";

/**
 * Sortie du domaine nutritionnel (spécification § "Domaine nutritionnel").
 *
 * Ces quatre valeurs sont calculées en code, jamais par le LLM : c'est le
 * seul objet que reçoit l'orchestrateur pour composer le menu.
 */
export const ciblesSchema = z.object({
  kcal: z.number().positive(),
  proteines_g: z.number().nonnegative(),
  glucides_g: z.number().nonnegative(),
  lipides_g: z.number().nonnegative(),
});

export type Cibles = z.infer<typeof ciblesSchema>;
