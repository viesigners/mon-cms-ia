"use client";

import { useState, useEffect, useMemo } from "react";

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [monMessage, setMonMessage] = useState("");
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // --- ÉTAT DU TOAST ---
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => { setIsMounted(true); }, []);

  // --- FONCTION D'ERREUR (Sans le minuteur) ---
  const showError = (message: string) => {
    setToastMessage(message);
  };

  const generatedCode = useMemo(() => {
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === "assistant" && m.content.includes("[SITE_START]"));
    if (!lastAssistantMessage) return null;
    const match = lastAssistantMessage.content.match(/\[SITE_START\]([\s\S]*?)\[SITE_END\]/);
    return match ? match[1] : null;
  }, [messages]);

  const envoyerFormulaire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monMessage.trim() || isLoading) return;

    const nouveauMessageUser = { role: "user", content: monMessage };
    const historiqueAvecUser = [...messages, nouveauMessageUser];
    
    setMessages(historiqueAvecUser);
    setMonMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: historiqueAvecUser }),
      });

      if (!response.ok) {
        const errorText = await response.text(); 
        throw new Error(errorText);
      }

      const texteComplet = await response.text();
      setMessages(prev => [...prev, { role: "assistant", content: texteComplet }]);

    } catch (err: any) {
      console.error("Erreur silencieuse (Console):", err);
      showError(`Oups, impossible de joindre l'IA : ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="flex h-screen bg-zinc-100 font-sans overflow-hidden relative">
      <aside className="w-[400px] flex flex-col bg-white border-r border-zinc-200 shadow-xl z-10">
        <header className="p-6 border-b bg-zinc-50">
          <h1 className="text-xl font-black text-blue-600 uppercase tracking-tighter">AI Builder Pro</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`p-4 rounded-xl text-sm ${m.role === 'user' ? 'bg-blue-600 text-white ml-auto max-w-[90%]' : 'bg-zinc-100 text-black max-w-[90%]'}`}>
              {m.content.replace(/\[SITE_START\][\s\S]*?\[SITE_END\]/g, "📦 Code généré affiché à droite.").trim()}
            </div>
          ))}
          {isLoading && <div className="text-blue-600 text-xs animate-pulse font-bold">L'IA réfléchit...</div>}
        </div>

        <form onSubmit={envoyerFormulaire} className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <input
              autoFocus
              className="flex-1 p-3 border-2 border-zinc-200 rounded-lg text-black outline-none focus:border-blue-500"
              placeholder="Ex: Crée une landing page..."
              value={monMessage}
              onChange={(e) => setMonMessage(e.target.value)}
            />
            <button type="submit" disabled={isLoading} className="px-6 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50 hover:bg-blue-700 transition-colors">Go</button>
          </div>
        </form>
      </aside>

      <main className="flex-1 p-4 bg-zinc-200 relative">
        <div className="w-full h-full bg-white rounded-xl shadow-2xl overflow-hidden border border-zinc-300">
          {generatedCode ? (
            <iframe
              title="Aperçu"
              className="w-full h-full"
              srcDoc={`
                <html>
                  <head>
                    <script src="https://cdn.tailwindcss.com"></script>
                  </head>
                  <body>${generatedCode}</body>
                </html>
              `}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-4">
              <p className="italic text-lg text-center px-10">Votre site apparaîtra ici...</p>
            </div>
          )}
        </div>
      </main>

      {/* --- LE COMPOSANT TOAST (Avec bouton fermer) --- */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-5 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-xl w-full mx-4 sm:mx-0">
          <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          
          <span className="font-semibold text-sm flex-1">{toastMessage}</span>
          
          {/* Bouton de fermeture */}
          <button 
            onClick={() => setToastMessage("")}
            className="p-1 hover:bg-red-700 rounded-lg transition-colors focus:outline-none flex-shrink-0"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}