"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle, MessageCircle, Plus, Send, UserRound, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Patient } from "@/app/types";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type SupportChatProps = {
  embedded?: boolean;
};

type PatientContextCandidate = {
  id: string;
  label: string;
};

type ConsultationRecord = {
  ID?: number;
  DATE?: string | null;
  DIAGNOSTIC?: string | null;
  MALADIE?: string | null;
  EXPLORATION?: string | null;
  TRAITEMENT?: string | null;
  CONSTAT?: string | null;
  NOTE?: string | null;
};

type PrescriptionRecord = {
  MEDICAMENT?: string;
  TYPE?: string;
  PRISE?: string;
  DUREE?: string;
};

type BilanRecord = {
  AVANT?: string;
  BILAN?: string;
  SALUT?: string;
  ID_CONSULT?: number;
  consultationId?: string | number;
};

type CabinetBridge = {
  patients?: {
    list: (options?: { limit?: number; offset?: number }) => Promise<{ items?: Patient[] } | Patient[]>;
    get: (id: string | number) => Promise<Patient | null>;
  };
  consultations?: {
    byPatient: (patientId: string | number) => Promise<ConsultationRecord[]>;
  };
  prescriptions?: {
    byConsultation: (consultationId: string | number) => Promise<PrescriptionRecord[]>;
  };
  documents?: {
    bilan?: {
      list: (options?: { patientId?: string | number; limit?: number; offset?: number }) => Promise<BilanRecord[]>;
    };
  };
};

function normalizeSnippet(value: string | null | undefined, maxLength = 220) {
  if (!value) return "";
  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) return "";
  return compact.length > maxLength ? `${compact.slice(0, maxLength)}...` : compact;
}

function normalizeSex(value: string | null | undefined) {
  const upper = value?.trim().toUpperCase();
  if (!upper) return "Non precise";
  if (upper === "M") return "Homme";
  if (upper === "MME" || upper === "F" || upper === "MLLE") return "Femme";
  return value?.trim() || "Non precise";
}

function getCabinetBridge(): CabinetBridge | null {
  if (typeof window === "undefined") return null;
  const withBridge = window as Window & { cabinet?: CabinetBridge };
  return withBridge.cabinet ?? null;
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content: "Hello. I am your CabinetPlus assistant. Ask me anything and I will do my best to help.",
};

const QUOTA_EXCEEDED_MESSAGE: Message = {
  role: "assistant",
  content: "I'm currently taking a short break! ☕ My daily response limit has been reached. Please try again shortly.",
};

const FALLBACK_ERROR_MESSAGE: Message = {
  role: "assistant",
  content: "Sorry, I could not respond right now. Please try again in a moment.",
};

export default function SupportChat({ embedded = false }: SupportChatProps) {
  const [isOpen, setIsOpen] = useState(embedded);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [patientsLoadError, setPatientsLoadError] = useState<string | null>(null);
  const [patientCandidates, setPatientCandidates] = useState<PatientContextCandidate[]>([]);
  const [pickerPatientId, setPickerPatientId] = useState("");
  const [activePatientContext, setActivePatientContext] = useState<PatientContextCandidate | null>(null);
  const [activePatientContextText, setActivePatientContextText] = useState<string | null>(null);
  const [isPreparingPatientContext, setIsPreparingPatientContext] = useState(false);
  const [patientContextError, setPatientContextError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (!isOpen) return;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(focusTimer);
  }, [isOpen]);

  useEffect(() => {
    if (embedded) {
      setIsOpen(true);
    }
  }, [embedded]);

  useEffect(() => {
    if (embedded) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!isOpen) return;
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [embedded, isOpen]);

  const loadPatientCandidatesFromBridge = useCallback(async () => {
    const bridge = getCabinetBridge();
    if (!bridge?.patients?.list) return null;

    const response = await bridge.patients.list({ limit: 200, offset: 0 });
    const entries = Array.isArray(response) ? response : response?.items;
    if (!Array.isArray(entries)) return [];

    return entries
      .filter((patient): patient is Patient => Boolean(patient?.id) && Boolean(patient?.name))
      .map((patient) => ({
        id: String(patient.id),
        label: `${patient.name} - ${patient.age || "Age non precise"} ans - ${patient.gender || "Non precise"}`,
      }));
  }, []);

  const buildPatientContextFromBridge = useCallback(async (patientId: string) => {
    const bridge = getCabinetBridge();
    if (!bridge?.patients?.get) return null;

    const patient = await bridge.patients.get(patientId);
    if (!patient) return null;

    const consultations = bridge.consultations?.byPatient ? await bridge.consultations.byPatient(patientId) : [];
    const recentConsultations = Array.isArray(consultations) ? consultations.slice(0, 3) : [];

    const prescriptionLists = bridge.prescriptions?.byConsultation
      ? await Promise.all(
          recentConsultations
            .map((consultation) => consultation.ID)
            .filter((consultationId): consultationId is number => Number.isFinite(consultationId))
            .map((consultationId) => bridge.prescriptions!.byConsultation(consultationId)),
        )
      : [];

    const bilans = bridge.documents?.bilan?.list ? await bridge.documents.bilan.list({ patientId, limit: 3, offset: 0 }) : [];

    const lines: string[] = [];
    lines.push("## Contexte clinique patient (anonymise)");
    lines.push("- Utiliser ce contexte uniquement pour le raisonnement clinique de la reponse en cours.");

    const profileParts: string[] = [];
    if (Number.isFinite(patient.age) && patient.age > 0) profileParts.push(`${patient.age} ans`);
    if (Number.isFinite(patient.ageMonths) && Number(patient.ageMonths) > 0) profileParts.push(`${patient.ageMonths} mois`);
    profileParts.push(normalizeSex(patient.gender));
    lines.push(`- Profil: ${profileParts.filter(Boolean).join(" - ")}`);

    const profession = normalizeSnippet(patient.profession, 80);
    if (profession) lines.push(`- Profession: ${profession}`);

    if (patient.weightKg || patient.heightCm) {
      const weight = patient.weightKg ? `${patient.weightKg} kg` : "poids non precise";
      const height = patient.heightCm ? `${patient.heightCm} cm` : "taille non precise";
      lines.push(`- Anthropometrie: ${weight}, ${height}`);
    }

    const personalHistory = normalizeSnippet(patient.personalHistory, 320);
    const familyHistory = normalizeSnippet(patient.familyHistory, 300);
    const clinicalNote = normalizeSnippet(patient.note, 280);
    if (personalHistory) lines.push(`- Antecedents personnels: ${personalHistory}`);
    if (familyHistory) lines.push(`- Antecedents familiaux: ${familyHistory}`);
    if (clinicalNote) lines.push(`- Notes cliniques: ${clinicalNote}`);

    if (recentConsultations.length > 0) {
      lines.push("### Consultations recentes");
      recentConsultations.forEach((consultation, index) => {
        const label = normalizeSnippet(consultation.DATE, 40) || `Consultation ${index + 1}`;
        const parts = [
          normalizeSnippet(consultation.DIAGNOSTIC, 220) ? `diagnostic: ${normalizeSnippet(consultation.DIAGNOSTIC, 220)}` : "",
          normalizeSnippet(consultation.MALADIE, 160) ? `pathologie evoquee: ${normalizeSnippet(consultation.MALADIE, 160)}` : "",
          normalizeSnippet(consultation.CONSTAT, 160) ? `constat clinique: ${normalizeSnippet(consultation.CONSTAT, 160)}` : "",
          normalizeSnippet(consultation.EXPLORATION, 150) ? `explorations: ${normalizeSnippet(consultation.EXPLORATION, 150)}` : "",
          normalizeSnippet(consultation.TRAITEMENT, 150) ? `traitement: ${normalizeSnippet(consultation.TRAITEMENT, 150)}` : "",
          normalizeSnippet(consultation.NOTE, 140) ? `note: ${normalizeSnippet(consultation.NOTE, 140)}` : "",
        ].filter(Boolean);
        lines.push(`- ${label}`);
        if (parts.length > 0) {
          lines.push(`  - ${parts.join(" | ")}`);
        }
      });
    }

    const flatPrescriptions = prescriptionLists.flat().slice(0, 6);
    if (flatPrescriptions.length > 0) {
      lines.push("### Prescriptions recentes");
      flatPrescriptions.forEach((prescription) => {
        const med = normalizeSnippet(prescription.MEDICAMENT, 80);
        if (!med) return;
        const type = normalizeSnippet(prescription.TYPE, 60);
        const prise = normalizeSnippet(prescription.PRISE, 100);
        const duree = normalizeSnippet(prescription.DUREE, 60);
        const detail = [type, prise, duree].filter(Boolean).join(" | ");
        lines.push(`- ${med}${detail ? ` - ${detail}` : ""}`);
      });
    }

    if (Array.isArray(bilans) && bilans.length > 0) {
      lines.push("### Bilans associes");
      bilans.slice(0, 3).forEach((bilan) => {
        const before = normalizeSnippet(bilan.AVANT, 120);
        const result = normalizeSnippet(bilan.BILAN, 160);
        const followUp = normalizeSnippet(bilan.SALUT, 120);
        const parts = [before ? `avant: ${before}` : "", result ? `bilan: ${result}` : "", followUp ? `suite: ${followUp}` : ""].filter(Boolean);
        if (parts.length > 0) {
          lines.push(`- ${parts.join(" | ")}`);
        }
      });
    }

    const context = lines.join("\n");
    if (context.length < 120) return null;
    return context.length > 4500 ? `${context.slice(0, 4500)}\n- ... (contexte tronque)` : context;
  }, []);

  const loadPatientCandidates = useCallback(async () => {
    if (patientCandidates.length > 0 || isLoadingPatients) return;

    setIsLoadingPatients(true);
    setPatientsLoadError(null);

    try {
      const bridgeCandidates = await loadPatientCandidatesFromBridge();

      if (bridgeCandidates === null) {
        throw new Error("Electron bridge unavailable");
      }

      const candidates = bridgeCandidates.slice(0, 200);

      setPatientCandidates(candidates);

      if (!pickerPatientId && candidates.length > 0) {
        setPickerPatientId(candidates[0].id);
      }
    } catch (error) {
      console.error("Failed to load patient context candidates:", error);
      setPatientsLoadError("Impossible de charger la liste des patients depuis la base locale.");
    } finally {
      setIsLoadingPatients(false);
    }
  }, [isLoadingPatients, loadPatientCandidatesFromBridge, patientCandidates, pickerPatientId]);

  const openPatientPicker = async () => {
    setIsPickerOpen(true);
    await loadPatientCandidates();
  };

  const attachPatientContext = async () => {
    if (!pickerPatientId) return;
    const selectedPatient = patientCandidates.find((candidate) => candidate.id === pickerPatientId);
    if (!selectedPatient) return;

    setIsPreparingPatientContext(true);
    setPatientContextError(null);

    try {
      const contextText = await buildPatientContextFromBridge(selectedPatient.id);
      setActivePatientContext(selectedPatient);
      setActivePatientContextText(contextText);
      if (!contextText) {
        setPatientContextError("Contexte detaille indisponible: utilisation des donnees minimales de selection.");
      }
      setIsPickerOpen(false);
      inputRef.current?.focus();
    } catch (error) {
      console.error("Failed to prepare patient clinical context:", error);
      setPatientContextError("Impossible de preparer le contexte clinique du patient.");
    } finally {
      setIsPreparingPatientContext(false);
    }
  };

  const clearPatientContext = () => {
    setActivePatientContext(null);
    setActivePatientContextText(null);
    setPatientContextError(null);
  };

  const handleSend = async (overrideInput?: string) => {
    const trimmedInput = (overrideInput ?? input).trim();
    if (!trimmedInput || isTyping) return;

    const userMessage: Message = {
      role: "user",
      content: trimmedInput,
    };

    const outboundMessages = [...messages, userMessage];
    const firstUserIndex = outboundMessages.findIndex((message) => message.role === "user");
    const sanitizedMessages = firstUserIndex >= 0 ? outboundMessages.slice(firstUserIndex) : outboundMessages;

    setMessages((previous) => [...previous, userMessage]);
    if (!overrideInput) setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: sanitizedMessages,
          patientClinicalContext: activePatientContextText,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 429 && data?.error === "quota_exceeded") {
          setMessages((previous) => [...previous, QUOTA_EXCEEDED_MESSAGE]);
          return;
        }

        throw new Error(`Chat API failed with status ${response.status}`);
      }

      if (data?.message?.role === "assistant" && typeof data.message.content === "string") {
        setMessages((previous) => [...previous, data.message]);
      } else {
        throw new Error("Chat API returned an invalid payload");
      }
    } catch (error) {
      console.error("Support chat request failed:", error);
      setMessages((previous) => [...previous, FALLBACK_ERROR_MESSAGE]);
    } finally {
      setIsTyping(false);
    }
  };

  const containerClassName = embedded ? "w-full" : "fixed bottom-5 right-5 z-50 sm:bottom-7 sm:right-7";

  const panelClassName = embedded
    ? "flex h-[min(78vh,760px)] min-h-[560px] w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10"
    : "absolute bottom-20 right-0 flex h-[min(72vh,640px)] w-[min(94vw,420px)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15";

  return (
    <div ref={containerRef} className={containerClassName}>
      {isOpen ? (
        <div className={panelClassName}>
          <div className="pulse-gradient flex items-center justify-between px-5 py-4 text-white">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-white/80">CabinetPlus</p>
              <h3 className="font-headline text-lg font-extrabold">Support Assistant</h3>
            </div>
            {!embedded ? (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-white/70 transition hover:bg-white/15 hover:text-white"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>

          <div className="scrollbar-hide flex-1 space-y-4 overflow-y-auto bg-surface p-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    message.role === "user"
                      ? "max-w-[85%] break-words rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm leading-relaxed text-white"
                      : "max-w-[85%] break-words rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700"
                  }
                >
                  {message.role === "user" ? (
                    message.content
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                        h1: ({ ...props }) => <h1 className="mb-2 text-base font-bold text-primary" {...props} />,
                        h2: ({ ...props }) => <h2 className="mb-2 text-sm font-bold text-primary" {...props} />,
                        h3: ({ ...props }) => <h3 className="mb-1 text-sm font-semibold text-primary" {...props} />,
                        ul: ({ ...props }) => <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0" {...props} />,
                        ol: ({ ...props }) => <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0" {...props} />,
                        li: ({ ...props }) => <li className="leading-relaxed" {...props} />,
                        strong: ({ ...props }) => <strong className="font-bold text-slate-900" {...props} />,
                        a: ({ ...props }) => (
                          <a
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary underline underline-offset-2"
                            {...props}
                          />
                        ),
                        table: ({ ...props }) => (
                          <div className="mb-2 overflow-x-auto last:mb-0">
                            <table className="min-w-full border-collapse border border-slate-200 text-left text-xs" {...props} />
                          </div>
                        ),
                        th: ({ ...props }) => <th className="border border-slate-200 bg-slate-100 px-2 py-1 font-semibold" {...props} />,
                        td: ({ ...props }) => <td className="border border-slate-200 px-2 py-1 align-top" {...props} />,
                        code: ({ className, children, ...props }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code className="rounded bg-slate-100 px-1 py-0.5 text-[12px] text-slate-900" {...props}>
                              {children}
                            </code>
                          ) : (
                            <code className="block overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100" {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}

            {isTyping ? (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary/70" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary/50" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary/30" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  void openPatientPicker();
                }}
                disabled={isPreparingPatientContext}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-700 transition hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPreparingPatientContext ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Ajouter contexte patient
              </button>

              {activePatientContext ? (
                <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] text-emerald-800">
                  <UserRound className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate font-semibold">{activePatientContext.label}</span>
                  <button
                    type="button"
                    onClick={clearPatientContext}
                    className="rounded-full p-0.5 text-emerald-700 transition hover:bg-emerald-100"
                    aria-label="Retirer le contexte patient"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : null}
            </div>

            {isPickerOpen ? (
              <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold text-slate-600">Selectionner un patient pour enrichir le contexte clinique de cette conversation.</p>
                {isLoadingPatients ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <LoaderCircle className="h-4 w-4 animate-spin" /> Chargement des patients...
                  </div>
                ) : (
                  <>
                    <select
                      value={pickerPatientId}
                      onChange={(event) => setPickerPatientId(event.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-400"
                    >
                      <option value="">Choisir un patient...</option>
                      {patientCandidates.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.label}
                        </option>
                      ))}
                    </select>

                    {patientsLoadError ? <p className="mt-2 text-xs text-rose-600">{patientsLoadError}</p> : null}

                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPickerOpen(false)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void attachPatientContext();
                        }}
                        disabled={!pickerPatientId || isPreparingPatientContext}
                        className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isPreparingPatientContext ? "Ajout..." : "Ajouter"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {patientContextError ? <p className="mb-3 text-xs text-amber-700">{patientContextError}</p> : null}

            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask your question..."
                disabled={isTyping}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-70"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {!embedded ? (
        <button
          type="button"
          onClick={() => setIsOpen((previous) => !previous)}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-2xl shadow-primary/30 transition hover:scale-105 active:scale-95"
          aria-label={isOpen ? "Close support chat" : "Open support chat"}
        >
          {isOpen ? <X className="h-7 w-7" /> : <MessageCircle className="h-7 w-7" />}
        </button>
      ) : null}
    </div>
  );
}
