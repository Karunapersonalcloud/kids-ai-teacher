import type { IndianVoiceLanguage } from "./voice-types";

export const NARRATION_QUALITY_VERSION = "teacher-clean-v2";

export function sanitizeTeacherNarration(text: string, context?: { subject?: string; chapter?: string; conceptTitle?: string; language?: IndianVoiceLanguage }): string {
  const source = (text || "").replace(/\s+/g, " ").trim();
  if (!source) return "";

  const language = context?.language || "en-IN";
  const lower = source.toLowerCase();

  const deterministicMatter = language === "te-IN"
    ? "Definition కి ముందు ఒకసారి చుట్టూ చూడండి. మీ book, water bottle, chair, bag ఇవన్నీ మనకు కనిపిస్తాయి. Air కనిపించదు, కానీ balloon లో air fill చేస్తే balloon పెద్దదవుతుంది. అంటే air కూడా space occupy చేస్తుంది. So, matter అంటే mass ఉండి space occupy చేసే anything."
    : language === "hi-IN"
      ? "Definition समझने से पहले अपने आसपास देखो. आपकी book, water bottle, chair और bag हमें दिखाई देते हैं. Air दिखाई नहीं देती, लेकिन जब हम balloon में air भरते हैं, तो balloon बड़ा हो जाता है. इसका मतलब air भी space occupy करती है. So, matter means anything that has mass and occupies space."
      : "Before we learn the definition of matter, look around you. You can see your book, water bottle, chair, and bag. You cannot see air, but air is also around you. When we fill air into a balloon, the balloon becomes bigger. That means air occupies space. So, matter means anything that has mass and occupies space.";

  const cleaned = source
    .replace(/\?\./g, "?")
    .replace(/!\./g, "!")
    .replace(/\.\./g, ".")
    .replace(/\bA good teacher begins[^.]*\.?/gi, "")
    .replace(/\bWatch the board first[^.]*\.?/gi, "")
    .replace(/\blisten for the rule[^.]*\.?/gi, "")
    .replace(/\bScience ideas become clear[^.]*\.?/gi, "")
    .replace(/\bThis concept becomes easier[^.]*\.?/gi, "")
    .replace(/\bReal-life hook:[^.]*/gi, "")
    .replace(/\bNow add cause[^.]*\.?/gi, "")
    .replace(/\bBuild a diagram[^.]*\.?/gi, "")
    .replace(/\bThis is part of the chapter[^.]*\.?/gi, "")
    .replace(/\bLook around before we start Matter has mass and occupies space\.?/gi, deterministicMatter)
    .replace(/\bLook around before we start[^.]*matter[^.]*\.?/gi, "Before we learn the definition of matter, look around you.")
    .replace(/\bA good teacher[^.]*\.?/gi, "")
    .replace(/\bWatch the board[^.]*\.?/gi, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:?!])/g, "$1")
    .trim();

  const filtered = cleaned
    .replace(/\b(Real-life hook:[^.]*)/gi, "")
    .replace(/\b(teacher begins[^.]*?)\b/gi, "")
    .replace(/\b(look around before we start[^.]*?)\b/gi, "Before we learn the definition of matter, look around you.")
    .replace(/\b(this is part of the chapter[^.]*?)\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:?!])/g, "$1")
    .trim();

  const matterPhrase = /matter has mass and occupies space|what is matter/i;
  if (matterPhrase.test(lower) && /look around before we start|good teacher|watch the board|listen for the rule/i.test(lower)) {
    return deterministicMatter;
  }

  return (filtered || cleaned).replace(/\b(What is matter\?)(?=\s)/gi, "What is matter?");
}
