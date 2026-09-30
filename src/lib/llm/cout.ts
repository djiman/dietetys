import type Anthropic from "@anthropic-ai/sdk";
import type { MODELE } from "./orchestrateur";

/**
 * Dollars par million de tokens. L'écriture de cache (durée de 5 minutes)
 * coûte 1,25 fois l'entrée, la lecture 0,1 fois. Indexé par le modèle : en
 * changer sans mettre à jour ses tarifs ne compile pas.
 */
const TARIFS: Record<typeof MODELE, Record<"entree" | "sortie" | "cache_ecriture" | "cache_lecture", number>> = {
  "claude-sonnet-5": { entree: 2, sortie: 10, cache_ecriture: 2.5, cache_lecture: 0.2 },
};

export function calculerCoutAppel(modele: typeof MODELE, usage: Anthropic.Usage): number {
  const tarif = TARIFS[modele];
  return (
    (usage.input_tokens * tarif.entree +
      usage.output_tokens * tarif.sortie +
      (usage.cache_creation_input_tokens ?? 0) * tarif.cache_ecriture +
      (usage.cache_read_input_tokens ?? 0) * tarif.cache_lecture) /
    1_000_000
  );
}
