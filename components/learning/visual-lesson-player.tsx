"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, BookOpen, CheckCircle2, CircleHelp, Lightbulb, Pause, Play, PlusCircle, RefreshCw, RotateCcw, Settings, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { AudioNarrationControls } from "./audio-narration-controls";
import type { LearningChapter } from "@/lib/learning/chapter-catalog";
import type { VisualLesson, VisualLessonScene, VisualLessonSlide, VisualLessonStep } from "@/lib/types";

type CoachMode = "again" | "example" | "question" | "practice";
type VoiceTone = "Slow and clear" | "Normal" | "Story teacher" | "Exam teacher";

const voiceToneSettings: Record<VoiceTone, { rate: number; pitch: number }> = {
  "Slow and clear": { rate: 0.82, pitch: 1.05 },
  Normal: { rate: 0.95, pitch: 1.03 },
  "Story teacher": { rate: 0.88, pitch: 1.12 },
  "Exam teacher": { rate: 0.92, pitch: 1 },
};

type SceneEntry = {
  scene: VisualLessonScene;
  conceptNo: number;
  conceptTitle: string;
  sceneNo: number;
};

type VisualLessonPlayerProps = {
  lesson: VisualLesson;
  grade: string;
  board: string;
  subject: string;
  chapter: LearningChapter;
  selectedConcept: string;
  source: string;
};

export function VisualLessonPlayer(props: VisualLessonPlayerProps) {
  if (props.lesson.scenes?.length || props.lesson.chapterConcepts?.some((concept) => concept.scenes.length)) {
    return <AnimatedVisualTeacher {...props} />;
  }
  return <SlideLessonPlayer {...props} />;
}

function SlideLessonPlayer({
  lesson,
  grade,
  board,
  subject,
  chapter,
  selectedConcept,
  source,
}: VisualLessonPlayerProps) {
  const hasStructuredSlides = Boolean(lesson.slides?.length);
  const concepts = useMemo(
    () => (selectedConcept === "All Concepts" && !hasStructuredSlides ? chapter.concepts : [selectedConcept === "All Concepts" ? "All Concepts" : selectedConcept]),
    [chapter.concepts, hasStructuredSlides, selectedConcept]
  );
  const [conceptIndex, setConceptIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [autoRead, setAutoRead] = useState(false);
  const [coachMode, setCoachMode] = useState<CoachMode | null>(null);
  const concept = concepts[conceptIndex] || chapter.name;
  const slides = useMemo(() => buildSlides(concept, lesson), [concept, lesson]);
  const safeSlideIndex = Math.min(slideIndex, Math.max(0, slides.length - 1));
  const slide = slides[safeSlideIndex] || slides[0];
  const progress = Math.round(((conceptIndex * slides.length + safeSlideIndex + 1) / Math.max(1, concepts.length * slides.length)) * 100);
  const narrationText = `${slide.title}. ${slide.teacherScript}`;

  function goNext() {
    setCoachMode(null);
    if (safeSlideIndex < slides.length - 1) {
      setSlideIndex(safeSlideIndex + 1);
      return;
    }
    if (conceptIndex < concepts.length - 1) {
      setConceptIndex(conceptIndex + 1);
      setSlideIndex(0);
    }
  }

  function goBack() {
    setCoachMode(null);
    if (safeSlideIndex > 0) {
      setSlideIndex(safeSlideIndex - 1);
      return;
    }
    if (conceptIndex > 0) {
      setConceptIndex(conceptIndex - 1);
      setSlideIndex(slides.length - 1);
    }
  }

  return (
    <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-purple-100">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black text-purple-700">Chapter {chapter.number}: {chapter.name}</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">{selectedConcept === "All Concepts" ? "Visual Teacher Mode" : concept}</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">{grade} · {subject} · {board} · Source: {source}</p>
        </div>
        <label className="inline-flex items-center gap-2 rounded-2xl bg-purple-50 px-4 py-2 text-sm font-black text-purple-700">
          <input type="checkbox" checked={autoRead} onChange={(event) => setAutoRead(event.target.checked)} />
          Auto-read slides
        </label>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-purple-600 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-5 grid w-full gap-6 2xl:grid-cols-12">
        <aside className="rounded-2xl bg-slate-50 p-4 2xl:col-span-3">
          <h3 className="text-sm font-black text-slate-700">Lesson path</h3>
          <div className="mt-3 space-y-2">
            {concepts.map((item, index) => (
              <button
                key={item}
                onClick={() => {
                  setConceptIndex(index);
                  setSlideIndex(0);
                  setCoachMode(null);
                }}
                className={`w-full rounded-2xl px-3 py-2 text-left text-sm font-black ${index === conceptIndex ? "bg-purple-600 text-white" : "bg-white text-slate-600"}`}
              >
                {index + 1}. {item}
              </button>
            ))}
          </div>
          <div className="mt-5 space-y-2">
            {slides.map((item, index) => (
              <button
                key={`${item.slideType}-${index}`}
                onClick={() => {
                  setSlideIndex(index);
                  setCoachMode(null);
                }}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-black ${index === safeSlideIndex ? "bg-slate-950 text-white" : "bg-white text-slate-600"}`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-current/10">{index + 1}</span>
                <span className="min-w-0 truncate">{item.title}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-4 2xl:col-span-9">
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-purple-700">{slide.slideType}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">Slide {safeSlideIndex + 1} of {slides.length}</span>
              </div>
              <span className="text-xs font-black uppercase tracking-wide text-slate-400">Mini classroom board</span>
            </div>

            <div className="grid gap-0 xl:grid-cols-12">
              <section className="bg-white p-5 xl:col-span-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                  <BookOpen className="h-4 w-4" /> Teacher narration
                </div>
                <h3 className="mt-4 text-2xl font-black text-slate-950">{slide.title}</h3>
                <p className="mt-3 text-base font-semibold leading-7 text-slate-700">{slide.teacherScript}</p>

                {slide.keyPoints.length > 0 && (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs font-black uppercase tracking-wide text-slate-500">Key points</div>
                    <ul className="mt-3 space-y-2">
                      {slide.keyPoints.map((point) => (
                        <li key={point} className="flex gap-2 text-sm font-bold leading-6 text-slate-700">
                          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-green-600" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(slide.studentQuestion || slide.answer) && (
                  <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    {slide.studentQuestion && <p className="text-sm font-black text-blue-900">{slide.studentQuestion}</p>}
                    {slide.answer && <p className="mt-2 text-sm font-semibold leading-6 text-blue-800">Answer: {slide.answer}</p>}
                  </div>
                )}
              </section>

              <section className="min-h-[420px] bg-gradient-to-br from-emerald-50 via-blue-50 to-amber-50 p-5 xl:col-span-8">
                <VisualBoard slide={slide} />
              </section>
            </div>
          </article>

          <AudioNarrationControls text={narrationText} language="en-IN" autoPlay={autoRead} />

          <div className="flex flex-wrap gap-2">
            <CoachButton mode="again" activeMode={coachMode} onClick={setCoachMode} icon={<RefreshCw className="h-4 w-4" />}>
              Explain again
            </CoachButton>
            <CoachButton mode="example" activeMode={coachMode} onClick={setCoachMode} icon={<PlusCircle className="h-4 w-4" />}>
              Give another example
            </CoachButton>
            <CoachButton mode="question" activeMode={coachMode} onClick={setCoachMode} icon={<CircleHelp className="h-4 w-4" />}>
              Ask me a question
            </CoachButton>
          </div>

          {coachMode && (
            <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4 text-sm font-semibold leading-6 text-purple-900">
              {coachText(coachMode, slide, concept)}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button onClick={goBack} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700">
              <ArrowLeft className="h-4 w-4" /> Previous
            </button>
            <div className="flex flex-wrap gap-2">
              {slides.map((item, index) => (
                <button
                  key={`${item.slideType}-${item.title}-${index}`}
                  onClick={() => {
                    setSlideIndex(index);
                    setCoachMode(null);
                  }}
                  className={`h-3 w-8 rounded-full ${index === safeSlideIndex ? "bg-purple-600" : "bg-slate-200"}`}
                  aria-label={`Go to slide ${index + 1}: ${item.title}`}
                />
              ))}
            </div>
            <button onClick={goNext} className="inline-flex items-center gap-2 rounded-2xl bg-purple-600 px-4 py-3 text-sm font-black text-white">
              Next <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function AnimatedVisualTeacher({ lesson, grade, board, subject, chapter, selectedConcept, source }: VisualLessonPlayerProps) {
  const sceneEntries = useMemo(() => getSceneEntries(lesson), [lesson]);
  const scenes = sceneEntries.map((entry) => entry.scene);
  const conceptGroups = useMemo(() => getConceptGroups(sceneEntries, lesson), [lesson, sceneEntries]);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playRequest, setPlayRequest] = useState(0);
  const [coachMode, setCoachMode] = useState<CoachMode | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState("");
  const [voiceTone, setVoiceTone] = useState<VoiceTone>("Slow and clear");
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState(false);
  const [audioWarning, setAudioWarning] = useState(() =>
    typeof window !== "undefined" && !("speechSynthesis" in window) ? "Browser voice is unavailable. Visual animation will still play." : "",
  );
  const fallbackTimer = useRef<number | undefined>(undefined);
  const safeSceneIndex = Math.min(sceneIndex, Math.max(0, scenes.length - 1));
  const scene = scenes[safeSceneIndex] || scenes[0];
  const sceneEntry = sceneEntries[safeSceneIndex];
  const steps = scene.steps.length ? scene.steps : [{ action: "explain", narration: scene.teacherScript, visual: {} }];
  const safeStepIndex = Math.min(stepIndex, Math.max(0, steps.length - 1));
  const step = steps[safeStepIndex];
  const totalSteps = scenes.reduce((sum, item) => sum + Math.max(1, item.steps.length), 0);
  const completedSteps = scenes.slice(0, safeSceneIndex).reduce((sum, item) => sum + Math.max(1, item.steps.length), 0) + safeStepIndex + 1;
  const progress = Math.round((completedSteps / Math.max(1, totalSteps)) * 100);
  const narrationText = step.narration || scene.teacherScript;
  const selectedVoice = useMemo(() => voices.find((voice) => voice.name === voiceName) || pickPreferredVoice(voices, "en-IN"), [voiceName, voices]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      return;
    }
    const loadVoices = () => {
      const nextVoices = window.speechSynthesis.getVoices();
      setVoices(nextVoices);
      setVoiceName((current) => current || pickPreferredVoice(nextVoices, "en-IN")?.name || "");
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      stopSpeech(false);
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    if (!playing) {
      stopSpeech(false);
      return;
    }
    speakCurrentStep();
    return () => {
      if (fallbackTimer.current) window.clearTimeout(fallbackTimer.current);
    };
    // Speech should restart when the current step changes, voice settings change, or Play is clicked again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, playRequest, safeSceneIndex, safeStepIndex, narrationText, selectedVoice?.name, voiceTone]);

  function speakCurrentStep() {
    stopSpeech(false);
    setAudioWarning("");
    if (!narrationText.trim()) return;
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      setAudioWarning("Browser voice is unavailable. Visual animation will still play.");
      if (autoPlay) {
        fallbackTimer.current = window.setTimeout(() => advanceAfterNarration(), estimateNarrationMs(narrationText, voiceTone));
      }
      return;
    }
    const utterance = new SpeechSynthesisUtterance(toNaturalNarration(narrationText));
    utterance.lang = selectedVoice?.lang || "en-IN";
    utterance.voice = selectedVoice || null;
    utterance.rate = voiceToneSettings[voiceTone].rate;
    utterance.pitch = voiceToneSettings[voiceTone].pitch;
    utterance.onend = () => advanceAfterNarration();
    utterance.onerror = () => {
      setAudioWarning("Voice narration stopped, but the visual lesson can continue.");
      advanceAfterNarration();
    };
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeech(updatePlaying: boolean) {
    if (fallbackTimer.current) window.clearTimeout(fallbackTimer.current);
    fallbackTimer.current = undefined;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    if (updatePlaying) setPlaying(false);
  }

  function advanceAfterNarration() {
    if (!autoPlay) {
      setPlaying(false);
      return;
    }
    moveNext(true);
  }

  function goNextStep() {
    moveNext(autoPlay);
  }

  function moveNext(shouldContinue: boolean) {
    setCoachMode(null);
    if (safeStepIndex < steps.length - 1) {
      setStepIndex(safeStepIndex + 1);
      setPlaying(shouldContinue);
      if (shouldContinue) setPlayRequest((value) => value + 1);
      return;
    }
    if (safeSceneIndex < scenes.length - 1) {
      setSceneIndex(safeSceneIndex + 1);
      setStepIndex(0);
      setPlaying(shouldContinue);
      if (shouldContinue) setPlayRequest((value) => value + 1);
      return;
    }
    setPlaying(false);
    setAutoPlay(false);
  }

  function goPreviousStep() {
    stopSpeech(false);
    setCoachMode(null);
    if (safeStepIndex > 0) {
      setStepIndex(safeStepIndex - 1);
      setPlaying(autoPlay);
      if (autoPlay) setPlayRequest((value) => value + 1);
      return;
    }
    if (safeSceneIndex > 0) {
      const previousScene = scenes[safeSceneIndex - 1];
      setSceneIndex(safeSceneIndex - 1);
      setStepIndex(Math.max(0, previousScene.steps.length - 1));
      setPlaying(autoPlay);
      if (autoPlay) setPlayRequest((value) => value + 1);
    }
  }

  function replayScene() {
    stopSpeech(false);
    setCoachMode(null);
    setStepIndex(0);
    setPlaying(true);
    setPlayRequest((value) => value + 1);
  }

  function playCurrentStep() {
    setPlaying(true);
    setPlayRequest((value) => value + 1);
  }

  function pauseLesson() {
    setAutoPlay(false);
    stopSpeech(true);
  }

  function chooseScene(index: number, shouldPlay = false) {
    stopSpeech(false);
    setCoachMode(null);
    setSceneIndex(index);
    setStepIndex(0);
    setPlaying(shouldPlay || autoPlay);
    if (shouldPlay || autoPlay) setPlayRequest((value) => value + 1);
  }

  function toggleAutoPlay(checked: boolean) {
    setAutoPlay(checked);
    if (checked) {
      setPlaying(true);
      setPlayRequest((value) => value + 1);
    } else {
      stopSpeech(true);
    }
  }

  return (
    <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-purple-100">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black text-purple-700">Chapter {chapter.number}: {chapter.name}</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">{lesson.lessonScope === "chapter" ? "Animated Chapter Teacher" : "Visual Teacher Mode"}</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">{grade} · {subject} · {board} · {lesson.lessonScope === "chapter" ? "All Concepts" : selectedConcept} · Source: {source}</p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setVoiceSettingsOpen((value) => !value)}
            className="inline-flex items-center gap-2 rounded-2xl bg-purple-50 px-4 py-2 text-sm font-black text-purple-700"
          >
            <Settings className="h-4 w-4" /> Voice settings
          </button>
          {voiceSettingsOpen && (
            <div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200">
              <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-slate-500">
                Voice
                <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold normal-case text-slate-800" value={voiceName} onChange={(event) => setVoiceName(event.target.value)}>
                  <option value="">Best available voice</option>
                  {voices.map((voice) => (
                    <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-3 grid gap-1 text-xs font-black uppercase tracking-wide text-slate-500">
                Speed
                <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold normal-case text-slate-800" value={voiceTone} onChange={(event) => setVoiceTone(event.target.value as VoiceTone)}>
                  {Object.keys(voiceToneSettings).map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">Play uses this voice automatically for each visual step.</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-purple-600 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl bg-slate-50 p-4">
          <h3 className="text-sm font-black text-slate-700">{lesson.lessonScope === "chapter" ? "Chapter path" : "Animated scenes"}</h3>
          <div className="mt-3 space-y-2">
            {conceptGroups.map((group) => (
              <button
                key={`${group.conceptNo}-${group.conceptTitle}`}
                onClick={() => chooseScene(group.startIndex)}
                className={`w-full rounded-2xl px-3 py-3 text-left text-sm font-black ${safeSceneIndex >= group.startIndex && safeSceneIndex < group.startIndex + group.count ? "bg-purple-600 text-white" : "bg-white text-slate-600"}`}
              >
                <span className="block text-xs opacity-75">{group.conceptNo <= 0 ? "Scene" : `Concept ${group.conceptNo}`}</span>
                {group.conceptTitle}
              </button>
            ))}
          </div>
          <div className="mt-5 space-y-2">
            {sceneEntries.map((entry, index) => (
              <button
                key={`${entry.scene.title}-${index}`}
                onClick={() => chooseScene(index)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-black ${index === safeSceneIndex ? "bg-slate-950 text-white" : "bg-white text-slate-600"}`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-current/10">{entry.sceneNo}</span>
                <span className="min-w-0 truncate">{entry.scene.title}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-4">
          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-900 px-5 py-4 text-white">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-purple-200">{sceneEntry?.conceptTitle || scene.sceneType}</p>
                <h3 className="mt-1 text-xl font-black">{scene.title}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">Scene {safeSceneIndex + 1} of {scenes.length}</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">Step {safeStepIndex + 1} of {steps.length}</span>
              </div>
            </div>

            <div className="grid gap-0 2xl:grid-cols-[1fr_320px]">
              <section className="min-h-[500px] bg-gradient-to-br from-slate-900 via-slate-800 to-purple-950 p-5">
                <AnimatedSceneBoard key={`${safeSceneIndex}-${safeStepIndex}-${playRequest}`} scene={scene} stepIndex={safeStepIndex} />
              </section>
              <section className="bg-white p-5">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                  <Volume2 className="h-4 w-4" /> Synced teacher narration
                </div>
                <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">{scene.teacherScript}</p>
                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-black uppercase tracking-wide text-slate-500">Current step voice</div>
                  <p className="mt-2 text-lg font-black leading-7 text-slate-950">{step.narration}</p>
                </div>
                <div className="mt-4 space-y-2">
                  {steps.map((item, index) => (
                    <button
                      key={`${item.action}-${index}`}
                      onClick={() => {
                        stopSpeech(false);
                        setStepIndex(index);
                        setCoachMode(null);
                        setPlaying(autoPlay);
                        if (autoPlay) setPlayRequest((value) => value + 1);
                      }}
                      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-black ${index === safeStepIndex ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"}`}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-current/10">{index + 1}</span>
                      {item.action}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </article>

          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-purple-100">
            <button onClick={playCurrentStep} className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-black text-white">
              <Play className="h-4 w-4" /> Play
            </button>
            <button onClick={pauseLesson} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-700">
              <Pause className="h-4 w-4" /> Pause
            </button>
            <button onClick={replayScene} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-700">
              <RotateCcw className="h-4 w-4" /> Replay
            </button>
            <button onClick={goPreviousStep} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-700">
              <SkipBack className="h-4 w-4" /> Previous step
            </button>
            <button onClick={goNextStep} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-sm font-black text-white">
              Next step <SkipForward className="h-4 w-4" />
            </button>
            <label className="ml-auto inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700">
              <input type="checkbox" checked={autoPlay} onChange={(event) => toggleAutoPlay(event.target.checked)} />
              Auto-play visual lesson
            </label>
          </div>

          {audioWarning && (
            <div className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{audioWarning}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <CoachButton mode="again" activeMode={coachMode} onClick={setCoachMode} icon={<RefreshCw className="h-4 w-4" />}>
              Explain again
            </CoachButton>
            <CoachButton mode="example" activeMode={coachMode} onClick={setCoachMode} icon={<Lightbulb className="h-4 w-4" />}>
              Show another visual
            </CoachButton>
            <CoachButton mode="question" activeMode={coachMode} onClick={setCoachMode} icon={<CircleHelp className="h-4 w-4" />}>
              Ask me a question
            </CoachButton>
            <CoachButton mode="practice" activeMode={coachMode} onClick={setCoachMode} icon={<PlusCircle className="h-4 w-4" />}>
              Practice now
            </CoachButton>
          </div>

          {coachMode && (
            <div className="rounded-2xl border border-purple-100 bg-purple-50 p-4 text-sm font-semibold leading-6 text-purple-900">
              {animatedCoachText(coachMode, scene, step)}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function getSceneEntries(lesson: VisualLesson): SceneEntry[] {
  const grouped = lesson.chapterConcepts?.flatMap((concept) =>
    concept.scenes.map((scene, index) => ({
      scene,
      conceptNo: concept.conceptNo,
      conceptTitle: concept.conceptTitle,
      sceneNo: index + 1,
    })),
  );
  if (grouped?.length) return grouped;
  return (lesson.scenes || []).map((scene, index) => ({
    scene,
    conceptNo: 0,
    conceptTitle: "Animated scene",
    sceneNo: index + 1,
  }));
}

function getConceptGroups(sceneEntries: SceneEntry[], lesson: VisualLesson) {
  if (lesson.chapterConcepts?.length) {
    let startIndex = 0;
    return lesson.chapterConcepts.map((concept) => {
      const count = Math.max(1, concept.scenes.length);
      const group = {
        conceptNo: concept.conceptNo,
        conceptTitle: concept.conceptTitle,
        startIndex,
        count,
      };
      startIndex += count;
      return group;
    });
  }

  return sceneEntries.map((entry, index) => ({
    conceptNo: index + 1,
    conceptTitle: entry.scene.title,
    startIndex: index,
    count: 1,
  }));
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

function estimateNarrationMs(text: string, tone: VoiceTone) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const wordsPerMinute = 145 * voiceToneSettings[tone].rate;
  return Math.max(2400, Math.round((words / wordsPerMinute) * 60_000) + 600);
}

function AnimatedSceneBoard({ scene, stepIndex }: { scene: VisualLessonScene; stepIndex: number }) {
  const visual = mergeStepVisuals(scene.steps, stepIndex);
  return (
    <div className="flex min-h-[460px] items-center justify-center rounded-3xl border border-white/10 bg-white/95 p-5 shadow-2xl">
      {scene.sceneType === "fraction-circle" && <FractionCircleAnimator visual={visual} />}
      {scene.sceneType === "fraction-bar" && <FractionBarAnimator visual={visual} />}
      {scene.sceneType === "number-line" && <AnimatedNumberLine visual={visual} />}
      {scene.sceneType === "comparison-board" && <ComparisonAnimator visual={visual} />}
      {scene.sceneType === "formula-board" && <FormulaBoardAnimator scene={scene} stepIndex={stepIndex} visual={visual} />}
      {scene.sceneType === "table-board" && <TableBoardAnimator visual={visual} />}
      {scene.sceneType === "particle-motion-board" && <ParticleMotionBoardAnimator visual={visual} />}
      {scene.sceneType === "states-of-matter-board" && <StatesOfMatterBoardAnimator visual={visual} />}
      {scene.sceneType === "heating-curve-board" && <HeatingCurveBoardAnimator visual={visual} />}
      {scene.sceneType === "evaporation-board" && <EvaporationBoardAnimator visual={visual} />}
      {scene.sceneType === "force-arrows" && <ForceArrowsAnimator visual={visual} />}
      {scene.sceneType === "motion-track" && <MotionTrackAnimator visual={visual} />}
      {scene.sceneType === "diagram-label" && <DiagramLabelAnimator visual={visual} />}
      {scene.sceneType === "quiz-visual" && <QuizSceneAnimator scene={scene} visual={visual} />}
    </div>
  );
}

function CoachButton({
  mode,
  activeMode,
  onClick,
  icon,
  children,
}: {
  mode: CoachMode;
  activeMode: CoachMode | null;
  onClick: (mode: CoachMode) => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      onClick={() => onClick(mode)}
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ${activeMode === mode ? "bg-purple-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}
    >
      {icon}
      {children}
    </button>
  );
}

function VisualBoard({ slide }: { slide: VisualLessonSlide }) {
  return (
    <div className="h-full rounded-2xl border border-white/80 bg-white/85 p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-amber-500" />
        <span className="text-xs font-black uppercase tracking-wide text-slate-500">{slide.visualType}</span>
      </div>
      {slide.visualType === "two-column-card" && <TwoColumnVisual data={slide.visualData} />}
      {slide.visualType === "formula-card" && <FormulaVisual data={slide.visualData} />}
      {slide.visualType === "comparison-table" && <ComparisonTableVisual data={slide.visualData} />}
      {slide.visualType === "number-line" && <NumberLineVisual data={slide.visualData} />}
      {slide.visualType === "quiz-card" && <QuizVisual key={slide.title} data={slide.visualData} answer={slide.answer} />}
      {slide.visualType === "example-card" && <ExampleVisual data={slide.visualData} />}
      {slide.visualType === "mistake-card" && <MistakeVisual data={slide.visualData} />}
      {slide.visualType === "summary-card" && <SummaryVisual data={slide.visualData} fallbackPoints={slide.keyPoints} />}
    </div>
  );
}

function TwoColumnVisual({ data }: { data: Record<string, unknown> }) {
  const leftExamples = getStringArray(data, "leftExamples");
  const rightExamples = getStringArray(data, "rightExamples");
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
      <ColumnCard title={getString(data, "leftTitle", "Can be written this way")} items={leftExamples} tone="green" />
      <div className="hidden items-center justify-center md:flex">
        <ArrowRight className="h-8 w-8 text-slate-400" />
      </div>
      <ColumnCard title={getString(data, "rightTitle", "Cannot be written this way")} items={rightExamples} tone="amber" />
    </div>
  );
}

function ColumnCard({ title, items, tone }: { title: string; items: string[]; tone: "green" | "amber" }) {
  const toneClass = tone === "green" ? "border-green-200 bg-green-50 text-green-900" : "border-amber-200 bg-amber-50 text-amber-950";
  return (
    <div className={`rounded-2xl border p-5 ${toneClass}`}>
      <h4 className="text-lg font-black">{title}</h4>
      <div className="mt-4 grid gap-2">
        {items.map((item) => (
          <div key={item} className="rounded-xl bg-white px-4 py-3 text-center text-xl font-black shadow-sm">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function FormulaVisual({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <div className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
        <div className="text-xs font-black uppercase tracking-wide text-white/60">Formula or rule</div>
        <div className="mt-4 break-words text-3xl font-black leading-tight">{getString(data, "formula", "rule")}</div>
      </div>
      <div className="grid gap-3">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
          <div className="text-xs font-black uppercase tracking-wide text-green-700">Works for</div>
          <p className="mt-2 text-sm font-bold leading-6 text-green-900">{getString(data, "validFor", "Examples that match the rule.")}</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="text-xs font-black uppercase tracking-wide text-red-700">Does not work for</div>
          <p className="mt-2 text-sm font-bold leading-6 text-red-900">{getString(data, "notValidFor", "Examples that break the rule.")}</p>
        </div>
      </div>
    </div>
  );
}

function ComparisonTableVisual({ data }: { data: Record<string, unknown> }) {
  const headers = getStringArray(data, "headers");
  const rows = getRows(data, "rows");
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead className="bg-slate-950 text-white">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 text-xs font-black uppercase tracking-wide">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${row.join("-")}-${rowIndex}`} className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                {row.map((cell, cellIndex) => (
                  <td key={`${cell}-${cellIndex}`} className="border-t border-slate-100 px-4 py-3 text-sm font-bold leading-6 text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NumberLineVisual({ data }: { data: Record<string, unknown> }) {
  const min = getNumber(data, "min", 0);
  const max = getNumber(data, "max", 3);
  const markers = getMarkers(data);
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="relative h-44">
        <div className="absolute left-4 right-4 top-20 h-1 rounded-full bg-slate-300" />
        <div className="absolute left-4 top-[72px] h-5 w-1 rounded-full bg-slate-500" />
        <div className="absolute right-4 top-[72px] h-5 w-1 rounded-full bg-slate-500" />
        <div className="absolute left-4 top-28 text-sm font-black text-slate-600">{min}</div>
        <div className="absolute right-4 top-28 text-sm font-black text-slate-600">{max}</div>
        {markers.map((marker) => {
          const percent = clamp(((marker.value - min) / Math.max(0.001, max - min)) * 100, 2, 98);
          return (
            <div key={`${marker.label}-${marker.value}`} className="absolute top-8 -translate-x-1/2" style={{ left: `${percent}%` }}>
              <div className="mx-auto h-16 w-1 rounded-full bg-purple-600" />
              <div className="mt-2 max-w-28 rounded-xl bg-purple-600 px-2 py-1 text-center text-xs font-black leading-4 text-white shadow-sm">{marker.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuizVisual({ data, answer }: { data: Record<string, unknown>; answer?: string }) {
  const [selected, setSelected] = useState("");
  const options = getStringArray(data, "options");
  const correctAnswer = getString(data, "correctAnswer", answer || options[0] || "");
  const explanation = getString(data, "explanation", answer || "");
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
      <h4 className="text-xl font-black text-blue-950">{getString(data, "question", "Quick check")}</h4>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const isPicked = selected === option;
          const isCorrect = option === correctAnswer;
          const showState = Boolean(selected);
          const stateClass = showState && isCorrect ? "border-green-400 bg-green-100 text-green-900" : showState && isPicked ? "border-red-300 bg-red-50 text-red-900" : "border-white bg-white text-slate-800";
          return (
            <button key={option} onClick={() => setSelected(option)} className={`rounded-2xl border px-4 py-3 text-left text-sm font-black shadow-sm ${stateClass}`}>
              {option}
            </button>
          );
        })}
      </div>
      {selected && (
        <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-blue-950">
          {selected === correctAnswer ? "Correct. " : `Good try. Correct answer: ${correctAnswer}. `}
          {explanation}
        </div>
      )}
    </div>
  );
}

function ExampleVisual({ data }: { data: Record<string, unknown> }) {
  const examples = getStringArray(data, "examples");
  const nonExamples = getStringArray(data, "nonExamples");
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
        <h4 className="text-lg font-black text-green-900">{getString(data, "examplesTitle", "Examples")}</h4>
        <div className="mt-3 flex flex-wrap gap-2">
          {examples.map((example) => (
            <span key={example} className="rounded-xl bg-white px-3 py-2 text-sm font-black text-green-900 shadow-sm">
              {example}
            </span>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h4 className="text-lg font-black text-amber-950">{getString(data, "nonExamplesTitle", "Non-examples")}</h4>
        <div className="mt-3 flex flex-wrap gap-2">
          {nonExamples.map((example) => (
            <span key={example} className="rounded-xl bg-white px-3 py-2 text-sm font-black text-amber-950 shadow-sm">
              {example}
            </span>
          ))}
        </div>
      </div>
      {getString(data, "reason") && <p className="rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-slate-700 shadow-sm lg:col-span-2">{getString(data, "reason")}</p>}
    </div>
  );
}

function MistakeVisual({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <div className="text-xs font-black uppercase tracking-wide text-red-700">Mistake</div>
        <p className="mt-2 text-lg font-black leading-7 text-red-950">{getString(data, "mistake", "Common wrong idea")}</p>
      </div>
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
        <div className="text-xs font-black uppercase tracking-wide text-green-700">Correction</div>
        <p className="mt-2 text-lg font-black leading-7 text-green-950">{getString(data, "correction", "Correct the idea using the definition.")}</p>
      </div>
      {getString(data, "example") && <p className="rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-slate-700 shadow-sm lg:col-span-2">{getString(data, "example")}</p>}
    </div>
  );
}

function SummaryVisual({ data, fallbackPoints }: { data: Record<string, unknown>; fallbackPoints: string[] }) {
  const points = getStringArray(data, "keyTakeaways");
  const takeaways = points.length ? points : fallbackPoints;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h4 className="text-xl font-black text-slate-950">Teacher board summary</h4>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {takeaways.map((point) => (
          <div key={point} className="rounded-2xl bg-slate-50 p-4 text-sm font-black leading-6 text-slate-700">
            {point}
          </div>
        ))}
      </div>
      {getString(data, "memoryLine") && <p className="mt-4 rounded-2xl bg-purple-50 p-4 text-sm font-black leading-6 text-purple-900">{getString(data, "memoryLine")}</p>}
    </div>
  );
}

function FractionCircleAnimator({ visual }: { visual: Record<string, unknown> }) {
  const parts = Math.max(1, Math.round(getNumber(visual, "parts", getNumber(visual, "totalParts", 1))));
  const highlighted = clamp(Math.round(getNumber(visual, "highlightedParts", 0)), 0, parts);
  const highlightedDeg = (highlighted / parts) * 360;
  const sliceDeg = 360 / parts;
  const background =
    parts === 1
      ? "radial-gradient(circle at 35% 30%, #fff7ed 0 12%, #fdba74 13% 100%)"
      : `repeating-conic-gradient(from -90deg, rgba(15,23,42,.38) 0deg 1.5deg, transparent 1.5deg ${sliceDeg}deg), conic-gradient(from -90deg, #a855f7 0deg ${highlightedDeg}deg, #fff7ed ${highlightedDeg}deg 360deg)`;
  return (
    <div className="grid w-full max-w-3xl gap-6 lg:grid-cols-[1fr_220px] lg:items-center">
      <div className="flex justify-center">
        <div className="relative h-72 w-72 rounded-full border-8 border-amber-300 shadow-2xl transition-all duration-700 ease-out" style={{ background }}>
          <div className="absolute inset-8 rounded-full border border-white/60" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-white/90 px-4 py-2 text-xl font-black text-slate-950 shadow-sm">{getString(visual, "label", parts === 1 ? "1 whole" : `${parts} equal parts`)}</span>
          </div>
        </div>
      </div>
      <FractionNotation visual={visual} highlighted={highlighted} total={parts} />
    </div>
  );
}

function FractionBarAnimator({ visual }: { visual: Record<string, unknown> }) {
  const parts = Math.max(1, Math.round(getNumber(visual, "parts", getNumber(visual, "totalParts", 1))));
  const highlighted = clamp(Math.round(getNumber(visual, "highlightedParts", 0)), 0, parts);
  return (
    <div className="w-full max-w-4xl">
      <div className="rounded-3xl bg-slate-100 p-5 shadow-inner">
        <div className="grid h-28 overflow-hidden rounded-2xl border-4 border-slate-800 bg-white" style={{ gridTemplateColumns: `repeat(${parts}, minmax(0, 1fr))` }}>
          {Array.from({ length: parts }).map((_, index) => (
            <div
              key={index}
              className={`border-r-2 border-slate-800 transition-all duration-700 last:border-r-0 ${index < highlighted ? "bg-purple-500" : "bg-amber-50"}`}
              style={{ transform: index < highlighted ? "scaleY(1)" : "scaleY(.92)" }}
            />
          ))}
        </div>
        <div className="mt-3 flex justify-between text-sm font-black text-slate-500">
          {Array.from({ length: parts }).map((_, index) => (
            <span key={index}>{index + 1}</span>
          ))}
        </div>
      </div>
      <div className="mt-5 flex justify-center">
        <FractionNotation visual={visual} highlighted={highlighted} total={parts} />
      </div>
    </div>
  );
}

function FractionNotation({ visual, highlighted, total }: { visual: Record<string, unknown>; highlighted: number; total: number }) {
  const fraction = getString(visual, "fraction", highlighted > 0 ? `${highlighted}/${total}` : "");
  if (!fraction) return null;
  const [top = String(highlighted), bottom = String(total)] = fraction.split("/");
  return (
    <div className="rounded-3xl border border-purple-100 bg-white p-5 text-center shadow-sm">
      <div className="text-xs font-black uppercase tracking-wide text-purple-600">Fraction</div>
      <div className="mt-3 inline-grid min-w-24 place-items-center text-slate-950">
        <div className="text-5xl font-black leading-none text-purple-700">{top}</div>
        <div className="my-2 h-1 w-full rounded-full bg-slate-950" />
        <div className="text-5xl font-black leading-none">{bottom}</div>
      </div>
      <div className="mt-4 grid gap-2 text-xs font-black text-slate-600">
        <span>{getString(visual, "numeratorLabel", "selected parts")}</span>
        <span>{getString(visual, "denominatorLabel", "total equal parts")}</span>
      </div>
    </div>
  );
}

function AnimatedNumberLine({ visual }: { visual: Record<string, unknown> }) {
  const min = getNumber(visual, "min", 0);
  const max = getNumber(visual, "max", 2);
  const markers = getMarkers(visual);
  return (
    <div className="w-full max-w-4xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <div className="relative h-52">
        <div className="absolute left-4 right-4 top-24 h-2 rounded-full bg-slate-300" />
        <div className="absolute left-4 top-[86px] h-9 w-2 rounded-full bg-slate-700" />
        <div className="absolute right-4 top-[86px] h-9 w-2 rounded-full bg-slate-700" />
        <div className="absolute left-4 top-36 text-lg font-black text-slate-600">{min}</div>
        <div className="absolute right-4 top-36 text-lg font-black text-slate-600">{max}</div>
        {markers.map((marker) => {
          const percent = clamp(((marker.value - min) / Math.max(0.001, max - min)) * 100, 2, 98);
          return (
            <div key={`${marker.label}-${marker.value}`} className="absolute top-8 -translate-x-1/2 transition-all duration-700 ease-out" style={{ left: `${percent}%` }}>
              <div className="mx-auto h-20 w-2 rounded-full bg-purple-600 shadow-lg shadow-purple-200" />
              <div className="mt-2 max-w-36 rounded-2xl bg-purple-600 px-3 py-2 text-center text-sm font-black leading-5 text-white shadow-sm">{marker.label}</div>
            </div>
          );
        })}
      </div>
      {getString(visual, "label") && <p className="text-center text-lg font-black text-purple-700">{getString(visual, "label")}</p>}
    </div>
  );
}

function ComparisonAnimator({ visual }: { visual: Record<string, unknown> }) {
  const leftLabel = getString(visual, "leftLabel", "First idea");
  const rightLabel = getString(visual, "rightLabel", "Second idea");
  const leftValue = clamp(getNumber(visual, "leftValue", parseFractionValue(leftLabel, 0.5)), 0.05, 1);
  const rightValue = clamp(getNumber(visual, "rightValue", parseFractionValue(rightLabel, 0.25)), 0.05, 1);
  const winner = getString(visual, "highlightWinner", leftValue >= rightValue ? "left" : "right");
  return (
    <div className="w-full max-w-5xl">
      <div className="grid gap-5 md:grid-cols-2">
        <ComparisonSide label={leftLabel} value={leftValue} items={getStringArray(visual, "leftItems")} active={winner === "left"} />
        <ComparisonSide label={rightLabel} value={rightValue} items={getStringArray(visual, "rightItems")} active={winner === "right"} />
      </div>
      {getString(visual, "comparison") && <p className="mt-5 rounded-2xl bg-purple-50 p-4 text-center text-xl font-black text-purple-900">{getString(visual, "comparison")}</p>}
    </div>
  );
}

function ComparisonSide({ label, value, items, active }: { label: string; value: number; items: string[]; active: boolean }) {
  return (
    <div className={`rounded-3xl border p-5 transition-all duration-500 ${active ? "border-purple-300 bg-purple-50 shadow-lg" : "border-slate-200 bg-white"}`}>
      <div className="text-center text-3xl font-black text-slate-950">{label}</div>
      <div className="mt-5 h-28 rounded-2xl bg-slate-100 p-3">
        <div className="h-full rounded-xl bg-purple-500 transition-all duration-700" style={{ width: `${value * 100}%` }} />
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-700 shadow-sm">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function FormulaBoardAnimator({ scene, stepIndex, visual }: { scene: VisualLessonScene; stepIndex: number; visual: Record<string, unknown> }) {
  const visibleSteps = scene.steps.slice(0, stepIndex + 1);
  const lines = getStringArray(visual, "lines");
  return (
    <div className="w-full max-w-4xl rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
      <div className="text-xs font-black uppercase tracking-wide text-purple-200">Smart board writing</div>
      <div className="mt-5 rounded-2xl bg-white/10 p-5 text-4xl font-black leading-tight text-amber-200">{getString(visual, "formula", lines[0] || scene.title)}</div>
      <div className="mt-5 grid gap-3">
        {visibleSteps.map((item, index) => (
          <div key={`${item.action}-${index}`} className="rounded-2xl bg-white p-4 text-base font-black leading-6 text-slate-900 transition-all duration-500">
            {getStringArray(item.visual, "lines").join("  ") || item.narration}
          </div>
        ))}
      </div>
    </div>
  );
}

function TableBoardAnimator({ visual }: { visual: Record<string, unknown> }) {
  const headers = getStringArray(visual, "headers");
  const rows = getRows(visual, "rows");
  return (
    <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-left">
        <thead className="bg-slate-950 text-white">
          <tr>
            {(headers.length ? headers : ["Step", "Idea", "Meaning"]).map((header) => (
              <th key={header} className="px-4 py-3 text-sm font-black uppercase tracking-wide">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${row.join("-")}-${rowIndex}`} className="border-t border-slate-100 transition-colors duration-300">
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`} className="px-4 py-4 text-base font-bold leading-6 text-slate-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ParticleMotionBoardAnimator({ visual }: { visual: Record<string, unknown> }) {
  const state = getString(visual, "state", "gas");
  const particles = clamp(Math.round(getNumber(visual, "particles", 18)), 6, 32);
  const guestParticles = clamp(Math.round(getNumber(visual, "guestParticles", 0)), 0, 12);
  const motion = getString(visual, "motion", state === "gas" ? "fast" : state === "liquid" ? "slow" : "still");
  const attraction = getString(visual, "attraction", "");
  const particleClass = motion === "fast" ? "animate-bounce" : motion === "medium" || motion === "slow" ? "animate-pulse" : "";

  return (
    <div className="grid w-full max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center">
      <div className="relative h-96 overflow-hidden rounded-3xl bg-slate-950 shadow-inner ring-1 ring-slate-200">
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-blue-500/20 to-transparent" />
        {Array.from({ length: particles }).map((_, index) => {
          const position = particlePosition(index, particles, state);
          return (
            <span
              key={index}
              className={`absolute h-5 w-5 rounded-full bg-purple-400 shadow-lg shadow-purple-500/30 transition-all duration-700 ${particleClass}`}
              style={{ left: `${position.x}%`, top: `${position.y}%`, animationDelay: `${(index % 5) * 120}ms` }}
            />
          );
        })}
        {Array.from({ length: guestParticles }).map((_, index) => {
          const position = particlePosition(index + 7, Math.max(guestParticles, 8), "liquid");
          return (
            <span
              key={`guest-${index}`}
              className="absolute h-4 w-4 rounded-full bg-amber-300 shadow-lg shadow-amber-400/40 transition-all duration-700"
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
            />
          );
        })}
        {Boolean(visual.showBonds) && <div className="absolute inset-8 rounded-3xl border-2 border-dashed border-purple-300/30" />}
        <div className="absolute left-5 top-5 rounded-2xl bg-white/90 px-4 py-2 text-sm font-black uppercase tracking-wide text-slate-900">
          {getString(visual, "label", state)}
        </div>
      </div>
      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="text-xs font-black uppercase tracking-wide text-purple-600">Particle board</div>
        <div className="mt-4 grid gap-3 text-sm font-black text-slate-700">
          <InfoPill label="State" value={state} />
          <InfoPill label="Motion" value={motion} />
          {attraction && <InfoPill label="Attraction" value={attraction} />}
          {getString(visual, "temperature") && <InfoPill label="Temperature" value={getString(visual, "temperature")} />}
        </div>
      </div>
    </div>
  );
}

function StatesOfMatterBoardAnimator({ visual }: { visual: Record<string, unknown> }) {
  const activeState = getString(visual, "activeState", "solid");
  return (
    <div className="w-full max-w-6xl">
      <div className="grid gap-4 lg:grid-cols-3">
        <StateCard state="solid" label={getString(visual, "solidLabel", "solid")} description="Fixed shape, fixed volume, tightly packed particles" active={activeState === "solid"} />
        <StateCard state="liquid" label={getString(visual, "liquidLabel", "liquid")} description="Fixed volume, takes container shape, particles slide" active={activeState === "liquid"} />
        <StateCard state="gas" label={getString(visual, "gasLabel", "gas")} description="No fixed shape or volume, particles far apart" active={activeState === "gas"} />
      </div>
    </div>
  );
}

function HeatingCurveBoardAnimator({ visual }: { visual: Record<string, unknown> }) {
  const activeIndex = clamp(Math.round(getNumber(visual, "activeIndex", 0)), 0, 3);
  const labels = getStringArray(visual, "labels");
  const stages = [
    { title: "Ice", subtitle: "solid", color: "bg-blue-100 text-blue-800" },
    { title: "Water", subtitle: "liquid", color: "bg-cyan-100 text-cyan-800" },
    { title: "Steam", subtitle: "gas", color: "bg-amber-100 text-amber-800" },
    { title: "Surface vapour", subtitle: "evaporation", color: "bg-purple-100 text-purple-800" },
  ];
  return (
    <div className="w-full max-w-5xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-3 md:grid-cols-4">
        {stages.map((stage, index) => (
          <div key={stage.title} className={`rounded-2xl p-4 text-center transition-all duration-500 ${index === activeIndex ? `${stage.color} scale-[1.03] shadow-lg` : "bg-slate-50 text-slate-500"}`}>
            <div className="text-xl font-black">{stage.title}</div>
            <div className="mt-1 text-xs font-black uppercase tracking-wide">{stage.subtitle}</div>
          </div>
        ))}
      </div>
      <div className="relative mt-8 h-44 rounded-3xl bg-slate-50 p-6">
        <div className="absolute bottom-8 left-8 right-8 h-1 rounded-full bg-slate-300" />
        <div className="absolute bottom-8 left-8 h-24 w-1 rounded-full bg-slate-300" />
        {[0, 1, 2, 3].map((point) => (
          <div
            key={point}
            className={`absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-700 ${point <= activeIndex ? "bg-purple-600 shadow-lg shadow-purple-200" : "bg-slate-300"}`}
            style={{ left: `${18 + point * 25}%`, bottom: `${16 + point * 16}%` }}
          />
        ))}
        {Boolean(visual.plateau) && <div className="absolute left-[31%] top-[62px] h-2 w-[22%] rounded-full bg-amber-400" />}
        <div className="absolute left-6 top-5 rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-800">{getString(visual, "label", getString(visual, "phase", "heating"))}</div>
      </div>
      {labels.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {labels.map((label) => (
            <span key={label} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function EvaporationBoardAnimator({ visual }: { visual: Record<string, unknown> }) {
  const mode = getString(visual, "mode", "evaporation");
  const vaporParticles = clamp(Math.round(getNumber(visual, "vaporParticles", 6)), 1, 16);
  const isSublimation = mode === "sublimation";
  return (
    <div className="relative h-[420px] w-full max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-b from-sky-100 to-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="absolute left-8 top-8 rounded-2xl bg-white/90 px-4 py-2 text-sm font-black text-slate-800">
        {getString(visual, "factor", getString(visual, "label", isSublimation ? "sublimation" : "evaporation"))}
      </div>
      {Boolean(visual.wind) && <div className="absolute right-8 top-20 h-3 w-40 rounded-full bg-cyan-400 after:absolute after:right-[-2px] after:top-1/2 after:h-7 after:w-7 after:-translate-y-1/2 after:rotate-45 after:border-r-8 after:border-t-8 after:border-cyan-400" />}
      {Boolean(visual.heat) && <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 gap-3 text-4xl font-black text-amber-500">↑ ↑ ↑</div>}
      <div className={`absolute bottom-20 left-1/2 -translate-x-1/2 ${isSublimation ? "h-20 w-56 rounded-3xl bg-violet-200 text-violet-950" : `${Boolean(visual.wideSurface) ? "h-20 w-[520px]" : "h-20 w-96"} rounded-[50%] bg-blue-400 text-blue-950`} flex items-center justify-center text-lg font-black shadow-xl transition-all duration-700`}>
        {isSublimation ? getString(visual, "solidLabel", "solid") : "water surface"}
      </div>
      {Array.from({ length: vaporParticles }).map((_, index) => (
        <span
          key={index}
          className="absolute h-4 w-4 rounded-full bg-white shadow-lg ring-2 ring-cyan-200 transition-all duration-700"
          style={{ left: `${22 + ((index * 13) % 56)}%`, bottom: `${150 + ((index * 29) % 190)}px` }}
        />
      ))}
      <div className="absolute right-8 bottom-8 rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-800">
        {getString(visual, "vaporLabel", "vapour particles escape")}
      </div>
    </div>
  );
}

function StateCard({ state, label, description, active }: { state: "solid" | "liquid" | "gas"; label: string; description: string; active: boolean }) {
  return (
    <div className={`rounded-3xl p-4 transition-all duration-500 ${active ? "bg-purple-50 shadow-xl ring-2 ring-purple-300" : "bg-white shadow-sm ring-1 ring-slate-200"}`}>
      <div className="text-center text-xl font-black capitalize text-slate-950">{label}</div>
      <ParticleMiniBox state={state} />
      <p className="mt-3 text-center text-sm font-bold leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function ParticleMiniBox({ state }: { state: "solid" | "liquid" | "gas" }) {
  const count = state === "gas" ? 9 : 16;
  return (
    <div className="relative mt-4 h-44 rounded-2xl bg-slate-950">
      {Array.from({ length: count }).map((_, index) => {
        const position = particlePosition(index, count, state);
        return <span key={index} className="absolute h-4 w-4 rounded-full bg-amber-300 transition-all duration-700" style={{ left: `${position.x}%`, top: `${position.y}%` }} />;
      })}
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-base text-slate-900">{value}</div>
    </div>
  );
}

function particlePosition(index: number, total: number, state: string) {
  if (state === "solid") {
    const columns = Math.ceil(Math.sqrt(total));
    const x = 18 + (index % columns) * (64 / Math.max(1, columns - 1));
    const y = 20 + Math.floor(index / columns) * (58 / Math.max(1, columns - 1));
    return { x, y };
  }
  if (state === "liquid") {
    return {
      x: 10 + ((index * 17) % 78),
      y: 48 + ((index * 11) % 34),
    };
  }
  return {
    x: 8 + ((index * 29) % 84),
    y: 10 + ((index * 37) % 72),
  };
}

function ForceArrowsAnimator({ visual }: { visual: Record<string, unknown> }) {
  const rightArrow = Boolean(visual.rightArrow ?? true);
  const leftArrow = Boolean(visual.leftArrow);
  return (
    <div className="relative h-80 w-full max-w-4xl rounded-3xl bg-blue-50 p-8 shadow-inner">
      <div className="absolute left-1/2 top-1/2 flex h-24 w-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-3xl bg-white text-lg font-black text-slate-900 shadow-lg ring-1 ring-blue-100">
        {getString(visual, "objectLabel", "object")}
      </div>
      {rightArrow && <div className="absolute left-[55%] top-1/2 h-3 w-44 -translate-y-1/2 rounded-full bg-purple-600 after:absolute after:right-[-2px] after:top-1/2 after:h-8 after:w-8 after:-translate-y-1/2 after:rotate-45 after:border-r-8 after:border-t-8 after:border-purple-600" />}
      {leftArrow && <div className="absolute right-[55%] top-1/2 h-3 w-44 -translate-y-1/2 rounded-full bg-amber-500 after:absolute after:left-[-2px] after:top-1/2 after:h-8 after:w-8 after:-translate-y-1/2 after:-rotate-135 after:border-r-8 after:border-t-8 after:border-amber-500" />}
      <p className="absolute bottom-6 left-6 rounded-2xl bg-white px-4 py-2 text-lg font-black text-blue-950 shadow-sm">{getString(visual, "netForce", getString(visual, "forceLabel", "force"))}</p>
    </div>
  );
}

function MotionTrackAnimator({ visual }: { visual: Record<string, unknown> }) {
  const position = clamp(getNumber(visual, "position", 10), 5, 90);
  return (
    <div className="w-full max-w-5xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <div className="relative h-48">
        <div className="absolute left-4 right-4 top-28 h-3 rounded-full bg-slate-300" />
        {Boolean(visual.trail) && <div className="absolute left-8 top-[104px] h-8 rounded-full bg-purple-200 transition-all duration-700" style={{ width: `${position}%` }} />}
        <div className="absolute top-16 flex h-24 w-24 -translate-x-1/2 items-center justify-center rounded-full bg-purple-600 text-sm font-black text-white shadow-xl transition-all duration-700 ease-out" style={{ left: `${position}%` }}>
          {getString(visual, "label", "object")}
        </div>
      </div>
    </div>
  );
}

function DiagramLabelAnimator({ visual }: { visual: Record<string, unknown> }) {
  const labels = getStringArray(visual, "labels");
  return (
    <div className="relative h-96 w-full max-w-4xl rounded-3xl bg-emerald-50 p-8 shadow-inner">
      <div className={`absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-center text-lg font-black shadow-lg ${visual.active ? "bg-yellow-200 text-yellow-950" : "bg-white text-slate-900"}`}>
        {getString(visual, "diagram", "concept")}
      </div>
      {labels.map((label, index) => {
        const angle = (index / Math.max(1, labels.length)) * Math.PI * 2 - Math.PI / 2;
        const x = 50 + Math.cos(angle) * 34;
        const y = 50 + Math.sin(angle) * 34;
        return (
          <div key={`${label}-${index}`} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-emerald-950 shadow-sm transition-all duration-500" style={{ left: `${x}%`, top: `${y}%` }}>
            {label}
          </div>
        );
      })}
    </div>
  );
}

function QuizSceneAnimator({ scene, visual }: { scene: VisualLessonScene; visual: Record<string, unknown> }) {
  const question = scene.studentQuestion;
  const quizData = {
    question: question?.question || getString(visual, "question", "Quick check"),
    options: question?.options || ["I understand", "I need help"],
    correctAnswer: question?.answer || question?.options?.[0] || "I understand",
    explanation: question?.explanation || "Use the visual steps to answer.",
  };
  return (
    <div className="grid w-full max-w-5xl gap-5 lg:grid-cols-[1fr_1.1fr] lg:items-center">
      {getNumber(visual, "parts", 0) > 0 ? <FractionBarAnimator visual={visual} /> : <FormulaBoardAnimator scene={scene} stepIndex={0} visual={{ formula: getString(visual, "question", "Quick check") }} />}
      <QuizVisual data={quizData} />
    </div>
  );
}

function buildSlides(concept: string, lesson: VisualLesson): VisualLessonSlide[] {
  if (lesson.slides?.length) return lesson.slides;
  const quiz = lesson.quiz?.[0];
  return [
    {
      slideType: "definition",
      title: `Meaning of ${concept}`,
      teacherScript: lesson.simpleExplanation || `Let us define ${concept}, see an example, and test one non-example.`,
      visualType: "formula-card",
      visualData: {
        formula: concept,
        validFor: lesson.realLifeExample || `A clear example of ${concept}`,
        notValidFor: `A similar idea that is not ${concept}`,
      },
      keyPoints: lesson.visualSteps?.map((step) => `${step.title}: ${step.description}`) || ["Understand the meaning.", "See one example.", "Try one question."],
    },
    {
      slideType: "example",
      title: `Example of ${concept}`,
      teacherScript: lesson.realLifeExample || `Use a daily-life example to understand ${concept} before textbook questions.`,
      visualType: "example-card",
      visualData: {
        examplesTitle: "Example",
        examples: [lesson.realLifeExample || concept],
        nonExamplesTitle: "Non-example",
        nonExamples: [`Not ${concept}`],
        reason: "Comparing both helps the idea become clear.",
      },
      keyPoints: ["Example first.", "Then compare with a non-example."],
    },
    {
      slideType: "quick-check",
      title: quiz?.question || `Quick check for ${concept}`,
      teacherScript: quiz ? "Think about the options, choose one answer, and then check the explanation." : `Can you explain ${concept} in your own words?`,
      visualType: "quiz-card",
      visualData: {
        question: quiz?.question || `Which statement best matches ${concept}?`,
        options: quiz?.options || ["Definition", "Example", "Non-example"],
        correctAnswer: quiz?.answer || "Definition",
        explanation: quiz?.explanation || lesson.memoryTrick || `Use the definition of ${concept}.`,
      },
      keyPoints: [lesson.memoryTrick || "Meaning first, example next, practice last."],
    },
  ];
}

function coachText(mode: CoachMode, slide: VisualLessonSlide, concept: string) {
  if (mode === "again") {
    return `In simpler words: ${slide.teacherScript} The main thing to remember is ${slide.keyPoints[0] || slide.title}.`;
  }
  if (mode === "example") {
    const data = slide.visualData;
    const example = getStringArray(data, "examples")[1] || getStringArray(data, "rightExamples")[0] || getStringArray(data, "leftExamples")[0] || getString(data, "example");
    return example ? `Another example: ${example}. Now explain why it matches or does not match ${concept}.` : `Another example: pick one number, object, or case from your textbook and test whether it follows the rule for ${concept}.`;
  }
  if (mode === "practice") {
    return `Practice now: cover the explanation, look only at the visual, and explain ${concept} in one sentence. Then try one similar question from your notebook.`;
  }
  const data = slide.visualData;
  const question = slide.studentQuestion || getString(data, "question", `Can you explain ${concept} in one sentence?`);
  const answer = slide.answer || getString(data, "correctAnswer");
  return answer ? `${question} Answer after thinking: ${answer}` : question;
}

function animatedCoachText(mode: CoachMode, scene: VisualLessonScene, step: VisualLessonStep) {
  if (mode === "again") {
    return `Watch this step again in simpler words: ${step.narration} The visual is showing one idea at a time, so focus on what changed on the board.`;
  }
  if (mode === "example") {
    return `Another visual: imagine the same action with a different object but the same rule. If the board split a pizza, try a chocolate bar. If it moved a marker, try another point on the same line.`;
  }
  if (mode === "practice") {
    return scene.studentQuestion
      ? `${scene.studentQuestion.question} Try it before checking: ${scene.studentQuestion.options.join(", ")}.`
      : "Practice now: pause the animation, draw the current visual in your notebook, and label the parts you can see.";
  }
  return scene.studentQuestion
    ? `${scene.studentQuestion.question} Think first. Answer: ${scene.studentQuestion.answer}.`
    : `Question: what changed in this step, and why does that change explain ${scene.title}?`;
}

function mergeStepVisuals(steps: VisualLessonStep[], stepIndex: number) {
  const merged: Record<string, unknown> = {};
  steps.slice(0, stepIndex + 1).forEach((step) => {
    Object.entries(step.visual || {}).forEach(([key, value]) => {
      if ((key === "rows" || key === "markers") && Array.isArray(merged[key]) && Array.isArray(value)) {
        merged[key] = [...(merged[key] as unknown[]), ...value];
        return;
      }
      if (key === "labels" && Array.isArray(merged[key]) && Array.isArray(value)) {
        merged[key] = Array.from(new Set([...(merged[key] as unknown[]), ...value]));
        return;
      }
      merged[key] = value;
    });
  });
  return merged;
}

function parseFractionValue(label: string, fallback: number) {
  const match = label.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return fallback;
  const numerator = Number(match[1]);
  const denominator = Number(match[2]);
  return denominator ? numerator / denominator : fallback;
}

function getString(data: Record<string, unknown>, key: string, fallback = "") {
  const value = data[key];
  return typeof value === "string" ? value : fallback;
}

function getStringArray(data: Record<string, unknown>, key: string) {
  const value = data[key];
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

function getRows(data: Record<string, unknown>, key: string) {
  const value = data[key];
  if (!Array.isArray(value)) return [];
  return value.map((row) => (Array.isArray(row) ? row.map((cell) => String(cell)) : [String(row)]));
}

function getNumber(data: Record<string, unknown>, key: string, fallback: number) {
  const value = data[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getMarkers(data: Record<string, unknown>) {
  const value = data.markers;
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const record = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      return {
        label: typeof record.label === "string" ? record.label : "",
        value: typeof record.value === "number" ? record.value : NaN,
      };
    })
    .filter((marker) => marker.label && Number.isFinite(marker.value));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
