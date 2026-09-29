import type { Cibles, Menu } from "@/lib/contracts";
import {
  verifierAtwater,
  verifierCibles,
  verifierDiversite,
  verifierSchema,
} from "./controles";

export type NomControle = "schema" | "atwater" | "cibles" | "diversite";

export type ResultatValidation =
  | { valide: true; menu: Menu }
  | { valide: false; erreurs: string[]; controlesEchoues: NomControle[] };

/**
 * Valide la sortie brute du LLM (spécification § "Validation de sortie").
 *
 * Si le schéma échoue, on s'arrête : les autres contrôles n'ont pas de sens
 * sur une structure invalide. Sinon les trois autres s'exécutent tous et
 * leurs erreurs sont cumulées, pour que l'unique relance reçoive toutes les
 * corrections d'un coup.
 */
export function validerMenu(
  sortieBrute: unknown,
  cibles: Cibles
): ResultatValidation {
  const schema = verifierSchema(sortieBrute);
  if (schema.menu === null) {
    return { valide: false, erreurs: schema.erreurs, controlesEchoues: ["schema"] };
  }

  const menu = schema.menu;
  const erreursParControle: [NomControle, string[]][] = [
    ["atwater", verifierAtwater(menu)],
    ["cibles", verifierCibles(menu, cibles)],
    ["diversite", verifierDiversite(menu)],
  ];
  const echecs = erreursParControle.filter(([, erreurs]) => erreurs.length > 0);
  if (echecs.length === 0) return { valide: true, menu };

  return {
    valide: false,
    erreurs: echecs.flatMap(([, erreurs]) => erreurs),
    controlesEchoues: echecs.map(([nom]) => nom),
  };
}
