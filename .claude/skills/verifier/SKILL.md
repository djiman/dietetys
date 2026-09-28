---
name: verifier
description: Lance les trois vérifications obligatoires du projet (types, lint, tests) et résume les erreurs. À utiliser avant de considérer une tâche terminée ou avant un commit.
---

# Vérifier le projet

Le `CLAUDE.md` impose que ces trois commandes passent sans erreur avant qu'une
tâche soit considérée comme terminée.

Lancer les trois, même si l'une échoue, pour avoir l'état complet en une fois :

```bash
npx tsc --noEmit
npm run lint
npm test
```

Puis rendre un résumé court :

- une ligne par commande : réussie ou en échec ;
- pour chaque échec, les erreurs utiles avec leur emplacement (`fichier:ligne`)
  et leur message, sans recopier toute la sortie ;
- pour les tests, le nombre de tests passés sur le total.

Ne pas corriger les erreurs sans que l'utilisateur le demande : ce skill
constate, il ne modifie rien.
