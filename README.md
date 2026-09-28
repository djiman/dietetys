# Dietetys

Projet d'apprentissage : génère un menu hebdomadaire (7 jours) à partir du
sexe, de l'âge, de la taille, du poids, du niveau d'activité et d'un
objectif. Le calcul nutritionnel est déterministe (code), le LLM compose
uniquement les repas à partir des cibles calculées.

Voir la [spécification complète](https://claude.ai/code/artifact/cdbee86f-d3d5-4a03-bf42-98e39c0cbfb4)
pour l'architecture, les contrats et les règles de validation.

État actuel : phases 0 à 2 (préparation, contrats, domaine nutritionnel).
Pas encore d'orchestrateur LLM, de route API ni de frontend fonctionnel.

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

## Structure

```
src/lib/contracts/   Schémas Zod (entrée, cibles, menu) — phase 1
src/lib/domain/      Calculs nutritionnels purs et testés — phase 2
scripts/check-api.ts Vérification manuelle de la clé API — phase 0
```

Le domaine (`src/lib/domain`) est constitué de fonctions pures, sans appel
réseau : métabolisme de base, dépense totale, ajustement selon l'objectif,
plancher de sécurité, macronutriments, et la règle de refus IMC < 18,5 en
perte de poids. 44 tests couvrent les cas nominaux, les bornes, le
déclenchement du plancher et celui du plafond de protéines.
