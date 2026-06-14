type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LlmCallOptions = {
  system: string;
  prompt: string;
  maxTokens: number;
  temperature?: number;
  model?: string;
  maxRetries?: number;
  providerOrder?: LlmProvider[];
  providerModels?: Partial<Record<LlmProvider, string>>;
};

export type LlmProvider = "groq" | "glm" | "anthropic";

export type LlmCallResult = {
  text: string;
  model: string;
  provider: LlmProvider;
};

const GROQ_BASE_URL = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GLM_BASE_URL = process.env.GLM_BASE_URL || "https://api.z.ai/api/paas/v4";
const GLM_MODEL = process.env.GLM_MODEL || "glm-5.1";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const GROQ_MAX_RETRIES = Math.max(0, Math.min(5, Number(process.env.GROQ_MAX_RETRIES || (process.env.VERCEL ? 3 : 3))));
const GLM_MAX_RETRIES = Math.max(0, Math.min(5, Number(process.env.GLM_MAX_RETRIES || (process.env.VERCEL ? 1 : 4))));
const LLM_TIMEOUT_MS = Math.max(1500, Math.min(45000, Number(process.env.LLM_TIMEOUT_MS || (process.env.VERCEL ? 30000 : 15000))));

class LlmHttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

function chatCompletionsUrl(baseUrl: string) {
  const trimmed = trimTrailingSlash(baseUrl);
  return trimmed.endsWith("/chat/completions") ? trimmed : `${trimmed}/chat/completions`;
}

async function postJson(url: string, headers: Record<string, string>, body: unknown) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new LlmHttpError(res.status, `LLM request failed (${res.status}): ${text.slice(0, 240)}`);
    }
    return JSON.parse(text);
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error(`LLM request timed out after ${LLM_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelayMs(attempt: number) {
  const base = 1800 * 2 ** attempt;
  const jitter = Math.floor(Math.random() * 450);
  return Math.min(15000, base + jitter);
}

async function callOpenAiCompatible(
  options: LlmCallOptions,
  config: {
    apiKey: string | undefined;
    baseUrl: string;
    model: string;
    provider: "groq";
    maxRetries: number;
    extraHeaders?: Record<string, string>;
    extraBody?: Record<string, unknown>;
  },
): Promise<LlmCallResult> {
  if (!config.apiKey) throw new Error(`${config.provider.toUpperCase()}_API_KEY is not configured`);
  const model = options.providerModels?.[config.provider] || options.model || config.model;
  const messages: ChatMessage[] = [
    { role: "system", content: options.system },
    { role: "user", content: options.prompt },
  ];
  let json: any;
  const maxRetries = options.maxRetries ?? config.maxRetries;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      json = await postJson(
        chatCompletionsUrl(config.baseUrl),
        {
          Authorization: `Bearer ${config.apiKey}`,
          ...config.extraHeaders,
        },
        {
          model,
          messages,
          max_tokens: options.maxTokens,
          temperature: options.temperature ?? 0.7,
          stream: false,
          response_format: { type: "json_object" },
          ...config.extraBody,
        },
      );
      break;
    } catch (err) {
      const retryable = err instanceof LlmHttpError && (err.status === 429 || err.status >= 500);
      if (!retryable || attempt >= maxRetries) throw err;
      await sleep(retryDelayMs(attempt));
    }
  }
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${config.provider} response did not include message content`);
  return { text: String(content), model, provider: config.provider };
}

async function callGroq(options: LlmCallOptions): Promise<LlmCallResult> {
  return callOpenAiCompatible(options, {
    apiKey: process.env.GROQ_API_KEY,
    baseUrl: GROQ_BASE_URL,
    model: GROQ_MODEL,
    provider: "groq",
    maxRetries: GROQ_MAX_RETRIES,
  });
}

async function callGlm(options: LlmCallOptions): Promise<LlmCallResult> {
  if (!process.env.GLM_API_KEY) throw new Error("GLM_API_KEY is not configured");
  const model = options.providerModels?.glm || options.model || GLM_MODEL;
  const messages: ChatMessage[] = [
    { role: "system", content: options.system },
    { role: "user", content: options.prompt },
  ];
  let json: any;
  for (let attempt = 0; attempt <= GLM_MAX_RETRIES; attempt++) {
    try {
      json = await postJson(
        chatCompletionsUrl(GLM_BASE_URL),
        {
          Authorization: `Bearer ${process.env.GLM_API_KEY}`,
          "Accept-Language": "en-US,en",
        },
        {
          model,
          messages,
          max_tokens: options.maxTokens,
          temperature: options.temperature ?? 0.7,
          stream: false,
        },
      );
      break;
    } catch (err) {
      const retryable = err instanceof LlmHttpError && (err.status === 429 || err.status >= 500);
      if (!retryable || attempt >= GLM_MAX_RETRIES) throw err;
      await sleep(retryDelayMs(attempt));
    }
  }
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("GLM response did not include message content");
  return { text: String(content), model, provider: "glm" };
}

async function callAnthropic(options: LlmCallOptions): Promise<LlmCallResult> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");
  const model = options.providerModels?.anthropic || options.model || ANTHROPIC_MODEL;
  const json = await postJson(
    "https://api.anthropic.com/v1/messages",
    {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    {
      model,
      max_tokens: options.maxTokens,
      temperature: options.temperature ?? 0.7,
      system: options.system,
      messages: [{ role: "user", content: options.prompt }],
    },
  );
  const block = json?.content?.find((b: any) => b?.type === "text");
  if (!block?.text) throw new Error("Anthropic response did not include text content");
  return { text: String(block.text), model, provider: "anthropic" };
}

export function configuredModelLabel() {
  if (process.env.GROQ_API_KEY) return GROQ_MODEL;
  if (process.env.GLM_API_KEY) return GLM_MODEL;
  return ANTHROPIC_MODEL;
}

export async function callLlm(options: LlmCallOptions): Promise<LlmCallResult> {
  const errors: string[] = [];
  const seen = new Set<LlmProvider>();
  const order = [...(options.providerOrder ?? []), "groq", "glm", "anthropic"].filter((provider) => {
    if (seen.has(provider as LlmProvider)) return false;
    seen.add(provider as LlmProvider);
    return true;
  }) as LlmProvider[];

  for (const provider of order) {
    if (provider === "groq" && process.env.GROQ_API_KEY) {
      try {
        return await callGroq(options);
      } catch (err: any) {
        errors.push(`Groq: ${err?.message || "failed"}`);
      }
    }
    if (provider === "glm" && process.env.GLM_API_KEY) {
      try {
        return await callGlm(options);
      } catch (err: any) {
        errors.push(`GLM: ${err?.message || "failed"}`);
      }
    }
    if (provider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
      try {
        return await callAnthropic(options);
      } catch (err: any) {
        errors.push(`Anthropic: ${err?.message || "failed"}`);
      }
    }
  }
  throw new Error(errors.length ? errors.join(" | ").slice(0, 500) : "No LLM provider is configured");
}
