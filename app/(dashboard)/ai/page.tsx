"use client";

import { ArrowUp, Brain, Paperclip, ShieldCheck, Sparkles, User } from "lucide-react";
import { useState } from "react";
import { AppButton, AppCard, PageHeader, TextArea } from "@/app/components/ui/primitives";
import { cn } from "@/app/lib/utils";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

const initialMessages: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Bonjour Dr. Ferkoune. Je peux analyser vos observations cliniques et proposer des pistes diagnostiques.",
  },
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");

  const sendMessage = () => {
    if (!draft.trim()) return;

    const userMessage: ChatMessage = {
      id: String(Date.now()),
      role: "user",
      content: draft,
    };

    const assistantMessage: ChatMessage = {
      id: String(Date.now() + 1),
      role: "assistant",
      content:
        "Suggestion preliminaire: verifier la coherence clinique avec les antecedents et confirmer par examens complementaires avant toute conclusion therapeutique.",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setDraft("");
  };

  return (
    <div className="mx-auto max-w-[1480px] space-y-6">
      <PageHeader
        title="Assistant clinique IA"
        subtitle="Aide au raisonnement medical, avec validation finale par le praticien."
      />

      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <AppCard className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Suggestions rapides</h2>
          <QuickPrompt label="Resumer le dossier patient" onClick={() => setDraft("Resumer le dossier patient et les antecedents importants.")} />
          <QuickPrompt label="Verifier interactions medicamenteuses" onClick={() => setDraft("Verifier les interactions medicamenteuses pour ce traitement.")} />
          <QuickPrompt label="Proposer examens complementaires" onClick={() => setDraft("Quels examens complementaires recommandez-vous ?")} />
        </AppCard>

        <AppCard className="flex min-h-[560px] flex-col">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <p className="font-bold">Session active - Patient Durand</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
              <ShieldCheck className="h-4 w-4" /> Conforme RGPD
            </span>
          </div>

          <div className="scrollbar-hide flex-1 space-y-3 overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 rounded-xl p-4",
                  message.role === "assistant" ? "bg-slate-50" : "bg-emerald-50/60",
                )}
              >
                <div
                  className={cn(
                    "mt-1 flex h-7 w-7 items-center justify-center rounded-full",
                    message.role === "assistant" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700",
                  )}
                >
                  {message.role === "assistant" ? <Brain className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <p className="text-sm leading-relaxed text-slate-800">{message.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-start gap-2">
              <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-200" type="button">
                <Paperclip className="h-4 w-4" />
              </button>
              <TextArea
                className="max-h-28 min-h-20 bg-white"
                placeholder="Posez une question clinique..."
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <AppButton onClick={sendMessage}>
                <ArrowUp className="h-4 w-4" /> Envoyer
              </AppButton>
            </div>
          </div>
        </AppCard>
      </div>
    </div>
  );
}

function QuickPrompt({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
