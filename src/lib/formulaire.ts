import { z } from "zod";
import { entreeSchema, type Entree } from "@/lib/contracts";

export type ErreursFormulaire = Partial<Record<keyof Entree, string>>;

export type ResultatFormulaire =
  | { ok: true; entree: Entree }
  | { ok: false; erreurs: ErreursFormulaire };

/**
 * Un champ de formulaire est toujours du texte : vide, il devient
 * `undefined` pour que Zod réponde « requis » plutôt que « hors bornes » ;
 * la virgule décimale française est acceptée.
 */
function lireNombre(valeur: FormDataEntryValue | null): number | undefined {
  const texte = typeof valeur === "string" ? valeur.trim() : "";
  return texte === "" ? undefined : Number(texte.replace(",", "."));
}

/**
 * Valide la saisie du formulaire avec le schéma d'entrée du serveur, pour
 * afficher les erreurs avant tout envoi. Le serveur revalide : il fait foi.
 */
export function lireEntreeFormulaire(donnees: FormData): ResultatFormulaire {
  const validation = entreeSchema.safeParse({
    sexe: donnees.get("sexe"),
    age: lireNombre(donnees.get("age")),
    taille_cm: lireNombre(donnees.get("taille_cm")),
    poids_kg: lireNombre(donnees.get("poids_kg")),
    activite: donnees.get("activite"),
    objectif: donnees.get("objectif"),
  });
  if (validation.success) return { ok: true, entree: validation.data };

  const erreurs: ErreursFormulaire = {};
  for (const [champ, messages] of Object.entries(z.flattenError(validation.error).fieldErrors)) {
    erreurs[champ as keyof Entree] = messages?.[0];
  }
  return { ok: false, erreurs };
}
