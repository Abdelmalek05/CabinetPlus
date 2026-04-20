"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type SupportChatProps = {
  embedded?: boolean;
};

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
