"use client";

import { useState } from "react";
import type { Entree } from "@/lib/contracts";
import { FormulaireProfil } from "./FormulaireProfil";

/**
 * Relie le formulaire à la suite du parcours. Composant client : une page
 * serveur ne peut pas transmettre de fonction (onValider) à un composant
 * client.
 */
export function Generateur() {
  const [entree, setEntree] = useState<Entree | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <FormulaireProfil onValider={setEntree} />
      {/* Provisoire : la tâche 23 remplace cette ligne par l'appel à POST /api/menu. */}
      {entree && (
        <p role="status" className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700">
          Profil valide : {entree.sexe}, {entree.age} ans, {entree.taille_cm} cm, {entree.poids_kg} kg,
          activité {entree.activite}, objectif {entree.objectif}.
        </p>
      )}
    </div>
  );
}
