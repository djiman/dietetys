import type { Entree, ReponseErreur, ReponseMenu } from "@/lib/contracts";

export type ResultatAppel = { ok: true; reponse: ReponseMenu } | { ok: false; message: string };

export const MESSAGES_APPEL = {
  delai: "La génération a dépassé le délai d'attente. Réessayez dans quelques instants.",
  annulation: "Génération annulée.",
  reseau: "Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.",
  inattendu: "Réponse inattendue du serveur. Réessayez dans quelques instants.",
};

function messageEchec(erreur: unknown): string {
  // fetch rejette avec la raison du signal : TimeoutError pour
  // AbortSignal.timeout, AbortError pour AbortController.abort().
  const nom = erreur instanceof Error ? erreur.name : "";
  if (nom === "TimeoutError") return MESSAGES_APPEL.delai;
  if (nom === "AbortError") return MESSAGES_APPEL.annulation;
  // Un corps illisible (page d'erreur HTML d'un 500, par exemple).
  if (erreur instanceof SyntaxError) return MESSAGES_APPEL.inattendu;
  return MESSAGES_APPEL.reseau;
}

/**
 * Appelle POST /api/menu et traduit chaque issue en message affichable :
 * les erreurs de la route (400, 422, 429, 502) portent déjà leur message en
 * français, il ne reste à traiter que les cas propres au navigateur.
 */
export async function demanderMenu(entree: Entree, signal: AbortSignal): Promise<ResultatAppel> {
  let reponse: Response;
  let corps: unknown;
  try {
    reponse = await fetch("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entree),
      signal,
    });
    corps = await reponse.json();
  } catch (erreur) {
    return { ok: false, message: messageEchec(erreur) };
  }

  if (reponse.ok) return { ok: true, reponse: corps as ReponseMenu };
  return { ok: false, message: (corps as ReponseErreur).erreur ?? MESSAGES_APPEL.inattendu };
}
