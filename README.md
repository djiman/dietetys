# Dietetys

Projet d'apprentissage : génère un menu hebdomadaire (7 jours) à partir du
sexe, de l'âge, de la taille, du poids, du niveau d'activité et d'un
objectif. Le calcul nutritionnel est déterministe (code), le LLM compose
uniquement les repas à partir des cibles calculées.

Voir la [spécification complète](https://claude.ai/code/artifact/cdbee86f-d3d5-4a03-bf42-98e39c0cbfb4)
pour l'architecture, les contrats et les règles de validation.

État actuel : phases 0 à 5 (préparation, contrats, domaine nutritionnel,
validation de sortie, orchestrateur LLM, évaluations). La route API et le
frontend restent à faire : la génération s'utilise pour l'instant en ligne
de commande.

## Installation

```bash
npm install
cp .env.example .env.local
# Puis renseigner ANTHROPIC_API_KEY dans .env.local
```

## Commandes

| Commande | Effet |
| --- | --- |
| `npm run dev` | Serveur de développement (http://localhost:3000) |
| `npm run build` | Build de production |
| `npm test` | Tests unitaires (Vitest) |
| `npm run test:watch` | Tests en mode watch |
| `npm run lint` | Lint (ESLint) |
| `npm run check:api` | Vérifie que la clé API Anthropic fonctionne |
| `npm run menu -- femme 30 165 60 modere perte` | Génère et affiche le menu d'un profil (appel facturé, 1 à 6 minutes) |
| `npm run evaluer -- <nom-campagne>` | Campagne d'évaluation sur 6 profils (environ 2 $ et 20 minutes) |

## Structure

```
src/lib/contracts/   Schémas Zod (entrée, cibles, menu)
src/lib/domain/      Calculs nutritionnels purs et testés
src/lib/validation/  Les quatre contrôles du menu produit par le LLM
src/lib/llm/         Prompt et orchestrateur (appel, validation, relance, logs)
scripts/             Vérification de la clé API et génération d'un menu
scripts/evaluation/  Profils, mesures, script de campagne et résultats
```

Le domaine est constitué de fonctions pures, sans appel réseau :
métabolisme de base, dépense totale, ajustement selon l'objectif, plancher
de sécurité, macronutriments, et la règle de refus IMC < 18,5 en perte de
poids. Le menu renvoyé par le LLM n'est accepté qu'après quatre contrôles
(schéma, cohérence d'Atwater, respect des cibles, diversité), avec une
seule relance en cas d'échec.

Les deux campagnes d'évaluation donnent une validité finale de 100 %, pour
environ 0,25 $ et 3 minutes par génération ; les menus restent en moyenne
environ 5 % sous la cible calorique (détail dans
`scripts/evaluation/resultats/` et dans la spécification).
