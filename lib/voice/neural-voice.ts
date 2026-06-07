import "server-only";

import { createHash } from "crypto";
import OpenAI from "openai";
import type { PlanName } from "@/lib/billing-types";
import { getAzureVoice, isProviderConfigured, voiceConfig } from "./voice-config";
import {
  INDIAN_VOICE_CONFIG,
  type IndianVoiceLanguage,
  type VoiceLanguageMode,
  type VoiceProvider,
  type VoiceSpeed,
  type VoiceStyle,
} from "./voice-types";

export type NarrationRequest = {
  text: string;
  lessonId: string;
  sceneId: string;
  beatId: string;
  language: IndianVoiceLanguage;
  voiceProvider: VoiceProvider;
  voiceStyle: VoiceStyle;
  languageMode: VoiceLanguageMode;
  speed: VoiceSpeed;
  cacheKey?: string;
};

export type NeuralNarration = {
  audioUrl: string;
  durationMs: number;
  provider: Exclude<VoiceProvider, "browser-fallback">;
  language: IndianVoiceLanguage;
  voiceName: string;
  narrationText: string;
  cached: boolean;
};

type CachedNarration = Omit<NeuralNarration, "cached"> & {
  createdAt: number;
};

type VoiceUsage = {
  date: string;
  estimatedMs: number;
  requestTimestamps: number[];
};

type VoiceGlobalState = {
  cache: Map<string, CachedNarration>;
  usage: Map<string, VoiceUsage>;
};

const voiceGlobal = globalThis as typeof globalThis & {
  __conceptKidVoiceState?: VoiceGlobalState;
};

const state =
  voiceGlobal.__conceptKidVoiceState ||
  (voiceGlobal.__conceptKidVoiceState = {
    cache: new Map(),
    usage: new Map(),
  });

const dailyMinuteLimits: Record<PlanName, number> = {
  demo: 5,
  trial: 15,
  basic: 30,
  premium: 90,
  family: 150,
};

const speedValues: Record<VoiceSpeed, number> = {
  slow: 0.85,
  normal: 1,
  fast: 1.15,
};

export class VoiceLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VoiceLimitError";
  }
}

export async function createNeuralNarration(
  input: NarrationRequest,
  access: { userId: string; plan: PlanName },
): Promise<NeuralNarration | undefined> {
  const normalizedText = normalizeNarrationText(input.text);
  const requestSignature = buildRequestSignature({ ...input, text: normalizedText });
  const cached = state.cache.get(requestSignature);
  if (cached) {
    return { ...cached, cached: true };
  }

  const estimatedMs = estimateNarrationDuration(normalizedText, input.speed);
  checkVoiceAllowance(access.userId, access.plan, estimatedMs);
  const narrationText = await localizeNarration(normalizedText, input.language, input.languageMode, input.voiceStyle);
  const providers = getProviderOrder(input.voiceProvider);

  for (const provider of providers) {
    if (!isProviderConfigured(provider)) continue;
    try {
      const generated =
        provider === "azure"
          ? await synthesizeWithAzure(narrationText, input)
          : provider === "elevenlabs"
            ? await synthesizeWithElevenLabs(narrationText, input)
            : await synthesizeWithOpenAI(narrationText, input);
      const result: CachedNarration = {
        ...generated,
        durationMs: estimateNarrationDuration(narrationText, input.speed),
        language: input.language,
        narrationText,
        createdAt: Date.now(),
      };
      rememberUsage(access.userId, estimatedMs);
      rememberNarration(requestSignature, result);
      return { ...result, cached: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown provider error";
      console.warn(`[voice] ${provider} narration failed: ${message}`);
    }
  }

  return undefined;
}

function getProviderOrder(selected: VoiceProvider): Array<Exclude<VoiceProvider, "browser-fallback">> {
  const requested = selected === "browser-fallback" ? voiceConfig.provider : selected;
  return Array.from(
    new Set(
      [requested, "azure", "elevenlabs", "openai"].filter(
        (provider): provider is Exclude<VoiceProvider, "browser-fallback"> => provider !== "browser-fallback",
      ),
    ),
  );
}

async function synthesizeWithAzure(text: string, input: NarrationRequest) {
  const voiceName = getAzureVoice(input.language);
  const rate = Math.round((speedValues[input.speed] - 1) * 100);
  const pitch = input.voiceStyle === "story-teacher" ? "+4%" : input.voiceStyle === "calm-parent" ? "-2%" : "0%";
  const ssml = `<speak version="1.0" xml:lang="${input.language}"><voice name="${escapeXml(
    voiceName,
  )}"><prosody rate="${rate >= 0 ? "+" : ""}${rate}%" pitch="${pitch}">${escapeXml(text)}</prosody></voice></speak>`;
  const response = await fetch(
    `https://${encodeURIComponent(voiceConfig.azure.region)}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": voiceConfig.azure.key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "ConceptKid-Cinematic-Teacher",
      },
      body: ssml,
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error(`Azure Speech returned ${response.status}`);
  return {
    audioUrl: toDataUrl(await response.arrayBuffer(), "audio/mpeg"),
    provider: "azure" as const,
    voiceName,
  };
}

async function synthesizeWithElevenLabs(text: string, input: NarrationRequest) {
  const voiceName = voiceConfig.elevenLabs.voiceId;
  const style = input.voiceStyle === "story-teacher" ? 0.4 : input.voiceStyle === "exam-coach" ? 0.15 : 0.25;
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceConfig.elevenLabs.voiceId)}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": voiceConfig.elevenLabs.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: voiceConfig.elevenLabs.model,
        language_code: INDIAN_VOICE_CONFIG[input.language].elevenLabsLanguage,
        voice_settings: {
          stability: input.voiceStyle === "exam-coach" ? 0.68 : 0.55,
          similarity_boost: 0.75,
          style,
          use_speaker_boost: true,
          speed: speedValues[input.speed],
        },
      }),
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error(`ElevenLabs returned ${response.status}`);
  return {
    audioUrl: toDataUrl(await response.arrayBuffer(), "audio/mpeg"),
    provider: "elevenlabs" as const,
    voiceName,
  };
}

async function synthesizeWithOpenAI(text: string, input: NarrationRequest) {
  const client = new OpenAI({ apiKey: voiceConfig.openai.apiKey });
  const response = await client.audio.speech.create({
    model: voiceConfig.openai.model,
    voice: voiceConfig.openai.voice,
    input: text,
    instructions: buildOpenAIVoiceInstructions(input),
    response_format: "mp3",
    speed: speedValues[input.speed],
  });
  return {
    audioUrl: toDataUrl(await response.arrayBuffer(), "audio/mpeg"),
    provider: "openai" as const,
    voiceName: voiceConfig.openai.voice,
  };
}

async function localizeNarration(
  text: string,
  language: IndianVoiceLanguage,
  languageMode: VoiceLanguageMode,
  voiceStyle: VoiceStyle,
) {
  if (language === "en-IN" || languageMode === "english-only" || containsExpectedScript(text, language)) {
    return text;
  }
  if (!voiceConfig.openai.apiKey) return text;

  try {
    const client = new OpenAI({ apiKey: voiceConfig.openai.apiKey });
    const languageLabel = INDIAN_VOICE_CONFIG[language].label;
    const modeInstruction =
      languageMode === "regional-only"
        ? `Use simple spoken ${languageLabel}. Keep only essential formulas, symbols, and proper nouns in English.`
        : `Explain mainly in simple spoken ${languageLabel}, while reinforcing useful CBSE textbook and exam keywords in English.`;
    const completion = await client.chat.completions.create({
      model: voiceConfig.openai.localizationModel,
      messages: [
        {
          role: "system",
          content: `You adapt school-teacher narration for children in India. Do not translate word by word. Preserve all mathematical values, formulas, scientific facts, and the original teaching sequence. ${modeInstruction} Use a warm, patient, natural spoken style. Avoid slang and overly formal textbook language. Return only the adapted narration, with no labels or quotation marks. Teacher style: ${voiceStyle}.`,
        },
        { role: "user", content: text },
      ],
    });
    return normalizeNarrationText(completion.choices[0]?.message.content || text);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown localization error";
    console.warn(`[voice] Narration localization failed: ${message}`);
    return text;
  }
}

function buildOpenAIVoiceInstructions(input: NarrationRequest) {
  const styleInstructions: Record<VoiceStyle, string> = {
    "warm-teacher": "Speak like a warm, patient Indian school teacher. Sound encouraging, clear, and natural.",
    "story-teacher": "Speak like an engaging Indian teacher telling a vivid educational story, with gentle expressive variation.",
    "exam-coach": "Speak like a focused but reassuring CBSE exam coach. Emphasize definitions, conditions, and memory points.",
    "calm-parent": "Speak calmly and patiently, like a supportive parent helping a child understand without pressure.",
  };
  return `${styleInstructions[input.voiceStyle]} Use ${INDIAN_VOICE_CONFIG[input.language].openaiLanguageHint} pronunciation. Do not sound theatrical.`;
}

function buildRequestSignature(input: NarrationRequest) {
  return createHash("sha256")
    .update(
      [
        input.lessonId,
        input.sceneId,
        input.beatId,
        input.language,
        input.voiceProvider,
        input.voiceStyle,
        input.languageMode,
        input.speed,
        getAzureVoice(input.language),
        voiceConfig.elevenLabs.voiceId,
        voiceConfig.elevenLabs.model,
        voiceConfig.openai.voice,
        voiceConfig.openai.model,
        input.cacheKey || "",
        input.text,
      ].join("|"),
    )
    .digest("hex");
}

function checkVoiceAllowance(userId: string, plan: PlanName, estimatedMs: number) {
  const now = Date.now();
  const date = new Date(now).toISOString().slice(0, 10);
  const current = state.usage.get(userId);
  const usage: VoiceUsage = current?.date === date ? current : { date, estimatedMs: 0, requestTimestamps: [] };
  usage.requestTimestamps = usage.requestTimestamps.filter((timestamp) => now - timestamp < 60_000);
  if (usage.requestTimestamps.length >= 20) {
    throw new VoiceLimitError("Voice requests are arriving too quickly. Please wait a moment.");
  }
  const dailyLimitMs = dailyMinuteLimits[plan] * 60_000;
  if (usage.estimatedMs + estimatedMs > dailyLimitMs) {
    throw new VoiceLimitError("Daily neural voice minutes reached.");
  }
  usage.requestTimestamps.push(now);
  state.usage.set(userId, usage);
}

function rememberUsage(userId: string, estimatedMs: number) {
  const usage = state.usage.get(userId);
  if (!usage) return;
  usage.estimatedMs += estimatedMs;
  state.usage.set(userId, usage);
}

function rememberNarration(key: string, value: CachedNarration) {
  state.cache.set(key, value);
  while (state.cache.size > voiceConfig.cacheEntries) {
    const oldestKey = state.cache.keys().next().value;
    if (!oldestKey) break;
    state.cache.delete(oldestKey);
  }
}

function containsExpectedScript(text: string, language: IndianVoiceLanguage) {
  const patterns: Partial<Record<IndianVoiceLanguage, RegExp>> = {
    "hi-IN": /[\u0900-\u097F]/,
    "mr-IN": /[\u0900-\u097F]/,
    "bn-IN": /[\u0980-\u09FF]/,
    "gu-IN": /[\u0A80-\u0AFF]/,
    "te-IN": /[\u0C00-\u0C7F]/,
    "kn-IN": /[\u0C80-\u0CFF]/,
    "ml-IN": /[\u0D00-\u0D7F]/,
    "ta-IN": /[\u0B80-\u0BFF]/,
  };
  return patterns[language]?.test(text) || false;
}

function normalizeNarrationText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function estimateNarrationDuration(text: string, speed: VoiceSpeed) {
  const words = text.split(/\s+/).filter(Boolean).length;
  const wordsPerMinute = 145 * speedValues[speed];
  return Math.max(2400, Math.round((words / wordsPerMinute) * 60_000) + 600);
}

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "'": "&apos;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

function toDataUrl(buffer: ArrayBuffer, mimeType: string) {
  return `data:${mimeType};base64,${Buffer.from(buffer).toString("base64")}`;
}
