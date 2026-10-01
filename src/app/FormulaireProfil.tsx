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

const LIBELLES_OBJECTIF: Record<Objectif, string> = {
  perte: "Perdre du poids",
  maintien: "Maintenir mon poids",
  prise: "Prendre du poids",
};

function classeChamp(erreur?: string): string {
  return `w-full rounded-md border bg-transparent px-3 py-2 ${
    erreur ? "border-red-600 dark:border-red-400" : "border-zinc-300 dark:border-zinc-700"
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

function ChampListe<T extends string>({
  nom,
  libelle,
  options,
  libelles,
  erreur,
}: {
  nom: keyof Entree;
  libelle: string;
  options: readonly T[];
  libelles: Record<T, string>;
  erreur?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={nom} className="font-medium">
        {libelle}
      </label>
      <select
        id={nom}
        name={nom}
        defaultValue=""
        aria-invalid={erreur ? true : undefined}
        aria-describedby={erreur ? `${nom}-erreur` : undefined}
        className={classeChamp(erreur)}
      >
        <option value="" disabled>
          Choisir…
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {libelles[option]}
          </option>
        ))}
      </select>
      <MessageErreur nom={nom} erreur={erreur} />
    </div>
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
    <div className="flex flex-col gap-1">
      <label htmlFor={nom} className="font-medium">
        {libelle}
      </label>
      <div className="flex items-center gap-2">
        {/* Champ texte plutôt que number : la virgule décimale reste lisible
            et la conversion est faite par lireEntreeFormulaire. */}
        <input
          id={nom}
          name={nom}
          type="text"
          inputMode={decimal ? "decimal" : "numeric"}
          aria-invalid={erreur ? true : undefined}
          aria-describedby={erreur ? `${nom}-erreur` : undefined}
          className={classeChamp(erreur)}
        />
        <span className="text-zinc-600 dark:text-zinc-400">{unite}</span>
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
      <fieldset disabled={desactive} className="flex flex-col gap-4 disabled:opacity-60">
        <ChampListe nom="sexe" libelle="Sexe" options={SEXES} libelles={LIBELLES_SEXE} erreur={erreurs.sexe} />
        <ChampNombre nom="age" libelle="Âge" unite="ans" erreur={erreurs.age} />
        <ChampNombre nom="taille_cm" libelle="Taille" unite="cm" erreur={erreurs.taille_cm} />
        <ChampNombre nom="poids_kg" libelle="Poids" unite="kg" decimal erreur={erreurs.poids_kg} />
        <ChampListe
          nom="activite"
          libelle="Niveau d'activité"
          options={NIVEAUX_ACTIVITE}
          libelles={LIBELLES_ACTIVITE}
          erreur={erreurs.activite}
        />
        <ChampListe
          nom="objectif"
          libelle="Objectif"
          options={OBJECTIFS}
          libelles={LIBELLES_OBJECTIF}
          erreur={erreurs.objectif}
        />
        <button
          type="submit"
          className="mt-2 rounded-md bg-foreground px-4 py-2 font-medium text-background hover:opacity-90"
        >
          {desactive ? "Génération en cours…" : "Générer mon menu"}
        </button>
      </fieldset>
    </form>
  );
}
