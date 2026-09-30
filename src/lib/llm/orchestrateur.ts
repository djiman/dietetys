import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { menuSchema, type Cibles, type Menu } from "@/lib/contracts";
import { validerMenu, type NomControle } from "@/lib/validation";
import { calculerCoutAppel } from "./cout";
import {
  PROMPT_SYSTEME,
  VERSION_PROMPT,
  construireMessageCibles,
  construireMessageRelance,
} from "./prompt";

export const MODELE = "claude-sonnet-5";

/**
 * Un menu fait environ 10 000 tokens, auxquels s'ajoute la réflexion du
 * modèle, décomptée du même plafond : un premier essai a consommé 21 600
 * tokens au total, et un autre a renvoyé un JSON coupé avec un plafond de
 * 32 000.
 */
const MAX_TOKENS = 64000;

/**
 * L'effort par défaut (high) portait une génération à 160 s ; medium la
 * réduit d'environ 30 % sans perte de validité sur trois profils. Conservé
 * après les évaluations (phase 5) : de 1 à 6 minutes par génération selon
 * la cible, relance comprise, avec une validité finale de 100 %.
 */
const EFFORT = "medium";

/**
 * Délai d'attente des en-têtes de réponse, par appel HTTP. En streaming, le
 * SDK ne l'applique pas au corps : un flux peut durer bien au-delà (392 s
 * mesurées pour une tentative). C'est DELAI_GENERATION_MS qui borne tout.
 */
const DELAI_MS = 180_000;

/**
 * Échéance de toute la génération : deux tentatives, réessais du SDK
 * compris. Le pire cas mesuré en phase 5 est de 392 s pour une seule
 * tentative ; le client HTTP doit attendre au moins aussi longtemps.
 */
export const DELAI_GENERATION_MS = 600_000;

export type RaisonEchec =
  | "validation"
  | "json_invalide"
  | "troncature"
  | "refus"
  | "api";

export type ResultatGeneration =
  | { ok: true; menu: Menu }
  | { ok: false; raison: RaisonEchec };

export type AppelerModele = (
  messages: Anthropic.MessageParam[],
  signal: AbortSignal
) => Promise<Anthropic.Message>;

let client: Anthropic | undefined;

// Créé à la première utilisation : importer ce module ne doit pas exiger de
// clé API (tests, build).
function obtenirClient(): Anthropic {
  client ??= new Anthropic({ timeout: DELAI_MS });
  return client;
}

// Seuls le type et le schéma sont transmis : passé tel quel, le format du SDK
// analyse lui-même la réponse et lève une exception sur un JSON tronqué ou
// invalide, court-circuitant la relance et le diagnostic de troncature.
const { type: typeFormat, schema: schemaMenu } = zodOutputFormat(menuSchema);

// Streaming recommandé pour une sortie de cette taille : il évite les délais
// d'expiration HTTP. finalMessage() rend la réponse complète.
export const appelerClaude: AppelerModele = (messages, signal) =>
  obtenirClient()
    .messages.stream(
      {
        model: MODELE,
        max_tokens: MAX_TOKENS,
        system: [
          { type: "text", text: PROMPT_SYSTEME, cache_control: { type: "ephemeral" } },
        ],
        output_config: {
          format: { type: typeFormat, schema: schemaMenu },
          effort: EFFORT,
        },
        messages,
      },
      { signal }
    )
    .finalMessage();

type Analyse =
  | { statut: "valide"; menu: Menu }
  | { statut: "a_corriger"; erreurs: string[]; controlesEchoues: NomControle[] | ["json"] }
  | { statut: "abandon"; raison: "troncature" | "refus" };

function analyserReponse(reponse: Anthropic.Message, cibles: Cibles): Analyse {
  // Une réponse coupée serait coupée au même endroit à la relance : le
  // correctif est de remonter MAX_TOKENS, pas de redemander.
  if (reponse.stop_reason === "max_tokens") return { statut: "abandon", raison: "troncature" };
  if (reponse.stop_reason === "refusal") return { statut: "abandon", raison: "refus" };

  const texte = reponse.content.find((bloc) => bloc.type === "text")?.text ?? "";
  let sortie: unknown;
  try {
    sortie = JSON.parse(texte);
  } catch {
    return {
      statut: "a_corriger",
      erreurs: ["La réponse n'est pas un JSON valide."],
      controlesEchoues: ["json"],
    };
  }

  const validation = validerMenu(sortie, cibles);
  if (validation.valide) return { statut: "valide", menu: validation.menu };
  return {
    statut: "a_corriger",
    erreurs: validation.erreurs,
    controlesEchoues: validation.controlesEchoues,
  };
}

/** Une ligne JSON par appel ; jamais le menu ni de données personnelles. */
function journaliser(entree: Record<string, unknown>): void {
  console.log(
    JSON.stringify({
      evenement: "generation_menu",
      modele: MODELE,
      version_prompt: VERSION_PROMPT,
      ...entree,
    })
  );
}

/**
 * Génère un menu validé à partir des cibles (spécification § "Validation de
 * sortie", procédure en cas d'échec) : un appel, puis au plus une relance
 * qui continue la conversation, pour que le modèle corrige son menu au lieu
 * d'en composer un autre.
 */
export async function genererMenu(
  cibles: Cibles,
  {
    appelerModele = appelerClaude,
    signal,
    idRequete,
  }: {
    appelerModele?: AppelerModele;
    /** Annulation par l'appelant, par exemple quand le client se déconnecte. */
    signal?: AbortSignal;
    /** Relie dans les logs les tentatives d'une même requête. */
    idRequete?: string;
  } = {}
): Promise<ResultatGeneration> {
  // Un appel annulé lève une APIUserAbortError, traitée comme toute erreur
  // d'API : la génération échoue proprement au lieu de pendre.
  const signalGeneration = AbortSignal.any([
    AbortSignal.timeout(DELAI_GENERATION_MS),
    ...(signal ? [signal] : []),
  ]);
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: construireMessageCibles(cibles) },
  ];

  for (const tentative of [1, 2]) {
    const debut = Date.now();
    let reponse: Anthropic.Message;
    try {
      reponse = await appelerModele(messages, signalGeneration);
    } catch (erreur) {
      if (!(erreur instanceof Anthropic.APIError)) throw erreur;
      journaliser({
        id_requete: idRequete ?? null,
        tentative,
        cibles,
        latence_ms: Date.now() - debut,
        erreur_api: erreur.constructor.name,
        statut_http: erreur.status ?? null,
        valide: false,
      });
      return { ok: false, raison: "api" };
    }

    const analyse = analyserReponse(reponse, cibles);
    journaliser({
      id_requete: idRequete ?? null,
      tentative,
      cibles,
      tokens_entree: reponse.usage.input_tokens,
      tokens_sortie: reponse.usage.output_tokens,
      tokens_cache_ecriture: reponse.usage.cache_creation_input_tokens ?? 0,
      tokens_cache_lecture: reponse.usage.cache_read_input_tokens ?? 0,
      cout_usd: calculerCoutAppel(MODELE, reponse.usage),
      latence_ms: Date.now() - debut,
      stop_reason: reponse.stop_reason,
      controles_echoues:
        analyse.statut === "a_corriger" ? analyse.controlesEchoues : [],
      valide: analyse.statut === "valide",
    });

    if (analyse.statut === "valide") return { ok: true, menu: analyse.menu };
    if (analyse.statut === "abandon") return { ok: false, raison: analyse.raison };
    if (tentative === 2) {
      const raison = analyse.controlesEchoues[0] === "json" ? "json_invalide" : "validation";
      return { ok: false, raison };
    }

    messages.push(
      { role: "assistant", content: reponse.content },
      { role: "user", content: construireMessageRelance(analyse.erreurs) }
    );
  }

  throw new Error("Inatteignable : la boucle se termine à la deuxième tentative.");
}
