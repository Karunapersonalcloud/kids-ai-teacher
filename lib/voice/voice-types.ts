export const INDIAN_VOICE_CONFIG = {
  "en-IN": {
    label: "English (India)",
    azureVoice: "en-IN-NeerjaNeural",
    elevenLabsLanguage: "en",
    openaiLanguageHint: "Indian English",
  },
  "hi-IN": {
    label: "Hindi",
    azureVoice: "hi-IN-SwaraNeural",
    elevenLabsLanguage: "hi",
    openaiLanguageHint: "Hindi",
  },
  "te-IN": {
    label: "Telugu",
    azureVoice: "te-IN-ShrutiNeural",
    elevenLabsLanguage: "te",
    openaiLanguageHint: "Telugu",
  },
  "kn-IN": {
    label: "Kannada",
    azureVoice: "kn-IN-SapnaNeural",
    elevenLabsLanguage: "kn",
    openaiLanguageHint: "Kannada",
  },
  "ta-IN": {
    label: "Tamil",
    azureVoice: "ta-IN-PallaviNeural",
    elevenLabsLanguage: "ta",
    openaiLanguageHint: "Tamil",
  },
  "ml-IN": {
    label: "Malayalam",
    azureVoice: "ml-IN-SobhanaNeural",
    elevenLabsLanguage: "ml",
    openaiLanguageHint: "Malayalam",
  },
  "mr-IN": {
    label: "Marathi",
    azureVoice: "mr-IN-AarohiNeural",
    elevenLabsLanguage: "mr",
    openaiLanguageHint: "Marathi",
  },
  "bn-IN": {
    label: "Bengali",
    azureVoice: "bn-IN-TanishaaNeural",
    elevenLabsLanguage: "bn",
    openaiLanguageHint: "Bengali",
  },
  "gu-IN": {
    label: "Gujarati",
    azureVoice: "gu-IN-DhwaniNeural",
    elevenLabsLanguage: "gu",
    openaiLanguageHint: "Gujarati",
  },
} as const;

export type IndianVoiceLanguage = keyof typeof INDIAN_VOICE_CONFIG;
export type VoiceProvider = "azure" | "elevenlabs" | "openai" | "browser-fallback";
export type VoiceStyle = "soft-indian-teacher" | "story-teacher" | "exam-coach" | "calm-parent";
export type VoiceLanguageMode = "english-only" | "regional-only" | "bilingual";
export type VoiceSpeed = "very-slow" | "slow" | "normal";
export type ExplanationDepth = "Quick" | "Standard" | "Detailed";

export type VoicePreferences = {
  language: IndianVoiceLanguage;
  voiceStyle: VoiceStyle;
  languageMode: VoiceLanguageMode;
  speed: VoiceSpeed;
  explanationDepth: ExplanationDepth;
};

export const DEFAULT_VOICE_PREFERENCES: VoicePreferences = {
  language: "en-IN",
  voiceStyle: "soft-indian-teacher",
  languageMode: "english-only",
  speed: "slow",
  explanationDepth: "Detailed",
};

export const VOICE_STYLE_LABELS: Record<VoiceStyle, string> = {
  "soft-indian-teacher": "Soft teacher",
  "story-teacher": "Story teacher",
  "exam-coach": "Exam coach",
  "calm-parent": "Calm parent",
};

export const VOICE_LANGUAGE_MODE_LABELS: Record<VoiceLanguageMode, string> = {
  "english-only": "English only",
  "regional-only": "Regional only",
  bilingual: "Bilingual regional + English keywords",
};

export const VOICE_SPEED_LABELS: Record<VoiceSpeed, string> = {
  "very-slow": "Very slow",
  slow: "Slow",
  normal: "Normal",
};

export function isIndianVoiceLanguage(value: unknown): value is IndianVoiceLanguage {
  return typeof value === "string" && value in INDIAN_VOICE_CONFIG;
}

export function isVoiceProvider(value: unknown): value is VoiceProvider {
  return value === "azure" || value === "elevenlabs" || value === "openai" || value === "browser-fallback";
}

export function isVoiceStyle(value: unknown): value is VoiceStyle {
  return value === "soft-indian-teacher" || value === "story-teacher" || value === "exam-coach" || value === "calm-parent";
}

export function isVoiceLanguageMode(value: unknown): value is VoiceLanguageMode {
  return value === "english-only" || value === "regional-only" || value === "bilingual";
}

export function isVoiceSpeed(value: unknown): value is VoiceSpeed {
  return value === "very-slow" || value === "slow" || value === "normal";
}
