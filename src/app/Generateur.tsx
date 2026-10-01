"use client";

import { useEffect, useRef, useState } from "react";
import { DELAI_GENERATION_MS, type Entree, type ReponseMenu } from "@/lib/contracts";
import { demanderMenu } from "@/lib/appelMenu";
import { AffichageMenu } from "./AffichageMenu";
import { FormulaireProfil } from "./FormulaireProfil";
import { IconeAlerte, IconeCoche, IllustrationAssiette } from "./icones";

// Une minute de plus que l'échéance du serveur : le client reçoit le 502
// explicite du serveur plutôt que de couper juste avant.
const DELAI_CLIENT_MS = DELAI_GENERATION_MS + 60_000;

type Etat =
  | { nom: "repos" }
  | { nom: "chargement"; debut: number }
  | { nom: "succes"; reponse: ReponseMenu }
  | { nom: "erreur"; message: string };

const CLASSE_CARTE =
  "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60";

const APPARITION = "motion-safe:animate-[apparition_250ms_ease-out]";

function TempsEcoule({ debut }: { debut: number }) {
  const [maintenant, setMaintenant] = useState(debut);
  useEffect(() => {
    const minuterie = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(minuterie);
  }, []);
  const secondes = Math.floor((maintenant - debut) / 1000);
  return (
    <span className="tabular-nums">
      {Math.floor(secondes / 60)}:{String(secondes % 60).padStart(2, "0")}
    </span>
  );
}

function EnAttente() {
  return (
    <div className={`${CLASSE_CARTE} flex flex-col items-center border-dashed py-14 text-center shadow-none`}>
      <IllustrationAssiette className="h-24" />
      <h2 className="mt-5 text-lg font-semibold">Votre menu apparaîtra ici</h2>
      <p className="mt-1 max-w-sm text-sm text-pretty text-zinc-600 dark:text-zinc-400">
        Renseignez votre profil : vos cibles en calories et en macronutriments sont calculées, puis un menu de 7
        jours est composé pour les respecter.
      </p>
    </div>
  );
}

/**
 * Étapes de la génération. Le serveur ne publie pas sa progression : seule
 * la première étape est certaine (les cibles sont calculées avant tout
 * appel au modèle), la deuxième dure jusqu'à la réponse.
 */
function Etape({ statut, children }: { statut: "faite" | "en_cours" | "a_venir"; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      {statut === "faite" && (
        <span className="grid size-6 place-items-center rounded-full bg-emerald-600 text-white">
          <IconeCoche className="size-4" />
        </span>
      )}
      {statut === "en_cours" && (
        <span
          aria-hidden="true"
          className="size-6 animate-spin rounded-full border-[3px] border-emerald-600 border-t-transparent motion-reduce:animate-none"
        />
      )}
      {statut === "a_venir" && (
        <span aria-hidden="true" className="size-6 rounded-full border-2 border-zinc-300 dark:border-zinc-700" />
      )}
      <span className={statut === "a_venir" ? "text-zinc-500" : "font-medium"}>{children}</span>
    </li>
  );
}

function Chargement({ debut, onAnnuler }: { debut: number; onAnnuler: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className={CLASSE_CARTE}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p role="status" className="text-lg font-semibold">
              Composition de votre menu…
            </p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Cela prend en général 1 à 6 minutes. Vous pouvez laisser cette page ouverte.
            </p>
          </div>
          <span className="text-2xl font-semibold text-zinc-700 dark:text-zinc-300">
            <TempsEcoule debut={debut} />
          </span>
        </div>
        <ol className="mt-5 flex flex-col gap-3 text-sm">
          <Etape statut="faite">Cibles journalières calculées</Etape>
          <Etape statut="en_cours">Composition et vérification des repas par l&apos;IA</Etape>
          <Etape statut="a_venir">Affichage du menu</Etape>
        </ol>
        <button
          type="button"
          onClick={onAnnuler}
          className="mt-6 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Annuler
        </button>
      </div>

      {/* Squelette du menu à venir : annonce la forme du résultat. */}
      <div aria-hidden="true" className="flex flex-col gap-3 motion-safe:animate-pulse">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="h-[74px] rounded-xl bg-zinc-200/70 dark:bg-zinc-800/70" />
          ))}
        </div>
        <div className="h-10 rounded-xl bg-zinc-200/70 dark:bg-zinc-800/70" />
        <div className="h-40 rounded-2xl bg-zinc-200/70 dark:bg-zinc-800/70" />
      </div>
    </div>
  );
}

function Erreur({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
    >
      <IconeAlerte className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="font-medium">{message}</p>
        <p className="mt-1 text-sm opacity-80">Vous pouvez modifier votre profil et réessayer.</p>
      </div>
    </div>
  );
}

/**
 * Relie le formulaire à POST /api/menu. Composant client : une page serveur
 * ne peut pas transmettre de fonction (onValider) à un composant client.
 */
export function Generateur() {
  const [etat, setEtat] = useState<Etat>({ nom: "repos" });
  const controleur = useRef<AbortController | null>(null);
  const panneau = useRef<HTMLDivElement>(null);

  // Quitter la page interrompt la génération : la route arrête alors aussi
  // l'appel facturé au modèle.
  useEffect(() => () => controleur.current?.abort(), []);

  // Sur une seule colonne (mobile), le résultat s'affiche sous le formulaire,
  // hors de l'écran : on l'amène à la vue, et le focus le suit à la fin pour
  // que les lecteurs d'écran le lisent.
  useEffect(() => {
    const element = panneau.current;
    if (etat.nom === "repos" || !element) return;
    const { top } = element.getBoundingClientRect();
    if (top < 0 || top > window.innerHeight * 0.5) {
      const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      element.scrollIntoView({ behavior: reduit ? "auto" : "smooth", block: "start" });
    }
    if (etat.nom !== "chargement") element.focus({ preventScroll: true });
  }, [etat.nom]);

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
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
      <div className={`${CLASSE_CARTE} lg:sticky lg:top-6`}>
        <h2 className="mb-5 text-lg font-semibold">Votre profil</h2>
        <FormulaireProfil onValider={generer} desactive={etat.nom === "chargement"} />
      </div>

      <div ref={panneau} tabIndex={-1} className="scroll-mt-6 outline-none">
        <div key={etat.nom} className={APPARITION}>
          {etat.nom === "repos" && <EnAttente />}
          {etat.nom === "chargement" && (
            <Chargement debut={etat.debut} onAnnuler={() => controleur.current?.abort()} />
          )}
          {etat.nom === "erreur" && <Erreur message={etat.message} />}
          {etat.nom === "succes" && <AffichageMenu reponse={etat.reponse} />}
        </div>
      </div>
    </div>
  );
}
