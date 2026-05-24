"use client";

import { useEffect, useMemo, useState } from "react";
import { Pause, Play, Square, Volume2 } from "lucide-react";

type Tone = "Slow and clear" | "Normal" | "Story teacher" | "Exam teacher";

const toneSettings: Record<Tone, { rate: number; pitch: number }> = {
  "Slow and clear": { rate: 0.82, pitch: 1.05 },
  Normal: { rate: 0.95, pitch: 1.03 },
  "Story teacher": { rate: 0.88, pitch: 1.12 },
  "Exam teacher": { rate: 0.92, pitch: 1 },
};

export function AudioNarrationControls({
  text,
  language = "en-IN",
  autoPlay = false,
  onStart,
  onStop,
}: {
  text: string;
  language?: string;
  autoPlay?: boolean;
  onStart?: () => void;
  onStop?: () => void;
}) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState("");
  const [tone, setTone] = useState<Tone>("Slow and clear");
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const loadVoices = () => {
      const nextVoices = window.speechSynthesis.getVoices();
      setVoices(nextVoices);
      setVoiceName((current) => current || pickPreferredVoice(nextVoices, language)?.name || "");
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [language]);

  useEffect(() => {
    if (autoPlay) speak();
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, autoPlay]);

  const selectedVoice = useMemo(() => voices.find((voice) => voice.name === voiceName) || pickPreferredVoice(voices, language), [language, voiceName, voices]);

  function speak() {
    if (!("speechSynthesis" in window) || !text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(toNaturalNarration(text));
    utterance.lang = selectedVoice?.lang || language;
    utterance.voice = selectedVoice || null;
    utterance.rate = toneSettings[tone].rate;
    utterance.pitch = toneSettings[tone].pitch;
    utterance.onstart = () => {
      setSpeaking(true);
      onStart?.();
    };
    utterance.onend = () => {
      setSpeaking(false);
      onStop?.();
    };
    utterance.onerror = () => {
      setSpeaking(false);
      onStop?.();
    };
    window.speechSynthesis.speak(utterance);
  }

  function pause() {
    if ("speechSynthesis" in window) window.speechSynthesis.pause();
  }

  function resume() {
    if ("speechSynthesis" in window) window.speechSynthesis.resume();
  }

  function stop() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
    onStop?.();
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-purple-100">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={speak} className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-3 py-2 text-sm font-black text-white">
          <Volume2 className="h-4 w-4" /> Read this slide
        </button>
        <button onClick={speaking ? pause : resume} className="rounded-xl bg-slate-100 p-2 text-slate-700" aria-label={speaking ? "Pause narration" : "Resume narration"}>
          {speaking ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button onClick={stop} className="rounded-xl bg-slate-100 p-2 text-slate-700" aria-label="Stop narration">
          <Square className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold" value={voiceName} onChange={(event) => setVoiceName(event.target.value)}>
          <option value="">Best available voice</option>
          {voices.map((voice) => (
            <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
        <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold" value={tone} onChange={(event) => setTone(event.target.value as Tone)}>
          {Object.keys(toneSettings).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-500">
        Browser voice quality depends on your device. Natural human voice can be enabled later with premium voice service.
      </p>
    </div>
  );
}

function pickPreferredVoice(voices: SpeechSynthesisVoice[], language: string) {
  const preferredNames = ["Google UK English Female", "Google US English", "Microsoft Zira", "Microsoft Jenny", "Microsoft Aria", "Samantha"];
  return (
    voices.find((voice) => preferredNames.some((name) => voice.name.includes(name))) ||
    voices.find((voice) => voice.lang === language && /female|zira|jenny|aria|samantha/i.test(voice.name)) ||
    voices.find((voice) => voice.lang.startsWith(language.split("-")[0])) ||
    voices.find((voice) => voice.lang.startsWith("en"))
  );
}

function toNaturalNarration(text: string) {
  return text
    .replace(/slide title[:\s]*/gi, "")
    .replace(/explanation[:\s]*/gi, "")
    .replace(/example[:\s]*/gi, "For example, ")
    .replace(/\s+/g, " ")
    .trim();
}
