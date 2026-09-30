import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validerMenu } from "../../src/lib/validation";

const DOSSIER_SORTIES = new URL("./resultats/sorties/", import.meta.url);

const fichiers = readdirSync(DOSSIER_SORTIES, { recursive: true, encoding: "utf8" })
  .filter((fichier) => fichier.endsWith(".json"))
  .sort();

// Vraies réponses du modèle, enregistrées par les campagnes d'évaluation :
// la validation est rejouée sur des données réelles, sans appel facturé.
describe("sorties réelles du modèle", () => {
  it("au moins une sortie est enregistrée", () => {
    expect(fichiers.length).toBeGreaterThan(0);
  });

  it.each(fichiers)("%s garde le verdict de sa campagne", (fichier) => {
    const { cibles, controles_echoues, sortie } = JSON.parse(
      readFileSync(new URL(fichier, DOSSIER_SORTIES), "utf8")
    );
    const validation = validerMenu(sortie, cibles);
    expect(validation.valide ? [] : validation.controlesEchoues).toEqual(controles_echoues);
  });
});
