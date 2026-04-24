import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  console.log("--- NOUVELLE REQUÊTE REÇUE ---");
  
  try {
    const { messages } = await req.json();
    console.log("Nombre de messages reçus :", messages?.length);

    // TEST DE CLÉ API
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("ERREUR : La clé GOOGLE_GENERATIVE_AI_API_KEY est absente du fichier .env.local");
      return new Response("Erreur : Clé API manquante", { status: 500 });
    }

    const result = await streamText({
      model: google("gemini-1.5-flash"),
      messages,
      system: "Tu es un expert web designer. Enveloppe le code HTML entre [SITE_START] et [SITE_END].",
    });

    console.log("L'IA commence à répondre...");

    return result.toDataStreamResponse();
  } catch (error: any) {
    // ON LOG L'ERREUR PRÉCISE DANS LE TERMINAL (Fenêtre noire de Cursor/VS Code)
    console.error("CRASH DU SERVEUR :");
    console.error("NOM :", error.name);
    console.error("MESSAGE :", error.message);
    
    // On renvoie l'erreur au navigateur pour qu'on puisse la lire à l'écran
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}