import "server-only";

import {
  INDIAN_VOICE_CONFIG,
  isIndianVoiceLanguage,
  isVoiceProvider,
  type IndianVoiceLanguage,
  type VoiceProvider,
} from "./voice-types";

const azureVoiceEnvironmentKeys: Record<IndianVoiceLanguage, string> = {
  "en-IN": "AZURE_SPEECH_VOICE_EN_IN",
  "hi-IN": "AZURE_SPEECH_VOICE_HI_IN",
  "te-IN": "AZURE_SPEECH_VOICE_TE_IN",
  "kn-IN": "AZURE_SPEECH_VOICE_KN_IN",
  "ta-IN": "AZURE_SPEECH_VOICE_TA_IN",
  "ml-IN": "AZURE_SPEECH_VOICE_ML_IN",
  "mr-IN": "AZURE_SPEECH_VOICE_MR_IN",
  "bn-IN": "AZURE_SPEECH_VOICE_BN_IN",
  "gu-IN": "AZURE_SPEECH_VOICE_GU_IN",
};

export const voiceConfig = {
  provider: readProvider(process.env.VOICE_PROVIDER),
  defaultLanguage: readLanguage(process.env.VOICE_DEFAULT_LANGUAGE),
  azure: {
    key: process.env.AZURE_SPEECH_KEY || "",
    region: process.env.AZURE_SPEECH_REGION || "",
  },
  elevenLabs: {
    apiKey: process.env.ELEVENLABS_API_KEY || "",
    voiceId: process.env.ELEVENLABS_VOICE_ID || "",
    model: process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2",
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_TTS_MODEL || process.env.VOICE_MODEL || "gpt-4o-mini-tts",
    voice: process.env.OPENAI_TTS_VOICE || process.env.VOICE_NAME || "marin",
    localizationModel: process.env.OPENAI_VOICE_LOCALIZATION_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
  },
  maxNarrationCharacters: readPositiveInteger(process.env.VOICE_MAX_TEXT_LENGTH, 1600),
  cacheEntries: readPositiveInteger(process.env.VOICE_CACHE_ENTRIES, 64),
};

export function getAzureVoice(language: IndianVoiceLanguage) {
  return process.env[azureVoiceEnvironmentKeys[language]] || INDIAN_VOICE_CONFIG[language].azureVoice;
}

export function isProviderConfigured(provider: Exclude<VoiceProvider, "browser-fallback">) {
  if (provider === "azure") return Boolean(voiceConfig.azure.key && voiceConfig.azure.region);
  if (provider === "elevenlabs") return Boolean(voiceConfig.elevenLabs.apiKey && voiceConfig.elevenLabs.voiceId);
  return Boolean(voiceConfig.openai.apiKey);
}

function readProvider(value: string | undefined): VoiceProvider {
  if (value === "browser") return "browser-fallback";
  return isVoiceProvider(value) ? value : "azure";
}

function readLanguage(value: string | undefined): IndianVoiceLanguage {
  return isIndianVoiceLanguage(value) ? value : "en-IN";
}

function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
}
