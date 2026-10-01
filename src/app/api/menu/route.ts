import { z } from "zod";
import { entreeSchema, type ReponseErreur, type ReponseMenu } from "@/lib/contracts";
import {
  MESSAGE_REFUS_SECURITE,
  calculerCibles,
  calculerTotauxJour,
  doitRefuserPourSecurite,
} from "@/lib/domain";
import { creerLimiteDebit } from "@/lib/api/limiteDebit";
import { genererMenu } from "@/lib/llm";

/**
 * Route de génération du menu (spécification § "Contrat de la route API") :
 * validation de l'entrée, règle de sécurité, calcul des cibles, génération,
 * puis réponse synchrone en un seul bloc.
 */

const AVERTISSEMENT =
  "Ce menu est indicatif et ne remplace pas un avis médical. Les cibles viennent d'une formule valable en moyenne, avec une marge d'erreur individuelle de l'ordre de ±10 %.";

const MESSAGES_LIMITE = {
  en_cours: "Une génération de menu est déjà en cours. Attendez qu'elle se termine.",
  quota: "Trop de menus générés sur la dernière heure. Réessayez plus tard.",
};

const MESSAGE_ECHEC_GENERATION =
  "Le menu n'a pas pu être généré. Réessayez dans quelques instants.";

// Chaque génération coûte environ 0,25 $ : au plus 10 par heure.
const limiteDebit = creerLimiteDebit(10, 3_600_000);

export async function POST(request: Request) {
  const idRequete = crypto.randomUUID();
  const debut = Date.now();

  // Une ligne par requête, en plus de celles de l'orchestrateur : compte aussi
  // les refus (400, 422, 429), qui n'appellent pas le modèle.
  function repondre(statut: number, corps: ReponseMenu | ReponseErreur): Response {
    console.log(
      JSON.stringify({
        evenement: "requete_menu",
        id_requete: idRequete,
        statut_http: statut,
        duree_ms: Date.now() - debut,
      })
    );
    return Response.json(corps, { status: statut });
  }

  let corps: unknown;
  try {
    corps = await request.json();
  } catch {
    return repondre(400, { erreur: "Le corps de la requête n'est pas un JSON valide." });
  }

  const validation = entreeSchema.safeParse(corps);
  if (!validation.success) {
    return repondre(400, {
      erreur: "Entrée invalide.",
      champs: z.flattenError(validation.error).fieldErrors,
    });
  }
  const entree = validation.data;

  if (doitRefuserPourSecurite(entree)) {
    return repondre(422, { erreur: MESSAGE_REFUS_SECURITE });
  }

  // Après la validation : une requête invalide ou refusée ne coûte rien et
  // ne doit pas consommer le quota.
  const reservation = limiteDebit.reserver(Date.now());
  if (reservation !== "ok") {
    return repondre(429, { erreur: MESSAGES_LIMITE[reservation] });
  }

  try {
    const cibles = calculerCibles(entree);
    const resultat = await genererMenu(cibles, { signal: request.signal, idRequete });
    if (!resultat.ok) {
      return repondre(502, { erreur: MESSAGE_ECHEC_GENERATION });
    }
    return repondre(200, {
      cibles,
      menu: resultat.menu,
      totaux_par_jour: resultat.menu.jours.map(calculerTotauxJour),
      avertissement: AVERTISSEMENT,
    });
  } finally {
    limiteDebit.liberer();
  }
}
