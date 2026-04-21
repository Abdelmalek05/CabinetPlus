import { buildPatientClinicalContext } from "@/app/lib/server/patient-context";

export const runtime = "nodejs";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatRequestBody = {
  messages?: ChatMessage[];
  contextPatientId?: string | number;
};

type GeminiPart = {
  text: string;
};

type GeminiContent = {
  role: "user" | "model";
  parts: GeminiPart[];
};

type GeminiErrorPayload = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

type GeminiSuccessPayload = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
};

type ModelAttempt =
  | {
      ok: true;
      text: string;
    }
  | {
      ok: false;
      status: number;
      payload: GeminiErrorPayload | null;
      rawBody: string;
    };

const PRIMARY_MODEL = "gemini-2.5-flash";
const FALLBACK_MODEL = "gemini-1.5-flash";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const SYSTEM_PROMPT = `You are the CabinetPlus clinical assistant for doctors.

Current system context:
- CabinetPlus is a medical practice dashboard used by healthcare professionals.
- The app includes modules such as patients, consultations, calendar, revenue, and contact.
- The assistant is used inside the doctor workflow and should stay practical, fast, and clinically helpful.

Behavior and interaction rules:
1. Speak in the same language as the user. If unclear, default to French.
2. Use a professional, respectful tone suitable for clinicians.
3. Default to a medium-length answer: usually 120-220 words, or 6-10 concise bullets when the question is procedural.
4. Prioritize patient safety: highlight red flags, urgent escalation criteria, and uncertainty.
5. Do not invent patient data, lab values, or history. If details are missing, ask targeted follow-up questions.
6. For clinical questions, provide decision support (differential, workup ideas, risk factors, and next steps), not absolute certainty.
7. Never replace physician judgment. Include a brief safety reminder when clinical risk is significant.
8. For medication-related guidance, mention verification of contraindications, allergies, interactions, dose, renal/hepatic context, and local protocol.
9. If the doctor asks general medical or operational questions, answer directly and clearly.
10. Respect privacy and confidentiality; do not request unnecessary identifying information.
11. Avoid deliberately brief one-line answers unless the user explicitly asks for a short answer.
12. Return responses in Markdown format only.
13. Use clear Markdown structure when helpful: short headings, bullet points, and tables for comparisons.
14. Complete your answer without intentional truncation.

Preferred answer format:
- Start with a direct answer in Markdown.
- Then provide short actionable bullets when useful.
- For complex clinical prompts, include: likely hypotheses, recommended checks/tests, and practical next action.`;

function buildSystemPrompt(patientClinicalContext: string | null) {
  if (!patientClinicalContext) {
    return SYSTEM_PROMPT;
  }

  return `${SYSTEM_PROMPT}

Important request context:
- The doctor attached a patient context for this single request.
- The context below is anonymized and clinically curated; use it when relevant.
- Do not ask for identifiers and do not expose personal information.

${patientClinicalContext}`;
}

function isQuotaError(status: number, payload: GeminiErrorPayload | null, rawBody = "") {
  const message = payload?.error?.message?.toLowerCase() ?? "";
  const errorStatus = payload?.error?.status?.toUpperCase() ?? "";
  const errorCode = payload?.error?.code;
  const raw = rawBody.toLowerCase();

  return (
    status === 429 ||
    errorCode === 429 ||
    errorStatus === "RESOURCE_EXHAUSTED" ||
    message.includes("quota") ||
    message.includes("resource exhausted") ||
    message.includes("rate limit") ||
    raw.includes("resource_exhausted") ||
    raw.includes("quota") ||
    raw.includes("rate limit")
  );
}

async function parseResponseBody(response: Response) {
  const rawBody = await response.text().catch(() => "");

  if (!rawBody.trim()) {
    return { rawBody, payload: null };
  }

  try {
    return {
      rawBody,
      payload: JSON.parse(rawBody) as GeminiSuccessPayload | GeminiErrorPayload,
    };
  } catch {
    return {
      rawBody,
      payload: null,
    };
  }
}

function buildGeminiContents(messages: ChatMessage[]): GeminiContent[] {
  return messages
    .filter((message) => typeof message.content === "string" && message.content.trim().length > 0)
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content.trim() }],
    }));
}

function getAssistantText(payload: GeminiSuccessPayload | null) {
  if (!payload?.candidates?.length) return null;

  const text = payload.candidates[0]?.content?.parts
    ?.map((part) => part.text)
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join("\n")
    .trim();

  return text && text.length > 0 ? text : null;
}

async function requestModel(model: string, apiKey: string, contents: GeminiContent[], systemPrompt: string): Promise<ModelAttempt> {
  const response = await fetch(`${GEMINI_API_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.5,
      },
    }),
  });

  const { payload, rawBody } = await parseResponseBody(response);

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      payload: payload as GeminiErrorPayload | null,
      rawBody,
    };
  }

  const assistantText = getAssistantText(payload as GeminiSuccessPayload | null);

  if (!assistantText) {
    return {
      ok: false,
      status: 502,
      payload: null,
      rawBody,
    };
  }

  return {
    ok: true,
    text: assistantText,
  };
}

async function generateWithFallback(contents: GeminiContent[], apiKey: string, systemPrompt: string) {
  const primaryAttempt = await requestModel(PRIMARY_MODEL, apiKey, contents, systemPrompt);

  if (primaryAttempt.ok) {
    return primaryAttempt;
  }

  if (!isQuotaError(primaryAttempt.status, primaryAttempt.payload, primaryAttempt.rawBody)) {
    return primaryAttempt;
  }

  const fallbackAttempt = await requestModel(FALLBACK_MODEL, apiKey, contents, systemPrompt);

  if (fallbackAttempt.ok) {
    return fallbackAttempt;
  }

  if (isQuotaError(fallbackAttempt.status, fallbackAttempt.payload, fallbackAttempt.rawBody)) {
    return {
      ok: false as const,
      status: 429,
      payload: {
        error: {
          code: 429,
          status: "RESOURCE_EXHAUSTED",
          message: "quota_exceeded",
        },
      },
      rawBody: fallbackAttempt.rawBody,
    };
  }

  return fallbackAttempt;
}

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return Response.json({ error: "missing_api_key" }, { status: 500 });
  }

  let body: ChatRequestBody;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const contents = buildGeminiContents(body.messages);

  if (!contents.length) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const patientClinicalContext = body.contextPatientId
    ? buildPatientClinicalContext(body.contextPatientId)
    : null;

  const systemPrompt = buildSystemPrompt(patientClinicalContext);

  try {
    const result = await generateWithFallback(contents, apiKey, systemPrompt);

    if (result.ok) {
      return Response.json({
        message: {
          role: "assistant",
          content: result.text,
        },
      });
    }

    if (result.status === 429 || isQuotaError(result.status, result.payload, result.rawBody)) {
      return Response.json({ error: "quota_exceeded" }, { status: 429 });
    }

    return Response.json({ error: "chat_failed" }, { status: 500 });
  } catch (error) {
    console.error("Chat route failed:", error);
    return Response.json({ error: "chat_failed" }, { status: 500 });
  }
}
