@AGENTS.md

## Contexte

Dietetys est un projet d'apprentissage : générateur de menu hebdomadaire
(7 jours) à partir du sexe, de l'âge, de la taille, du poids, du niveau
d'activité et d'un objectif (perte, maintien, prise). Le but est de monter
en compétence sur la mise en place d'une application IA de bout en bout,
pas de livrer un produit complet.

Spécification complète (architecture, contrats, règles de validation) :
https://claude.ai/code/artifact/cdbee86f-d3d5-4a03-bf42-98e39c0cbfb4

## Principe directeur

Tout calcul nutritionnel se fait en code, jamais par le LLM. Le LLM reçoit
uniquement les cibles déjà calculées (kcal, protéines, glucides, lipides) et
compose des repas qui les respectent. Ne jamais lui demander de calculer un
métabolisme de base, une dépense énergétique ou une répartition de
macronutriments : ce sont des fonctions pures dans `src/lib/domain`.

## État actuel

- Fait : phase 0 (préparation), phase 1 (contrats Zod), phase 2 (domaine
  nutritionnel, 44 tests).
- À faire : validation de sortie, orchestrateur LLM, évaluations, route
  API, frontend. Voir la spécification pour l'ordre des tâches restantes.

## Structure

- `src/lib/contracts/` — schémas Zod (entrée, cibles, menu). Source de
  vérité unique du format des données ; réutilisés pour la validation
  d'entrée, la définition d'outil du LLM et la validation de sortie.
- `src/lib/domain/` — calcul nutritionnel : fonctions pures, sans appel
  réseau ni dépendance au LLM, entièrement testées.
- `scripts/check-api.ts` — vérifie que la clé API Anthropic fonctionne.

## Conventions de code

- Simplicité avant tout : la solution la plus directe, pas la plus
  générique. Pas de code écrit "au cas où", pas d'abstraction ou de
  configuration tant qu'un second cas d'usage réel ne la justifie pas.
- Fonctions pures dans `src/lib/domain` : aucun effet de bord, testables
  sans mock.
- Noms de variables, fonctions et paramètres explicites, en français,
  cohérents avec la spécification (`calculerCibles`, `doitRefuserPourSecurite`,
  `poids_kg`). Pas d'abréviation obscure.
- Aucun emoji, dans le code comme dans les commentaires ou les messages de
  commit.
- Un commentaire explique un "pourquoi" (une règle métier, un choix
  volontaire), jamais un "quoi" quand le code est déjà lisible.
- Préférer moins de code à plus de code.

## Commandes

| Commande | Effet |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm test` | Tests (vitest run) |
| `npm run test:watch` | Tests en mode watch |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Vérification des types |
| `npm run check:api` | Vérifie la clé API Anthropic |

## Avant de considérer une tâche terminée

`npx tsc --noEmit`, `npm run lint` et `npm test` doivent tous passer sans
erreur.
