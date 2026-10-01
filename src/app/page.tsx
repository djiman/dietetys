import { Generateur } from "./Generateur";

export default function Accueil() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Dietetys</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Renseignez votre profil pour obtenir un menu de 7 jours adapté à votre objectif.
      </p>
      <div className="mt-8">
        <Generateur />
      </div>
    </main>
  );
}
