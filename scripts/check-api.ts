/**
 * Tâche 3 (Phase 0 — Préparation) : vérifie que la clé API Anthropic
 * est configurée et fonctionnelle, avant de construire le reste de la chaîne.
 *
 * Usage : npm run check:api
 */
import { config } from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

// Next.js charge .env.local automatiquement ; un script autonome doit le
// faire explicitement (dotenv ne lit que .env par défaut).
config({ path: ".env.local" });

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error(
      "ANTHROPIC_API_KEY est absent. Copiez .env.example vers .env.local et renseignez la clé."
    );
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 32,
    messages: [{ role: "user", content: "Réponds uniquement par: Hi Djiman! " }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  console.log("Appel API réussi. Réponse du modèle :", text.trim());
}

main().catch((error) => {
  console.error("Échec de l'appel API :", error instanceof Error ? error.message : error);
  process.exit(1);
});
