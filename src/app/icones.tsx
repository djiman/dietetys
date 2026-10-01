/**
 * Icônes en SVG inline, au trait : elles prennent la couleur du texte
 * (currentColor) et sont masquées aux lecteurs d'écran, le texte voisin
 * portant le sens.
 */

type ProprietesIcone = { className?: string };

function Icone({ className = "size-5", children }: ProprietesIcone & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

function IconeFeuille(props: ProprietesIcone) {
  return (
    <Icone {...props}>
      <path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14Z" />
      <path d="M5 19c3-4 6-7 9-9" />
    </Icone>
  );
}

export function IconeInfo(props: ProprietesIcone) {
  return (
    <Icone {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </Icone>
  );
}

export function IconeAlerte(props: ProprietesIcone) {
  return (
    <Icone {...props}>
      <path d="M12 4 3 20h18L12 4Z" />
      <path d="M12 10v4M12 17h.01" />
    </Icone>
  );
}

export function IconeCoche(props: ProprietesIcone) {
  return (
    <Icone {...props}>
      <path d="m5 12 4.5 4.5L19 7" />
    </Icone>
  );
}

/** Logo : une feuille dans un carré arrondi en dégradé. */
export function Logo({ className = "size-9" }: ProprietesIcone) {
  return (
    <span
      className={`grid place-items-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-sm shadow-emerald-600/30 ${className}`}
    >
      <IconeFeuille className="size-5" />
    </span>
  );
}

/** Illustration de l'état d'attente : une assiette entre fourchette et couteau. */
export function IllustrationAssiette({ className = "h-24" }: ProprietesIcone) {
  return (
    <svg viewBox="0 0 160 96" aria-hidden="true" className={className}>
      <circle cx="80" cy="48" r="40" className="fill-emerald-50 dark:fill-emerald-950" />
      <circle cx="80" cy="48" r="28" className="fill-white stroke-emerald-200 dark:fill-zinc-900 dark:stroke-emerald-900" strokeWidth="2" />
      <path d="M70 52c4-10 12-14 22-12-2 10-10 15-22 12Z" className="fill-emerald-500" />
      <path d="M70 52c5-3 10-6 15-8" className="stroke-white" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <g className="stroke-emerald-300 dark:stroke-emerald-800" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M22 20v56M16 20v14a6 6 0 0 0 12 0V20" />
        <path d="M138 20c-6 6-6 22 0 26v30" />
      </g>
    </svg>
  );
}
