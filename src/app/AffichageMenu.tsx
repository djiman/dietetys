"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import type { Cibles, Jour, ReponseMenu, TypeRepas } from "@/lib/contracts";
import { calculerTotauxRepas } from "@/lib/domain/menu";
import { formaterEcart, formaterNombre, ordonnerRepas } from "@/lib/affichage";
import { IconeInfo } from "./icones";

const LIBELLES_REPAS: Record<TypeRepas, string> = {
  petit_dejeuner: "Petit-déjeuner",
  dejeuner: "Déjeuner",
  collation: "Collation",
  diner: "Dîner",
};

const MACRONUTRIMENTS = [
  { cle: "kcal", libelle: "Énergie", unite: "kcal" },
  { cle: "proteines_g", libelle: "Protéines", unite: "g" },
  { cle: "glucides_g", libelle: "Glucides", unite: "g" },
  { cle: "lipides_g", libelle: "Lipides", unite: "g" },
] as const;

// Une barre couvre de 0 à 150 % de la cible : le repère de cible tombe aux
// deux tiers, et un dépassement reste visible sans déborder.
const ECHELLE_BARRE = 1.5;

const APPARITION = "motion-safe:animate-[apparition_250ms_ease-out]";

function Tuile({ libelle, valeur, unite, principale }: { libelle: string; valeur: number; unite: string; principale: boolean }) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        principale
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/50"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60"
      }`}
    >
      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{libelle}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {formaterNombre(valeur)} <span className="text-sm font-normal text-zinc-500">{unite}</span>
      </p>
    </div>
  );
}

/** Total du jour comparé à sa cible, sur une barre avec un repère de cible. */
function Barre({ libelle, unite, total, cible }: { libelle: string; unite: string; total: number; cible: number }) {
  const largeur = (Math.min(total / cible, ECHELLE_BARRE) / ECHELLE_BARRE) * 100;
  return (
    <div>
      <div className="flex justify-between gap-2 text-xs">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">{libelle}</span>
        <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
          {formaterNombre(total)} / {formaterNombre(cible)} {unite}
        </span>
      </div>
      <div className="relative mt-1.5 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500" style={{ width: `${largeur}%` }} />
        <div
          aria-hidden="true"
          className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-zinc-700 dark:bg-zinc-300"
          style={{ left: `${100 / ECHELLE_BARRE}%` }}
        />
      </div>
    </div>
  );
}

/** Les plats de la semaine dans une grille repas × jours. */
function VueSemaine({ jours, onChoisirJour }: { jours: Jour[]; onChoisirJour: (index: number) => void }) {
  const types = (["petit_dejeuner", "dejeuner", "collation", "diner"] as const).filter((type) =>
    jours.some((jour) => jour.repas.some((repas) => repas.type === type))
  );
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <table className="w-full min-w-[600px] table-fixed border-collapse text-left text-xs">
        <caption className="px-4 pt-4 pb-2 text-left text-sm font-semibold">La semaine en un coup d&apos;œil</caption>
        <thead>
          <tr>
            <th scope="col" className="w-[88px] px-3 py-2" />
            {jours.map((jour, index) => (
              <th key={jour.numero} scope="col" className="px-2 py-2 font-medium">
                <button
                  type="button"
                  onClick={() => onChoisirJour(index)}
                  className="rounded-md px-1.5 py-0.5 text-zinc-700 underline-offset-2 hover:bg-emerald-50 hover:text-emerald-800 hover:underline dark:text-zinc-300 dark:hover:bg-emerald-950"
                >
                  Jour {jour.numero}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {types.map((type) => (
            <tr key={type} className="border-t border-zinc-100 dark:border-zinc-800">
              <th scope="row" className="px-3 py-2 align-top font-medium text-emerald-700 dark:text-emerald-400">
                {LIBELLES_REPAS[type]}
              </th>
              {jours.map((jour) => (
                <td key={jour.numero} className="px-2 py-2 align-top text-zinc-700 dark:text-zinc-300">
                  {jour.repas.find((repas) => repas.type === type)?.nom_plat ?? "–"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DetailJour({ jour, totaux, cibles }: { jour: Jour; totaux: Cibles; cibles: Cibles }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {MACRONUTRIMENTS.map(({ cle, libelle, unite }) => (
          <Barre key={cle} libelle={libelle} unite={unite} total={totaux[cle]} cible={cibles[cle]} />
        ))}
      </div>
      <p className="-mt-2 text-xs text-zinc-500">Le trait vertical marque la cible journalière.</p>

      <ol className="flex flex-col gap-3">
        {ordonnerRepas(jour.repas).map((repas) => (
          <li key={repas.type} className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <p className="text-xs font-medium tracking-wide text-emerald-700 uppercase dark:text-emerald-400">
                  {LIBELLES_REPAS[repas.type]}
                </p>
                <h4 className="mt-0.5 font-medium">{repas.nom_plat}</h4>
              </div>
              <span className="shrink-0 text-sm font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                {formaterNombre(calculerTotauxRepas(repas).kcal)} kcal
              </span>
            </div>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {repas.aliments.map((aliment, indexAliment) => (
                <li key={indexAliment} className="flex justify-between gap-3">
                  <span className="text-zinc-700 dark:text-zinc-300">{aliment.nom}</span>
                  <span className="shrink-0 tabular-nums text-zinc-500">
                    {formaterNombre(aliment.quantite_g)} g · {formaterNombre(aliment.kcal)} kcal
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Menu de 7 jours : les cibles, la semaine en un coup d'œil, puis le détail
 * d'un jour choisi par onglet. Les totaux viennent du serveur ; seuls ceux
 * de chaque repas et les écarts sont mis en forme ici.
 */
export function AffichageMenu({ reponse }: { reponse: ReponseMenu }) {
  const { cibles, menu, totaux_par_jour, avertissement } = reponse;
  const [jourActif, setJourActif] = useState(0);
  const onglets = useRef<(HTMLButtonElement | null)[]>([]);

  function choisirJour(index: number) {
    setJourActif(index);
    onglets.current[index]?.focus();
  }

  // Navigation au clavier du motif « onglets » : flèches, début et fin.
  function naviguer(evenement: KeyboardEvent<HTMLButtonElement>) {
    const dernier = menu.jours.length - 1;
    const cibleTouche: Record<string, number> = {
      ArrowRight: jourActif === dernier ? 0 : jourActif + 1,
      ArrowLeft: jourActif === 0 ? dernier : jourActif - 1,
      Home: 0,
      End: dernier,
    };
    if (!(evenement.key in cibleTouche)) return;
    evenement.preventDefault();
    choisirJour(cibleTouche[evenement.key]);
  }

  return (
    <section className="flex flex-col gap-6" aria-labelledby="titre-menu">
      <div>
        <h2 id="titre-menu" className="text-2xl font-semibold tracking-tight">
          Votre menu de la semaine
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Cibles journalières calculées pour votre profil</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MACRONUTRIMENTS.map(({ cle, libelle, unite }) => (
            <Tuile key={cle} libelle={libelle} valeur={cibles[cle]} unite={unite} principale={cle === "kcal"} />
          ))}
        </div>
      </div>

      <VueSemaine jours={menu.jours} onChoisirJour={choisirJour} />

      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
        <div role="tablist" aria-label="Jours de la semaine" className="flex gap-1.5 overflow-x-auto p-2">
          {menu.jours.map((jour, index) => {
            const actif = index === jourActif;
            return (
              <button
                key={jour.numero}
                ref={(element) => {
                  onglets.current[index] = element;
                }}
                type="button"
                role="tab"
                id={`onglet-jour-${index}`}
                aria-selected={actif}
                aria-controls="panneau-jour"
                tabIndex={actif ? 0 : -1}
                onClick={() => setJourActif(index)}
                onKeyDown={naviguer}
                className={`flex min-w-[72px] flex-1 flex-col items-center rounded-xl px-2 py-2 transition focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none ${
                  actif
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                <span className="text-sm font-semibold">Jour {jour.numero}</span>
                <span className={`text-xs whitespace-nowrap tabular-nums ${actif ? "text-emerald-50" : "text-zinc-500"}`}>
                  {formaterNombre(totaux_par_jour[index].kcal)} kcal
                </span>
                <span className={`text-xs tabular-nums ${actif ? "text-emerald-50" : "text-zinc-500"}`}>
                  {formaterEcart(totaux_par_jour[index].kcal, cibles.kcal)}
                </span>
              </button>
            );
          })}
        </div>

        <div
          key={jourActif}
          role="tabpanel"
          id="panneau-jour"
          aria-labelledby={`onglet-jour-${jourActif}`}
          className={`border-t border-zinc-200 p-5 dark:border-zinc-800 ${APPARITION}`}
        >
          <h3 className="sr-only">Jour {menu.jours[jourActif].numero}</h3>
          <DetailJour jour={menu.jours[jourActif]} totaux={totaux_par_jour[jourActif]} cibles={cibles} />
        </div>
      </div>

      <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        <IconeInfo className="mt-0.5 size-5 shrink-0" />
        <p>{avertissement}</p>
      </div>
    </section>
  );
}
