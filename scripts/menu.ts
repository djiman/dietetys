/**
 * Génère et affiche le menu complet pour un profil passé en arguments.
 *
 * Usage : npm run menu -- <sexe> <age> <taille_cm> <poids_kg> <activite> <objectif>
 * Exemple : npm run menu -- femme 30 165 60 modere perte
 * Appel facturé (jusqu'à deux avec la relance), 2 à 5 minutes.
 */
import { config } from "dotenv";
import { entreeSchema } from "../src/lib/contracts";
import {
  MESSAGE_REFUS_SECURITE,
  calculerCibles,
  calculerTotauxJour,
  doitRefuserPourSecurite,
} from "../src/lib/domain";
import { genererMenu } from "../src/lib/llm";

// Un script autonome doit charger .env.local lui-même, contrairement à Next.js.
config({ path: ".env.local" });

const USAGE =
  "Usage : npm run menu -- <sexe> <age> <taille_cm> <poids_kg> <activite> <objectif>\n" +
  "Exemple : npm run menu -- femme 30 165 60 modere perte";

async function main() {
  const [sexe, age, taille_cm, poids_kg, activite, objectif] = process.argv.slice(2);
  const validation = entreeSchema.safeParse({
    sexe,
    age: Number(age),
    taille_cm: Number(taille_cm),
    poids_kg: Number(poids_kg),
    activite,
    objectif,
  });
  if (!validation.success) {
    console.error(validation.error.issues.map((i) => `${i.path.join(".")} : ${i.message}`).join("\n"));
    console.error(`\n${USAGE}`);
    process.exit(1);
  }

  const entree = validation.data;
  if (doitRefuserPourSecurite(entree)) {
    console.error(MESSAGE_REFUS_SECURITE);
    process.exit(1);
  }

  const cibles = calculerCibles(entree);
  console.log(
    `Cibles : ${cibles.kcal} kcal, ${cibles.proteines_g} g protéines, ` +
      `${cibles.glucides_g} g glucides, ${cibles.lipides_g} g lipides\n`
  );

  const resultat = await genererMenu(cibles);
  if (!resultat.ok) {
    console.error(`Échec de la génération : ${resultat.raison}`);
    process.exit(1);
  }

  for (const jour of resultat.menu.jours) {
    const totaux = calculerTotauxJour(jour);
    console.log(
      `\n=== Jour ${jour.numero} : ${Math.round(totaux.kcal)} kcal, ` +
        `${Math.round(totaux.proteines_g)} g P, ${Math.round(totaux.glucides_g)} g G, ` +
        `${Math.round(totaux.lipides_g)} g L`
    );
    for (const repas of jour.repas) {
      console.log(`  ${repas.type} : ${repas.nom_plat}`);
      for (const aliment of repas.aliments) {
        console.log(`    - ${aliment.nom}, ${aliment.quantite_g} g (${Math.round(aliment.kcal)} kcal)`);
      }
    }
  }
}

main();
