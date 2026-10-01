"use client";

import { useEffect, useRef, useState } from "react";
import { DELAI_GENERATION_MS, type Entree, type ReponseMenu } from "@/lib/contracts";
import { demanderMenu } from "@/lib/appelMenu";
import { FormulaireProfil } from "./FormulaireProfil";

// Une minute de plus que l'échéance du serveur : le client reçoit le 502
// explicite du serveur plutôt que de couper juste avant.
const DELAI_CLIENT_MS = DELAI_GENERATION_MS + 60_000;

type Etat =
  | { nom: "repos" }
  | { nom: "chargement"; debut: number }
  | { nom: "succes"; reponse: ReponseMenu }
  | { nom: "erreur"; message: string };

function TempsEcoule({ debut }: { debut: number }) {
  const [maintenant, setMaintenant] = useState(debut);
  useEffect(() => {
    const minuterie = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(minuterie);
  }, []);
  const secondes = Math.floor((maintenant - debut) / 1000);
  return (
    <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
      {Math.floor(secondes / 60)} min {String(secondes % 60).padStart(2, "0")} s
    </span>
  );
}

/**
 * Relie le formulaire à POST /api/menu. Composant client : une page serveur
 * ne peut pas transmettre de fonction (onValider) à un composant client.
 */
export function Generateur() {
  const [etat, setEtat] = useState<Etat>({ nom: "repos" });
  const controleur = useRef<AbortController | null>(null);

  // Quitter la page interrompt la génération : la route arrête alors aussi
  // l'appel facturé au modèle.
  useEffect(() => () => controleur.current?.abort(), []);

  async function generer(entree: Entree) {
    controleur.current = new AbortController();
    setEtat({ nom: "chargement", debut: Date.now() });
    const resultat = await demanderMenu(
      entree,
      AbortSignal.any([controleur.current.signal, AbortSignal.timeout(DELAI_CLIENT_MS)])
    );
    setEtat(
      resultat.ok
        ? { nom: "succes", reponse: resultat.reponse }
        : { nom: "erreur", message: resultat.message }
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <FormulaireProfil onValider={generer} desactive={etat.nom === "chargement"} />

      {etat.nom === "chargement" && (
        <div className="flex items-center justify-between gap-4 rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700">
          <div className="flex flex-col">
            <p role="status">Composition du menu en cours… Cela prend en général 1 à 6 minutes.</p>
            <TempsEcoule debut={etat.debut} />
          </div>
          <button
            type="button"
            onClick={() => controleur.current?.abort()}
            className="rounded-md border border-zinc-300 px-3 py-1 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Annuler
          </button>
        </div>
      )}

      {etat.nom === "erreur" && (
        <p role="alert" className="rounded-md border border-red-600 px-3 py-2 text-red-700 dark:border-red-400 dark:text-red-400">
          {etat.message}
        </p>
      )}

      {/* Provisoire : la tâche 24 remplace cette ligne par l'affichage du menu. */}
      {etat.nom === "succes" && (
        <p role="status" className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700">
          Menu reçu : {etat.reponse.menu.jours.length} jours, cible de{" "}
          {etat.reponse.cibles.kcal.toLocaleString("fr-FR")} kcal.
        </p>
      )}
    </div>
  );
}
