import type { ReponseMenu, TypeRepas } from "@/lib/contracts";
import { formaterEcart, formaterNombre, ordonnerRepas } from "@/lib/affichage";

const LIBELLES_REPAS: Record<TypeRepas, string> = {
  petit_dejeuner: "Petit-déjeuner",
  dejeuner: "Déjeuner",
  collation: "Collation",
  diner: "Dîner",
};

/**
 * Menu de 7 jours, un bloc repliable par jour (<details> natif : ni état ni
 * JavaScript). Les totaux viennent du serveur ; seul leur écart à la cible
 * est mis en forme ici.
 */
export function AffichageMenu({ reponse }: { reponse: ReponseMenu }) {
  const { cibles, menu, totaux_par_jour, avertissement } = reponse;

  return (
    <section className="flex flex-col gap-4" aria-labelledby="titre-menu">
      <div>
        <h2 id="titre-menu" className="text-2xl font-semibold">
          Votre menu de la semaine
        </h2>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Cibles journalières : {formaterNombre(cibles.kcal)} kcal · {formaterNombre(cibles.proteines_g)} g
          de protéines · {formaterNombre(cibles.glucides_g)} g de glucides · {formaterNombre(cibles.lipides_g)} g
          de lipides
        </p>
      </div>

      {menu.jours.map((jour, index) => {
        const totaux = totaux_par_jour[index];
        return (
          <details
            key={jour.numero}
            open={index === 0}
            className="rounded-md border border-zinc-300 px-4 py-3 dark:border-zinc-700"
          >
            <summary className="cursor-pointer">
              <h3 className="inline text-lg font-semibold">Jour {jour.numero}</h3>
              <span className="text-zinc-600 dark:text-zinc-400">
                {" "}
                · {formaterNombre(totaux.kcal)} kcal, {formaterEcart(totaux.kcal, cibles.kcal)}
              </span>
            </summary>

            <div className="mt-3 flex flex-col gap-3">
              {ordonnerRepas(jour.repas).map((repas) => (
                <div key={repas.type}>
                  <h4 className="font-medium">
                    {LIBELLES_REPAS[repas.type]} : {repas.nom_plat}
                  </h4>
                  <ul className="ml-5 list-disc text-zinc-700 dark:text-zinc-300">
                    {repas.aliments.map((aliment, indexAliment) => (
                      <li key={indexAliment}>
                        {aliment.nom}, {formaterNombre(aliment.quantite_g)} g{" "}
                        <span className="text-zinc-500">({formaterNombre(aliment.kcal)} kcal)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Total du jour : {formaterNombre(totaux.proteines_g)} g de protéines,{" "}
                {formaterNombre(totaux.glucides_g)} g de glucides, {formaterNombre(totaux.lipides_g)} g de
                lipides.
              </p>
            </div>
          </details>
        );
      })}

      <p className="rounded-md border border-amber-500 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
        {avertissement}
      </p>
    </section>
  );
}
