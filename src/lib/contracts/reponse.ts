import type { Menu } from "./menu";
import type { Cibles } from "./targets";

/**
 * Contrat de réponse de POST /api/menu (spécification § "Contrat de la
 * route API"), partagé par la route et le frontend.
 */

/** Réponse 200. Les totaux sont recalculés par le code, jamais par le LLM. */
export type ReponseMenu = {
  cibles: Cibles;
  menu: Menu;
  totaux_par_jour: Cibles[];
  avertissement: string;
};

/** Réponses 400, 422, 429 et 502 : un message prêt à afficher. */
export type ReponseErreur = {
  erreur: string;
  champs?: Record<string, string[]>;
};

/**
 * Échéance de toute la génération côté serveur : deux tentatives, réessais
 * du SDK compris. Le pire cas mesuré en phase 5 est de 392 s pour une seule
 * tentative. Le client attend un peu plus longtemps pour recevoir le 502 du
 * serveur plutôt que de couper avant.
 */
export const DELAI_GENERATION_MS = 600_000;
