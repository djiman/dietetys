import type { Entree } from "../../src/lib/contracts";

/**
 * Jeu fixe de profils pour les évaluations (spécification § "Observabilité,
 * évaluations et limites") : les trois objectifs, chacun avec une petite et
 * une grande cible calorique, de 1 250 à 3 950 kcal. La cible détermine la
 * taille du menu, donc la latence, le coût et la difficulté à la tenir.
 *
 * Les cibles ne sont pas écrites ici : elles sont recalculées par
 * calculerCibles, pour suivre toute évolution du domaine.
 */
export const PROFILS_EVALUATION: { nom: string; entree: Entree }[] = [
  {
    // Cible relevée au métabolisme de base par le plancher ; protéines à
    // 30 % des kcal : le profil le plus contraint.
    nom: "Perte, petite cible",
    entree: {
      sexe: "femme",
      age: 45,
      taille_cm: 155,
      poids_kg: 68,
      activite: "sedentaire",
      objectif: "perte",
    },
  },
  {
    // Cible de protéines la plus haute du jeu (176 g).
    nom: "Perte, grande cible",
    entree: {
      sexe: "homme",
      age: 40,
      taille_cm: 185,
      poids_kg: 110,
      activite: "actif",
      objectif: "perte",
    },
  },
  {
    nom: "Maintien, petite cible",
    entree: {
      sexe: "femme",
      age: 65,
      taille_cm: 158,
      poids_kg: 52,
      activite: "sedentaire",
      objectif: "maintien",
    },
  },
  {
    nom: "Maintien, grande cible",
    entree: {
      sexe: "homme",
      age: 30,
      taille_cm: 183,
      poids_kg: 80,
      activite: "actif",
      objectif: "maintien",
    },
  },
  {
    nom: "Prise, petite cible",
    entree: {
      sexe: "femme",
      age: 24,
      taille_cm: 163,
      poids_kg: 50,
      activite: "leger",
      objectif: "prise",
    },
  },
  {
    nom: "Prise, grande cible",
    entree: {
      sexe: "homme",
      age: 25,
      taille_cm: 190,
      poids_kg: 85,
      activite: "tres_actif",
      objectif: "prise",
    },
  },
];
