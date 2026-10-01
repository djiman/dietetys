"use client";

import { useState, type FormEvent } from "react";
import {
  NIVEAUX_ACTIVITE,
  OBJECTIFS,
  SEXES,
  type Entree,
  type NiveauActivite,
  type Objectif,
  type Sexe,
} from "@/lib/contracts";
import { lireEntreeFormulaire, type ErreursFormulaire } from "@/lib/formulaire";

const LIBELLES_SEXE: Record<Sexe, string> = {
  femme: "Femme",
  homme: "Homme",
};

const LIBELLES_ACTIVITE: Record<NiveauActivite, string> = {
  sedentaire: "Sédentaire : peu ou pas d'exercice",
  leger: "Légère : exercice 1 à 3 fois par semaine",
  modere: "Modérée : exercice 3 à 5 fois par semaine",
  actif: "Active : exercice 6 à 7 fois par semaine",
  tres_actif: "Très active : exercice intense quotidien ou travail physique",
};

const LIBELLES_OBJECTIF: Record<Objectif, { titre: string; detail: string }> = {
  perte: { titre: "Perdre", detail: "du poids" },
  maintien: { titre: "Maintenir", detail: "mon poids" },
  prise: { titre: "Prendre", detail: "du poids" },
};

const CLASSE_LIBELLE = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

function classeChamp(erreur?: string): string {
  return `w-full rounded-lg border bg-white px-3 py-2.5 shadow-xs outline-none transition focus:ring-2 focus:ring-emerald-500/40 dark:bg-zinc-900 ${
    erreur
      ? "border-red-500 focus:border-red-500 dark:border-red-400"
      : "border-zinc-300 focus:border-emerald-500 dark:border-zinc-700"
  }`;
}

function MessageErreur({ nom, erreur }: { nom: keyof Entree; erreur?: string }) {
  if (!erreur) return null;
  return (
    <p id={`${nom}-erreur`} className="text-sm text-red-600 dark:text-red-400">
      {erreur}
    </p>
  );
}

/**
 * Choix exclusif présenté en boutons à bascule : des boutons radio natifs,
 * donc accessibles au clavier et lus par FormData comme une liste.
 */
function ChoixBascule<T extends string>({
  nom,
  libelle,
  options,
  rendre,
  colonnes,
  erreur,
}: {
  nom: keyof Entree;
  libelle: string;
  options: readonly T[];
  rendre: (option: T) => React.ReactNode;
  colonnes: string;
  erreur?: string;
}) {
  return (
    <fieldset
      className="flex flex-col gap-1.5"
      aria-invalid={erreur ? true : undefined}
      aria-describedby={erreur ? `${nom}-erreur` : undefined}
    >
      <legend className={`${CLASSE_LIBELLE} mb-1.5`}>{libelle}</legend>
      <div className={`grid gap-2 ${colonnes}`}>
        {options.map((option) => (
          <label key={option} className="cursor-pointer">
            <input type="radio" name={nom} value={option} className="peer sr-only" />
            <span
              className={`flex h-full flex-col items-center justify-center rounded-lg border bg-white px-3 py-2.5 text-center text-sm transition hover:border-emerald-400 peer-checked:border-emerald-600 peer-checked:bg-emerald-50 peer-checked:text-emerald-900 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500/40 dark:bg-zinc-900 dark:peer-checked:bg-emerald-950 dark:peer-checked:text-emerald-100 ${
                erreur
                  ? "border-red-500 bg-red-50/70 dark:border-red-400 dark:bg-red-950/40"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            >
              {rendre(option)}
            </span>
          </label>
        ))}
      </div>
      <MessageErreur nom={nom} erreur={erreur} />
    </fieldset>
  );
}

function ChampNombre({
  nom,
  libelle,
  unite,
  decimal = false,
  erreur,
}: {
  nom: keyof Entree;
  libelle: string;
  unite: string;
  decimal?: boolean;
  erreur?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={nom} className={CLASSE_LIBELLE}>
        {libelle}
      </label>
      <div className="relative">
        {/* Champ texte plutôt que number : la virgule décimale reste lisible
            et la conversion est faite par lireEntreeFormulaire. */}
        <input
          id={nom}
          name={nom}
          type="text"
          inputMode={decimal ? "decimal" : "numeric"}
          aria-invalid={erreur ? true : undefined}
          aria-describedby={erreur ? `${nom}-erreur` : undefined}
          className={`${classeChamp(erreur)} pr-10`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-zinc-500">
          {unite}
        </span>
      </div>
      <MessageErreur nom={nom} erreur={erreur} />
    </div>
  );
}

/**
 * Saisie du profil, validée avec le schéma d'entrée du serveur avant tout
 * envoi. La validation native du navigateur est désactivée : ses messages
 * varient d'un navigateur à l'autre et doubleraient ceux du schéma.
 */
export function FormulaireProfil({
  onValider,
  desactive,
}: {
  onValider: (entree: Entree) => void;
  /** Pendant une génération : empêche un second envoi. */
  desactive: boolean;
}) {
  const [erreurs, setErreurs] = useState<ErreursFormulaire>({});

  function soumettre(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    const resultat = lireEntreeFormulaire(new FormData(evenement.currentTarget));
    if (!resultat.ok) {
      setErreurs(resultat.erreurs);
      return;
    }
    setErreurs({});
    onValider(resultat.entree);
  }

  return (
    <form noValidate onSubmit={soumettre}>
      <fieldset disabled={desactive} className="flex flex-col gap-5 disabled:opacity-60">
        <ChoixBascule
          nom="sexe"
          libelle="Sexe"
          options={SEXES}
          rendre={(sexe) => LIBELLES_SEXE[sexe]}
          colonnes="grid-cols-2"
          erreur={erreurs.sexe}
        />

        <div className="grid grid-cols-3 gap-3">
          <ChampNombre nom="age" libelle="Âge" unite="ans" erreur={erreurs.age} />
          <ChampNombre nom="taille_cm" libelle="Taille" unite="cm" erreur={erreurs.taille_cm} />
          <ChampNombre nom="poids_kg" libelle="Poids" unite="kg" decimal erreur={erreurs.poids_kg} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="activite" className={CLASSE_LIBELLE}>
            Niveau d&apos;activité
          </label>
          <select
            id="activite"
            name="activite"
            defaultValue=""
            aria-invalid={erreurs.activite ? true : undefined}
            aria-describedby={erreurs.activite ? "activite-erreur" : undefined}
            className={classeChamp(erreurs.activite)}
          >
            <option value="" disabled>
              Choisir…
            </option>
            {NIVEAUX_ACTIVITE.map((niveau) => (
              <option key={niveau} value={niveau}>
                {LIBELLES_ACTIVITE[niveau]}
              </option>
            ))}
          </select>
          <MessageErreur nom="activite" erreur={erreurs.activite} />
        </div>

        <ChoixBascule
          nom="objectif"
          libelle="Objectif"
          options={OBJECTIFS}
          rendre={(objectif) => (
            <>
              <span className="font-medium">{LIBELLES_OBJECTIF[objectif].titre}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{LIBELLES_OBJECTIF[objectif].detail}</span>
            </>
          )}
          colonnes="grid-cols-3"
          erreur={erreurs.objectif}
        />

        <button
          type="submit"
          className="mt-1 rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white shadow-sm transition hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none"
        >
          {desactive ? "Génération en cours…" : "Générer mon menu"}
        </button>
      </fieldset>
    </form>
  );
}
