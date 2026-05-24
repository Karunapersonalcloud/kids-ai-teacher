export type VoiceProvider = "browser" | "openai";

export const voiceConfig = {
  provider: (process.env.VOICE_PROVIDER || "browser") as VoiceProvider,
  defaultGender: process.env.VOICE_DEFAULT_GENDER || "female",
  defaultLanguage: process.env.VOICE_DEFAULT_LANGUAGE || "en-IN",
  futureOpenAi: {
    provider: "openai",
    model: process.env.VOICE_MODEL || "gpt-4o-mini-tts",
    voice: process.env.VOICE_NAME || "nova",
  },
};
