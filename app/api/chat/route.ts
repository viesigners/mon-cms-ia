export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return new Response("Clé API manquante dans .env.local", { status: 500 });
    }

    const geminiMessages = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    // LA VARIABLE MAGIQUE EST ICI : gemini-flash-latest
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: geminiMessages,
          systemInstruction: {
            role: "user",
            parts: [{ 
              text: "Tu es un expert web designer. Si l'utilisateur pose une question, réponds brièvement. S'il te demande de créer un site ou une page, génère uniquement le code HTML complet (avec Tailwind CSS via CDN) enveloppé strictement entre les balises [SITE_START] et [SITE_END]." 
            }]
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(`Refus de Google: ${data.error?.message || "Erreur API"}`, { status: 500 });
    }

    const texteIA = data.candidates[0].content.parts[0].text;

    return new Response(texteIA, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

  } catch (error: any) {
    return new Response(`Erreur fatale: ${error.message}`, { status: 500 });
  }
}