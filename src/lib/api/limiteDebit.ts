export type Reservation = "ok" | "en_cours" | "quota";

/**
 * Limitation de débit en mémoire, globale : l'application est
 * mono-utilisateur et sans compte (spécification § "Hypothèses"). Elle
 * protège l'appel facturé contre un double clic ou une boucle côté client :
 * une génération à la fois, et au plus `maxParFenetre` sur `fenetreMs`.
 *
 * L'heure est passée en paramètre pour tester sans simuler l'horloge.
 */
export function creerLimiteDebit(maxParFenetre: number, fenetreMs: number) {
  let enCours = false;
  let debuts: number[] = [];

  return {
    reserver(maintenant: number): Reservation {
      if (enCours) return "en_cours";
      debuts = debuts.filter((debut) => maintenant - debut < fenetreMs);
      if (debuts.length >= maxParFenetre) return "quota";
      enCours = true;
      debuts.push(maintenant);
      return "ok";
    },
    liberer(): void {
      enCours = false;
    },
  };
}
