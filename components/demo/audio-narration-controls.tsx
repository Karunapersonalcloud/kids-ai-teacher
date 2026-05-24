"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Square } from "lucide-react";

const languageCodes: Record<string, string> = {
  English: "en-IN",
  Hindi: "hi-IN",
  Telugu: "te-IN",
  Kannada: "kn-IN",
};

const rateMap = {
  Slow: 0.82,
  Normal: 1,
  Fast: 1.18,
} as const;

type Speed = keyof typeof rateMap;

export function AudioNarrationControls({
  text,
  language,
  autoPlay = false,
  onStart,
  onStop,
}: {
  text: string;
  language: string;
  autoPlay?: boolean;
  onStart?: () => void;
  onStop?: () => void;
}) {
  const [speed, setSpeed] = useState<Speed>("Normal");
  const [supported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const langCode = languageCodes[language] || "en-IN";
  const canSpeakText = text.trim().length > 0;

  const selectedVoice = useMemo(() => {
    if (!supported) return undefined;
    const voices = window.speechSynthesis.getVoices();
    return voices.find((voice) => voice.lang.toLowerCase().startsWith(langCode.toLowerCase())) || voices.find((voice) => voice.lang.toLowerCase().startsWith("en"));
  }, [langCode, supported]);

  useEffect(() => {
    let timer: number | undefined;
    if (autoPlay && supported && canSpeakText) {
      timer = window.setTimeout(() => speak(), 80);
    }
    return () => {
      if (timer) window.clearTimeout(timer);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, autoPlay, supported]);

  function speak() {
    if (!supported || !canSpeakText) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = rateMap[speed];
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.onstart = () => {
      setSpeaking(true);
      setPaused(false);
      onStart?.();
    };
    utterance.onend = () => {
      setSpeaking(false);
      setPaused(false);
      onStop?.();
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setPaused(false);
      onStop?.();
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }

  function pause() {
    if (!supported) return;
    window.speechSynthesis.pause();
    setPaused(true);
  }

  function resume() {
    if (!supported) return;
    window.speechSynthesis.resume();
    setPaused(false);
  }

  function stop() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    setSpeaking(false);
    setPaused(false);
    onStop?.();
  }

  if (!supported) {
    return (
      <div className="rounded-2xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800">
        Audio narration is supported in most modern browsers. If it is unavailable here, you can still read the visual lesson.
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-3 ring-1 ring-purple-100">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={speak} className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-2 text-xs font-black text-white">
          <Play className="h-3.5 w-3.5" /> Read this slide
        </button>
        <button type="button" onClick={paused ? resume : pause} disabled={!speaking} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-40">
          {paused ? <RotateCcw className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          {paused ? "Resume" : "Pause"}
        </button>
        <button type="button" onClick={stop} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">
          <Square className="h-3.5 w-3.5" /> Stop
        </button>
        <label className="ml-auto flex items-center gap-2 text-xs font-black text-slate-600">
          Speed
          <select value={speed} onChange={(event) => setSpeed(event.target.value as Speed)} className="rounded-xl border border-slate-200 bg-white px-2 py-2">
            {Object.keys(rateMap).map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-500">
        Narration language: {languageCodes[language] ? language : "English fallback"}.
      </p>
    </div>
  );
}
