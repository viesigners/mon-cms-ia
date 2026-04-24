"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [monMessage, setMonMessage] = useState("");
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const envoyerFormulaire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monMessage.trim() || isLoading) return;

    const nouveauMessageUser = { role: "user", content: monMessage };
    const historiqueAvecUser = [...messages, nouveauMessageUser];
    
    // 1. On affiche le message de l'utilisateur tout de suite
    setMessages(historiqueAvecUser);
    setMonMessage("");
    setIsLoading(true);

    try {
      // 2. On appelle notre API directement avec fetch
      const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: historiqueAvecUser }),
      });

      if (!response.ok) throw new Error("Erreur serveur");

      // 3. On lit le flux (streaming)
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      // On ajoute un message vide pour l'assistant qu'on va remplir
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        // Le format Vercel AI envoie des préfixes comme 0:"...", on les nettoie simplement
        const cleanChunk = chunk.replace(/^\d+:"/g, "").replace(/"$/g, "").replace(/\\n/g, "\n");
        
        assistantContent += cleanChunk;
        
        // Mise à jour en temps réel de la bulle de l'IA
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].content = assistantContent;
          return newMsgs;
        });
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="flex h-screen bg-zinc-100 font-sans overflow-hidden">
      <aside className="w-[400px] flex flex-col bg-white border-r border-zinc-200 shadow-xl">
        <header className="p-6 border-b bg-zinc-50">
          <h1 className="text-xl font-black text-blue-600 uppercase tracking-tighter">AI Builder Pro</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && <p className="text-zinc-400 text-sm italic text-center">Prêt pour la création.</p>}
          
          {messages.map((m, i) => (
            <div key={i} className={`p-4 rounded-xl text-sm ${
              m.role === 'user' ? 'bg-blue-600 text-white ml-auto max-w-[90%]' : 'bg-zinc-100 text-black max-w-[90%]'
            }`}>
              {m.content.replace(/\[SITE_START\][\s\S]*?\[SITE_END\]/g, "").trim()}
            </div>
          ))}
          {isLoading && <div className="text-blue-600 text-xs animate-pulse font-bold">L'IA génère le code...</div>}
        </div>

        <form onSubmit={envoyerFormulaire} className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <input
              autoFocus
              className="flex-1 p-3 border-2 border-zinc-200 rounded-lg text-black outline-none focus:border-blue-500 transition-all"
              placeholder="Décrivez votre site..."
              value={monMessage}
              onChange={(e) => setMonMessage(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={isLoading || !monMessage.trim()} 
              className="px-6 bg-blue-600 text-white rounded-lg disabled:opacity-50 font-bold hover:bg-blue-700 transition-colors"
            >
              Go
            </button>
          </div>
        </form>
      </aside>

      <main className="flex-1 p-6 bg-zinc-200">
        <div className="w-full h-full bg-white rounded-2xl shadow-2xl flex items-center justify-center text-zinc-400 border-2 border-dashed border-zinc-300">
            Le site s'affichera ici.
        </div>
      </main>
    </div>
  );
}