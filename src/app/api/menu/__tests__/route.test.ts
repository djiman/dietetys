import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Entree } from "@/lib/contracts";
import { MESSAGE_REFUS_SECURITE, calculerCibles } from "@/lib/domain";
import { genererMenu, type ResultatGeneration } from "@/lib/llm";
import { construireMenuFictif } from "@/lib/validation/__tests__/menuFictif";

// Double de l'orchestrateur : aucun appel au LLM, résultat choisi par test.
vi.mock("@/lib/llm", () => ({ genererMenu: vi.fn() }));

const ENTREE: Entree = {
  sexe: "femme",
  age: 30,
  taille_cm: 165,
  poids_kg: 60,
  activite: "modere",
  objectif: "maintien",
};

function requete(corps: unknown): Request {
  return new Request("http://localhost/api/menu", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof corps === "string" ? corps : JSON.stringify(corps),
  });
}

let POST: (request: Request) => Promise<Response>;

describe("POST /api/menu", () => {
  beforeEach(async () => {
    // Module rechargé à chaque test : la limitation de débit repart à zéro.
    vi.resetModules();
    ({ POST } = await import("../route"));
    vi.mocked(genererMenu).mockResolvedValue({ ok: true, menu: construireMenuFictif() });
    vi.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(genererMenu).mockReset();
  });

  it("renvoie 200 avec les cibles, le menu, les totaux par jour et l'avertissement", async () => {
    const reponse = await POST(requete(ENTREE));
    expect(reponse.status).toBe(200);
    const corps = await reponse.json();
    expect(corps.cibles).toEqual(calculerCibles(ENTREE));
    expect(corps.menu).toEqual(construireMenuFictif());
    expect(corps.totaux_par_jour).toHaveLength(7);
    expect(corps.totaux_par_jour[0]).toEqual({ kcal: 1914, proteines_g: 105, glucides_g: 225, lipides_g: 66 });
    expect(corps.avertissement).toContain("ne remplace pas un avis médical");
  });

  it("transmet à l'orchestrateur les cibles, le signal de la requête et un identifiant", async () => {
    const req = requete(ENTREE);
    await POST(req);
    expect(genererMenu).toHaveBeenCalledWith(calculerCibles(ENTREE), {
      signal: req.signal,
      idRequete: expect.any(String),
    });
  });

  it("renvoie 400 pour un JSON illisible, sans appeler le modèle", async () => {
    const reponse = await POST(requete("{age"));
    expect(reponse.status).toBe(400);
    expect(await reponse.json()).toEqual({ erreur: "Le corps de la requête n'est pas un JSON valide." });
    expect(genererMenu).not.toHaveBeenCalled();
  });

  it("renvoie 400 avec le détail par champ pour une entrée invalide", async () => {
    const reponse = await POST(requete({ ...ENTREE, age: 12, taille_cm: undefined }));
    expect(reponse.status).toBe(400);
    const corps = await reponse.json();
    expect(corps.erreur).toBe("Entrée invalide.");
    expect(Object.keys(corps.champs).sort()).toEqual(["age", "taille_cm"]);
    expect(genererMenu).not.toHaveBeenCalled();
  });

  it("renvoie 422 quand la règle de sécurité IMC s'applique", async () => {
    const reponse = await POST(requete({ ...ENTREE, poids_kg: 50, objectif: "perte" }));
    expect(reponse.status).toBe(422);
    expect(await reponse.json()).toEqual({ erreur: MESSAGE_REFUS_SECURITE });
    expect(genererMenu).not.toHaveBeenCalled();
  });

  it("renvoie 502 avec un message générique quand la génération échoue", async () => {
    vi.mocked(genererMenu).mockResolvedValue({ ok: false, raison: "validation" });
    const reponse = await POST(requete(ENTREE));
    expect(reponse.status).toBe(502);
    const corps = await reponse.json();
    expect(corps.erreur).toMatch(/n'a pas pu être généré/);
    expect(JSON.stringify(corps)).not.toContain("validation");
  });

  it("renvoie 429 tant qu'une génération est en cours, puis accepte de nouveau", async () => {
    let terminer!: (resultat: ResultatGeneration) => void;
    vi.mocked(genererMenu).mockReturnValueOnce(new Promise((resoudre) => (terminer = resoudre)));

    const premiere = POST(requete(ENTREE));
    const seconde = await POST(requete(ENTREE));
    expect(seconde.status).toBe(429);
    expect((await seconde.json()).erreur).toMatch(/déjà en cours/);

    terminer({ ok: true, menu: construireMenuFictif() });
    expect((await premiere).status).toBe(200);
    expect((await POST(requete(ENTREE))).status).toBe(200);
  });

  it("renvoie 429 au-delà de 10 générations sur l'heure", async () => {
    for (let i = 0; i < 10; i++) {
      expect((await POST(requete(ENTREE))).status).toBe(200);
    }
    const reponse = await POST(requete(ENTREE));
    expect(reponse.status).toBe(429);
    expect((await reponse.json()).erreur).toMatch(/Trop de menus/);
  });

  it("ne consomme pas le quota pour une requête refusée", async () => {
    for (let i = 0; i < 10; i++) {
      await POST(requete({ ...ENTREE, age: 12 }));
    }
    expect((await POST(requete(ENTREE))).status).toBe(200);
  });

  it("libère la génération en cours même si l'orchestrateur lève une exception", async () => {
    vi.mocked(genererMenu).mockRejectedValueOnce(new TypeError("bogue"));
    await expect(POST(requete(ENTREE))).rejects.toThrow("bogue");
    expect((await POST(requete(ENTREE))).status).toBe(200);
  });

  it("journalise chaque requête avec son statut, sans données personnelles", async () => {
    await POST(requete({ ...ENTREE, poids_kg: 50, objectif: "perte" }));
    const lignes = vi.mocked(console.log).mock.calls.map(([ligne]) => JSON.parse(ligne));
    expect(lignes).toEqual([
      { evenement: "requete_menu", id_requete: expect.any(String), statut_http: 422, duree_ms: expect.any(Number) },
    ]);
  });
});
