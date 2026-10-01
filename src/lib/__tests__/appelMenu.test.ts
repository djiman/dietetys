import { afterEach, describe, expect, it, vi } from "vitest";
import type { Entree, ReponseMenu } from "@/lib/contracts";
import { CIBLES_FICTIVES, construireMenuFictif } from "@/lib/validation/__tests__/menuFictif";
import { MESSAGES_APPEL, demanderMenu } from "../appelMenu";

const ENTREE: Entree = {
  sexe: "femme",
  age: 30,
  taille_cm: 165,
  poids_kg: 60,
  activite: "modere",
  objectif: "maintien",
};

const REPONSE_MENU: ReponseMenu = {
  cibles: CIBLES_FICTIVES,
  menu: construireMenuFictif(),
  totaux_par_jour: [],
  avertissement: "Indicatif.",
};

/** Double de fetch : rend la réponse donnée, ou rejette comme le navigateur. */
function simulerFetch(resultat: Response | Error) {
  const fetchSimule = vi.fn((_url: string, init: RequestInit) => {
    if (init.signal?.aborted) return Promise.reject(init.signal.reason);
    return resultat instanceof Error ? Promise.reject(resultat) : Promise.resolve(resultat);
  });
  vi.stubGlobal("fetch", fetchSimule);
  return fetchSimule;
}

const signalLibre = () => new AbortController().signal;

describe("demanderMenu", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("envoie l'entrée en JSON à POST /api/menu avec le signal", async () => {
    const fetchSimule = simulerFetch(Response.json(REPONSE_MENU));
    const signal = signalLibre();
    await demanderMenu(ENTREE, signal);
    expect(fetchSimule).toHaveBeenCalledWith("/api/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ENTREE),
      signal,
    });
  });

  it("renvoie la réponse 200", async () => {
    simulerFetch(Response.json(REPONSE_MENU));
    expect(await demanderMenu(ENTREE, signalLibre())).toEqual({ ok: true, reponse: REPONSE_MENU });
  });

  it.each([400, 422, 429, 502])("affiche le message de la route pour un %i", async (statut) => {
    simulerFetch(Response.json({ erreur: `Message ${statut}.` }, { status: statut }));
    expect(await demanderMenu(ENTREE, signalLibre())).toEqual({ ok: false, message: `Message ${statut}.` });
  });

  it("signale une réponse illisible, comme une page d'erreur HTML", async () => {
    simulerFetch(new Response("<html>Internal Server Error</html>", { status: 500 }));
    expect(await demanderMenu(ENTREE, signalLibre())).toEqual({ ok: false, message: MESSAGES_APPEL.inattendu });
  });

  it("signale un serveur injoignable", async () => {
    simulerFetch(new TypeError("Failed to fetch"));
    expect(await demanderMenu(ENTREE, signalLibre())).toEqual({ ok: false, message: MESSAGES_APPEL.reseau });
  });

  it("signale un délai dépassé", async () => {
    simulerFetch(Response.json(REPONSE_MENU));
    const signal = AbortSignal.abort(new DOMException("Délai dépassé", "TimeoutError"));
    expect(await demanderMenu(ENTREE, signal)).toEqual({ ok: false, message: MESSAGES_APPEL.delai });
  });

  it("signale une annulation par l'utilisateur", async () => {
    simulerFetch(Response.json(REPONSE_MENU));
    expect(await demanderMenu(ENTREE, AbortSignal.abort())).toEqual({
      ok: false,
      message: MESSAGES_APPEL.annulation,
    });
  });
});
