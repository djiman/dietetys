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
  nutritionnel), phase 3 (validation de sortie), phase 4 (orchestrateur
  LLM), phase 5 (évaluations), phase 6 (route API) ; 116 tests.
- À faire : phase 7 (frontend), phase 8 (finalisation). L'ordre des
  tâches est dans la base Notion « Tâches Dietetys ».

## Structure

- `src/lib/contracts/` — schémas Zod (entrée, cibles, menu). Source de
  vérité unique du format des données ; réutilisés pour la validation
  d'entrée, la définition d'outil du LLM et la validation de sortie.
- `src/lib/domain/` — calcul nutritionnel : fonctions pures, sans appel
  réseau ni dépendance au LLM, entièrement testées.
- `src/lib/validation/` — les quatre contrôles du menu produit par le LLM
  (schéma, Atwater, cibles, diversité) et leurs seuils, réutilisés par le
  prompt. Renvoie des erreurs lisibles, injectées telles quelles dans la
  relance.
- `src/lib/llm/` — prompt et orchestrateur : `genererMenu(cibles)` appelle
  Claude (sortie structurée), valide, relance une fois avec les erreurs et
  journalise chaque appel en JSON (identifiant de requête, coût). Toute la
  génération est bornée à 10 minutes. Aucun calcul nutritionnel ici.
- `src/app/api/menu/route.ts` — `POST /api/menu` : validation de l'entrée,
  règle de sécurité, limitation de débit, génération ; réponses 200, 400,
  422, 429, 502.
- `src/lib/api/` — limitation de débit en mémoire (une génération à la
  fois, 10 par heure).
- `scripts/check-api.ts` — vérifie que la clé API Anthropic fonctionne.
- `scripts/menu.ts` — génère et affiche le menu d'un profil passé en
  arguments (appel facturé, 1 à 6 minutes).
- `scripts/evaluation/` — évaluations : jeu fixe de 6 profils, mesures
  (validité, écart calorique, coût, latence) et script de campagne, dont
  les résultats sont écrits dans `resultats/`, avec la version du prompt.
  Les réponses brutes du modèle (`resultats/sorties/`) sont rejouées par
  les tests de la validation.
- `.github/workflows/verification.yml` — types, lint et tests à chaque push
  sur `main` et à chaque pull request.

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
| `npm run menu -- femme 30 165 60 modere perte` | Génère et affiche le menu d'un profil (appel facturé) |
| `npm run evaluer -- 1-prompt-actuel` | Campagne d'évaluation sur les 6 profils (environ 2 $ et 20 minutes) |

## Avant de considérer une tâche terminée

`npx tsc --noEmit`, `npm run lint` et `npm test` doivent tous passer sans
erreur.
