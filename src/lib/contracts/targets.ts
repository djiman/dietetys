/**
 * Sortie du domaine nutritionnel (spécification § "Domaine nutritionnel").
 *
 * Ces quatre valeurs sont calculées en code, jamais par le LLM : c'est le
 * seul objet que reçoit l'orchestrateur pour composer le menu. Un simple
 * type suffit : elles ne viennent jamais de l'extérieur, rien n'est à
 * valider.
 */
export type Cibles = {
  kcal: number;
  proteines_g: number;
  glucides_g: number;
  lipides_g: number;
};
