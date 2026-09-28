import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dietetys",
  description:
    "Générateur de menu hebdomadaire à partir de la taille, du poids, du sexe, de l'âge, du niveau d'activité et d'un objectif.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
