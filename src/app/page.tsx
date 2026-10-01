import { Generateur } from "./Generateur";
import { Logo } from "./icones";

export default function Accueil() {
  return (
    <>
      <header className="border-b border-zinc-200/80 bg-white/70 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-4">
          <Logo />
          <span className="text-lg font-semibold tracking-tight">Dietetys</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:py-14">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Menu personnalisé sur 7 jours</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Votre semaine de repas, calée sur votre objectif
          </h1>
          <p className="mt-4 text-lg text-pretty text-zinc-600 dark:text-zinc-400">
            Vos besoins sont calculés avec des formules nutritionnelles reconnues, puis l&apos;IA compose des repas
            qui les respectent, avec des aliments du quotidien.
          </p>
        </div>

        <div className="mt-10">
          <Generateur />
        </div>
      </main>

      <footer className="border-t border-zinc-200/80 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
        Dietetys, projet d&apos;apprentissage. Les menus sont indicatifs et ne remplacent pas un avis médical.
      </footer>
    </>
  );
}
