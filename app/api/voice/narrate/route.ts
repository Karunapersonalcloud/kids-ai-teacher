import { getRequestAccess } from "@/lib/request-access";
import { createNeuralNarration, VoiceLimitError, type NarrationRequest } from "@/lib/voice/neural-voice";
import { voiceConfig } from "@/lib/voice/voice-config";
import {
  isIndianVoiceLanguage,
  isVoiceLanguageMode,
  isVoiceProvider,
  isVoiceSpeed,
  isVoiceStyle,
} from "@/lib/voice/voice-types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const access = await getRequestAccess(request);
    if (
      access.mustChangeCredentials ||
      access.status === "pending" ||
      access.status === "blocked" ||
      access.status === "rejected" ||
      access.status === "expired"
    ) {
      return fallbackResponse("Your account is not ready for neural voice access.", 403);
    }
    if (!access.policy.canUseAI && access.status !== "guest") {
      return fallbackResponse("Neural voice access is not enabled for this account.", 403);
    }

    const raw = (await request.json()) as Partial<NarrationRequest>;
    const text = typeof raw.text === "string" ? raw.text.replace(/\s+/g, " ").trim() : "";
    if (!text) return fallbackResponse("Teacher narration text is required.", 400);
    if (text.length > voiceConfig.maxNarrationCharacters) {
      return fallbackResponse(`Narration is limited to ${voiceConfig.maxNarrationCharacters} characters per beat.`, 400);
    }

    const input: NarrationRequest = {
      text,
      lessonId: safeIdentifier(raw.lessonId, "lesson"),
      sceneId: safeIdentifier(raw.sceneId, "scene"),
      beatId: safeIdentifier(raw.beatId, "beat"),
      language: isIndianVoiceLanguage(raw.language) ? raw.language : voiceConfig.defaultLanguage,
      voiceProvider: isVoiceProvider(raw.voiceProvider) ? raw.voiceProvider : voiceConfig.provider,
      voiceStyle: isVoiceStyle(raw.voiceStyle) ? raw.voiceStyle : "warm-teacher",
      languageMode: isVoiceLanguageMode(raw.languageMode)
        ? raw.languageMode
        : isIndianVoiceLanguage(raw.language) && raw.language !== "en-IN"
          ? "bilingual"
          : "english-only",
      speed: isVoiceSpeed(raw.speed) ? raw.speed : normalizeNumericSpeed(raw.speed),
      cacheKey: safeIdentifier(raw.cacheKey, ""),
    };

    const narration = await createNeuralNarration(input, {
      userId: access.userId || "demo-user",
      plan: access.plan || "demo",
    });
    if (!narration) return fallbackResponse("Neural regional voice unavailable");

    return Response.json({
      ok: true,
      audioUrl: narration.audioUrl,
      durationMs: narration.durationMs,
      provider: narration.provider,
      language: narration.language,
      voiceName: narration.voiceName,
      narrationText: narration.narrationText,
      cached: narration.cached,
    });
  } catch (error) {
    if (error instanceof VoiceLimitError) {
      return fallbackResponse(error.message, 429);
    }
    console.warn("[voice] Narration request failed", error instanceof Error ? error.message : "Unknown error");
    return fallbackResponse("Neural regional voice unavailable");
  }
}

function fallbackResponse(error: string, status = 200) {
  return Response.json(
    {
      ok: false,
      fallback: "browser",
      error,
    },
    { status },
  );
}

function safeIdentifier(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  return value.replace(/[^a-zA-Z0-9._:-]/g, "-").slice(0, 160) || fallback;
}

function normalizeNumericSpeed(value: unknown) {
  if (typeof value !== "number") return "normal" as const;
  if (value < 0.95) return "slow" as const;
  if (value > 1.05) return "fast" as const;
  return "normal" as const;
}
