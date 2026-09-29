import Anthropic from "@anthropic-ai/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { genererMenu, type AppelerModele } from "../orchestrateur";
import {
  CIBLES_FICTIVES,
  construireMenuFictif,
} from "@/lib/validation/__tests__/menuFictif";

function reponse(
  texte: string,
  stop_reason: Anthropic.Message["stop_reason"] = "end_turn"
): Anthropic.Message {
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-sonnet-5",
    content: [{ type: "text", text: texte, citations: null }],
    stop_reason,
    stop_sequence: null,
    usage: { input_tokens: 1000, output_tokens: 9000 },
  } as Anthropic.Message;
}

const MENU_VALIDE = JSON.stringify(construireMenuFictif());

function menuInvalide(): string {
  const menu = construireMenuFictif();
  menu.jours[1].repas[1].nom_plat = "Poulet riz brocolis";
  menu.jours[2].repas[1].nom_plat = "Poulet riz brocolis";
  return JSON.stringify(menu);
}

/** Faux modèle qui renvoie les réponses dans l'ordre et garde les appels. */
function fauxModele(...reponses: (Anthropic.Message | Error)[]) {
  const appels: Anthropic.MessageParam[][] = [];
  const appeler: AppelerModele = async (messages) => {
    appels.push(structuredClone(messages));
    const suivante = reponses[appels.length - 1];
    if (suivante instanceof Error) throw suivante;
    return suivante;
  };
  return { appeler, appels };
}

describe("genererMenu", () => {
  // Les logs JSON encombreraient la sortie des tests.
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renvoie le menu valide dès le premier appel", async () => {
    const { appeler, appels } = fauxModele(reponse(MENU_VALIDE));
    const resultat = await genererMenu(CIBLES_FICTIVES, appeler);
    expect(resultat).toEqual({ ok: true, menu: construireMenuFictif() });
    expect(appels).toHaveLength(1);
  });

  it("n'envoie au modèle que les cibles", async () => {
    const { appeler, appels } = fauxModele(reponse(MENU_VALIDE));
    await genererMenu(CIBLES_FICTIVES, appeler);
    expect(appels[0]).toEqual([
      { role: "user", content: expect.stringContaining("2000 kcal") },
    ]);
  });

  it("relance une fois en continuant la conversation avec les erreurs", async () => {
    const premiere = reponse(menuInvalide());
    const { appeler, appels } = fauxModele(premiere, reponse(MENU_VALIDE));
    const resultat = await genererMenu(CIBLES_FICTIVES, appeler);

    expect(resultat.ok).toBe(true);
    expect(appels).toHaveLength(2);
    const [cibles, precedente, relance] = appels[1];
    expect(cibles).toEqual(appels[0][0]);
    expect(precedente).toEqual({ role: "assistant", content: premiere.content });
    expect(relance.role).toBe("user");
    expect(relance.content).toContain("« Poulet riz brocolis » apparaît 3 fois");
  });

  it("abandonne après une relance encore invalide", async () => {
    const { appeler, appels } = fauxModele(
      reponse(menuInvalide()),
      reponse(menuInvalide())
    );
    const resultat = await genererMenu(CIBLES_FICTIVES, appeler);
    expect(resultat).toEqual({ ok: false, raison: "validation" });
    expect(appels).toHaveLength(2);
  });

  it("relance quand la réponse n'est pas un JSON valide", async () => {
    const { appeler, appels } = fauxModele(
      reponse("{ pas du json"),
      reponse(MENU_VALIDE)
    );
    expect((await genererMenu(CIBLES_FICTIVES, appeler)).ok).toBe(true);
    expect(appels[1][2].content).toContain("pas un JSON valide");
  });

  it("signale un JSON invalide deux fois de suite", async () => {
    const { appeler } = fauxModele(reponse("{"), reponse("{"));
    expect(await genererMenu(CIBLES_FICTIVES, appeler)).toEqual({
      ok: false,
      raison: "json_invalide",
    });
  });

  it("abandonne sans relance une réponse tronquée", async () => {
    const { appeler, appels } = fauxModele(reponse('{"jours": [', "max_tokens"));
    expect(await genererMenu(CIBLES_FICTIVES, appeler)).toEqual({
      ok: false,
      raison: "troncature",
    });
    expect(appels).toHaveLength(1);
  });

  it("abandonne sans relance un refus du modèle", async () => {
    const { appeler, appels } = fauxModele(reponse("", "refusal"));
    expect(await genererMenu(CIBLES_FICTIVES, appeler)).toEqual({
      ok: false,
      raison: "refus",
    });
    expect(appels).toHaveLength(1);
  });

  it("signale une erreur de l'API sans la propager", async () => {
    const surcharge = new Anthropic.InternalServerError(
      529,
      undefined,
      "Overloaded",
      new Headers()
    );
    const { appeler } = fauxModele(surcharge);
    expect(await genererMenu(CIBLES_FICTIVES, appeler)).toEqual({
      ok: false,
      raison: "api",
    });
  });

  it("propage une erreur qui ne vient pas de l'API", async () => {
    const { appeler } = fauxModele(new TypeError("bogue"));
    await expect(genererMenu(CIBLES_FICTIVES, appeler)).rejects.toThrow("bogue");
  });

  it("journalise chaque appel sans le contenu du menu", async () => {
    const { appeler } = fauxModele(reponse(menuInvalide()), reponse(MENU_VALIDE));
    await genererMenu(CIBLES_FICTIVES, appeler);

    const lignes = vi.mocked(console.log).mock.calls.map(([ligne]) => JSON.parse(ligne));
    expect(lignes).toHaveLength(2);
    expect(lignes[0]).toMatchObject({
      evenement: "generation_menu",
      tentative: 1,
      tokens_sortie: 9000,
      controles_echoues: ["diversite"],
      valide: false,
    });
    expect(lignes[1]).toMatchObject({ tentative: 2, valide: true });
    expect(JSON.stringify(lignes)).not.toContain("Poulet");
  });
});
