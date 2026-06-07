import OpenAI from "openai";
import { getChild } from "@/lib/mock-data";
import { NARRATION_QUALITY_VERSION, sanitizeTeacherNarration } from "@/lib/voice/narration-sanitizer";
import { getChapterByNumber } from "@/lib/learning/chapter-catalog";
import { checkAndIncrementAiUsage } from "@/lib/usage-store";
import { getRequestAccess } from "@/lib/request-access";
import type { PlanName } from "@/lib/billing-types";
import type { ChildId, CinematicLessonBeat, VisualLesson, VisualLessonChapterConcept, VisualLessonScene, VisualLessonSlide, VisualLessonStep, VisualSceneType, VisualType } from "@/lib/types";
import {
  INDIAN_VOICE_CONFIG,
  isIndianVoiceLanguage,
  isVoiceLanguageMode,
  isVoiceStyle,
  type IndianVoiceLanguage,
  type VoiceLanguageMode,
  type VoiceStyle,
} from "@/lib/voice/voice-types";
import { normalizeTeacherNarration } from "@/lib/voice/neural-voice";

export const runtime = "nodejs";

const visualTypes: VisualType[] = [
  "two-column-card",
  "formula-card",
  "comparison-table",
  "number-line",
  "quiz-card",
  "example-card",
  "mistake-card",
  "summary-card",
];

const sceneTypes: VisualSceneType[] = [
  "fraction-circle",
  "fraction-bar",
  "number-line",
  "comparison-board",
  "formula-board",
  "table-board",
  "particle-motion-board",
  "states-of-matter-board",
  "heating-curve-board",
  "evaporation-board",
  "force-arrows",
  "motion-track",
  "diagram-label",
  "quiz-visual",
];

export async function POST(request: Request) {
  const body = (await request.json()) as {
    childId?: ChildId;
    childName?: string;
    grade?: string;
    board?: string;
    subject?: string;
    topic?: string;
    chapterNumber?: number;
    chapterName?: string;
    conceptName?: string;
    concepts?: string[];
    narrationLanguage?: IndianVoiceLanguage;
    narrationLanguageMode?: VoiceLanguageMode;
    narrationVoiceStyle?: VoiceStyle;
  };
  const access = await getRequestAccess(request);
  if (access.mustChangeCredentials || access.status === "pending" || access.status === "blocked" || access.status === "rejected" || access.status === "expired") {
    return Response.json({ error: "Your account is not ready for AI access yet." }, { status: 403 });
  }
  if (!access.policy.canUseAI && access.status !== "guest") {
    return Response.json({ error: "AI access is not enabled for this account." }, { status: 403 });
  }
  const session = getSessionFromCookie(request.headers.get("cookie") || "");
  let usage: Awaited<ReturnType<typeof checkAndIncrementAiUsage>>;
  try {
    usage = await checkAndIncrementAiUsage(access.userId || session.userId, access.plan || session.plan, access.dailyAiLimit);
  } catch (error) {
    console.warn("[visual-lesson] Usage check failed", error);
    return Response.json({ error: "Could not check AI usage right now. Please try again." }, { status: 503 });
  }
  if (!usage.allowed) {
    return Response.json({ error: "Daily AI limit reached. Please try tomorrow or upgrade access.", usage }, { status: 429 });
  }

  const child = getChild(body.childId || "jayadeep");
  const grade = body.grade || child.grade;
  const board = body.board || "CBSE";
  const subject = body.subject || "Maths";
  const catalogChapter = getChapterByNumber(grade, subject, Number(body.chapterNumber) || 1);
  const chapterNumber = Number(body.chapterNumber) || catalogChapter.number;
  const chapterName = body.chapterName || catalogChapter.name;
  const concepts = body.concepts?.length ? body.concepts : catalogChapter.concepts;
  const conceptName = body.conceptName || body.topic || "";
  const narrationLanguage = isIndianVoiceLanguage(body.narrationLanguage) ? body.narrationLanguage : "en-IN";
  const narrationLanguageMode = isVoiceLanguageMode(body.narrationLanguageMode)
    ? body.narrationLanguageMode
    : narrationLanguage === "en-IN"
      ? "english-only"
      : "bilingual";
  const narrationVoiceStyle = isVoiceStyle(body.narrationVoiceStyle) ? body.narrationVoiceStyle : "soft-indian-teacher";
  const lessonScope = isChapterScope(conceptName, body.topic) ? "chapter" : "topic";
  const selectedConcept = lessonScope === "chapter" ? chapterName : conceptName || concepts[0] || chapterName;
  const profile = lessonScope === "topic" ? buildTopicProfile({ board, subject, chapterName, conceptName: selectedConcept, concepts }) : undefined;
  const fallback: VisualLesson = {
    ...(lessonScope === "chapter"
      ? createFallbackChapterVisualLesson({ grade, board, subject, chapterNumber, chapterName, concepts })
      : createFallbackVisualLesson({ grade, board, subject, chapterNumber, chapterName, conceptName: selectedConcept, profile: profile! })),
    narrationLanguage,
    narrationLanguageMode,
  };

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(fallback);
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Return only valid JSON. Do not return markdown.
Shape:
{
  "title": string,
  "lessonTitle": string,
  "gradeLevel": string,
  "mode": "cinematic-visual-teacher",
  "lessonScope": "topic" | "chapter",
  "classGrade": string,
  "subject": string,
  "chapterTitle": string,
  "topicTitle": string | null,
  "estimatedDurationMinutes": number,
  "chapterConcepts": [
    {
      "conceptNo": number,
      "conceptTitle": string,
      "learningGoal": string,
      "misconceptionToFix": string,
      "scenes": []
    }
  ],
  "scenes": [
    {
      "sceneType": "fraction-circle" | "fraction-bar" | "number-line" | "comparison-board" | "formula-board" | "table-board" | "particle-motion-board" | "states-of-matter-board" | "heating-curve-board" | "evaporation-board" | "force-arrows" | "motion-track" | "diagram-label" | "quiz-visual",
      "sceneId": string,
      "cinematicStyle": string,
      "title": string,
      "setting": string,
      "teacherIntent": string,
      "teacherScript": string,
      "beats": [
        {
          "beatId": string,
          "beatType": "intro" | "zoom" | "reveal" | "transform" | "compare" | "label" | "question" | "correction" | "recap" | "practice",
          "camera": {
            "movement": "none" | "pan" | "zoom-in" | "zoom-out" | "follow" | "tilt" | "focus",
            "target": string,
            "durationMs": number
          },
          "visual": {
            "visualType": string,
            "visualData": object
          },
          "animation": {
            "durationMs": number,
            "sequence": []
          },
          "boardText": string,
          "teacherNarration": string,
          "highlight": string,
          "soundCue": string,
          "checkForUnderstanding": {
            "question": string,
            "options": string[],
            "answer": string,
            "remediation": string
          }
        }
      ],
      "steps": [
        {
          "stepId": string,
          "action": string,
          "title": string,
          "shortBoardText": string,
          "teacherNarration": string,
          "narration": string,
          "visualType": string,
          "visualData": object,
          "visual": object,
          "animation": {
            "durationMs": number,
            "sequence": []
          },
          "checkForUnderstanding": {
            "question": string,
            "options": string[],
            "answer": string,
            "remediation": string
          }
        }
      ],
      "studentQuestion": {
        "question": string,
        "options": string[],
        "answer": string,
        "explanation": string
      }
    }
  ],
  "slides": [
    {
      "slideType": "hook" | "definition" | "visual-explanation" | "example" | "comparison" | "number-line" | "common-mistake" | "quick-check" | "summary" | "practice",
      "title": string,
      "teacherScript": string,
      "visualType": "two-column-card" | "formula-card" | "comparison-table" | "number-line" | "quiz-card" | "example-card" | "mistake-card" | "summary-card",
      "visualData": object,
      "keyPoints": string[],
      "studentQuestion": string,
      "answer": string
    }
  ]
}
For lessonScope "topic", return 6 to 10 cinematic scenes for the selected topic only, with 5 to 10 beats per scene.
For lessonScope "chapter", return the complete chapter in correct teaching order, with 1 to 2 cinematic scenes per concept, 5 to 10 beats per scene, section checks, final recap, chapter quiz, and weak-area practice. Matter in Our Surroundings requires at least 12 concepts. Number Systems requires at least 10 concepts. Also include a flattened scenes array containing all chapterConcepts scenes in order for compatibility.
Every concept must follow this teacher sequence: real-life hook, prior knowledge connection, full definition, visual explanation, step-by-step breakdown, example, non-example, common mistake, mini question, correction/remediation, summary, and practice. Use these ideas across scene steps instead of returning short cards.
Each beat's teacherNarration must be 60 to 120 words, written like a calm Indian school teacher speaking slowly to a child. boardText must be one or two short lines only. Every beat must include camera, visual.visualType, visual.visualData, animation, and highlight. Visuals must carry the meaning through zoom, pan, movement, transformation, particles, comparison, and timely highlighting. Use simple English, age-appropriate examples, and CBSE/NCERT terminology for Class 9 Maths and Science.
Strictly forbidden narration phrases: "A good teacher begins", "Watch the board first", "Listen for the rule", "This concept becomes easier", "Science ideas become clear", "Real-life hook: particles", "Now add cause", "Build a diagram", and any meta commentary about teaching method. Speak directly to the student. Explain the concept, not the teaching process. Use short natural classroom sentences, concrete examples, and calm teacher-like flow. Avoid robotic textbook paragraphs and awkward title repetition.
For maths, use circles, bars, number lines, formulas, tables, and comparisons wherever relevant. For science, prefer particle-motion-board, states-of-matter-board, heating-curve-board, evaporation-board, motion tracks, arrows, and labeled diagrams. Avoid generic concept/cause/effect bubbles unless only supporting a better visual.
${createNarrationLanguageInstructions(narrationLanguage, narrationLanguageMode, narrationVoiceStyle)}`,
        },
        {
          role: "user",
          content: `Create a visual classroom lesson for ${body.childName || child.name}.
Grade: ${grade}
Board: ${board}
Subject: ${subject}
Chapter ${chapterNumber}: ${chapterName}
Lesson scope: ${lessonScope}
Concept selection: ${lessonScope === "chapter" ? "All Concepts / full chapter" : selectedConcept}
Chapter concepts: ${concepts.join(", ")}
Narration language: ${INDIAN_VOICE_CONFIG[narrationLanguage].label}
Narration language mode: ${narrationLanguageMode}
Teacher voice style: ${narrationVoiceStyle}

Topic hints:
${lessonScope === "chapter" ? createChapterPromptHints(subject, chapterName, concepts) : createPromptHints(profile!)}

${lessonScope === "chapter" ? "Teach the full chapter concept-by-concept. Do not collapse the chapter into a few scenes. Matter in Our Surroundings needs 12 or more concepts and Number Systems needs 10 or more." : "Use 6 to 10 cinematic scenes. Build the lesson for the selected concept only and teach it deeply."}
Each scene should have 5 to 10 cinematic beats. Each teacherNarration should be 60 to 120 words and should sound like a senior teacher speaking while the visual remains on screen. Include legacy steps and slides only for compatibility; cinematic beats are primary.`,
        },
      ],
    });
    const parsed = JSON.parse(completion.choices[0]?.message.content || "{}");
    const lesson = sanitizeVisualLessonNarration(normalizeVisualLesson(parsed, fallback));
    return Response.json({ ...lesson, narrationQualityVersion: NARRATION_QUALITY_VERSION });
  } catch (error) {
    console.warn("[visual-lesson] Falling back to structured lesson", error);
    const lesson = sanitizeVisualLessonNarration(fallback);
    return Response.json({ ...lesson, narrationQualityVersion: NARRATION_QUALITY_VERSION });
  }
}

function getSessionFromCookie(cookie: string) {
  const values = Object.fromEntries(cookie.split(";").map((part) => part.trim().split("=")).filter((part) => part.length === 2).map(([key, value]) => [key, decodeURIComponent(value)]));
  return { userId: values.kids_user_id || "demo-user", plan: ((values.kids_access_plan as PlanName | undefined) || "demo") };
}

function isChapterScope(conceptName?: string, topic?: string) {
  const raw = `${conceptName || ""} ${topic || ""}`.trim().toLowerCase();
  return !raw || raw.includes("all concepts") || raw === "all" || raw === "chapter" || raw.includes("full chapter");
}

function createNarrationLanguageInstructions(
  language: IndianVoiceLanguage,
  languageMode: VoiceLanguageMode,
  voiceStyle: VoiceStyle,
) {
  const label = INDIAN_VOICE_CONFIG[language].label;
  if (language === "en-IN" || languageMode === "english-only") {
    return `Write every teacherNarration in clear spoken Indian English. Use a ${voiceStyle} delivery: calm, patient, child-friendly, and natural. Keep every sentence short and conversational. Avoid robotic textbook paragraphs, awkward meta phrases, and repeated titles.`;
  }
  if (languageMode === "regional-only") {
    return `Write every teacherNarration in simple spoken ${label}. This must be a natural teacher explanation, not a word-for-word translation. Keep formulas, symbols, and only essential textbook proper nouns in English. Avoid slang and overly formal literary language.`;
  }
  return `Write every teacherNarration mainly in simple spoken ${label}, with important CBSE textbook and exam keywords reinforced in English. Use natural bilingual classroom speech, not word-for-word translation. Preserve formulas and exact subject terminology. Avoid slang, robotic textbook paragraphs, repeated titles, and meta phrases like "A good teacher begins" or "Watch the board first".`;
}

function createChapterPromptHints(subject: string, chapterName: string, concepts: string[]) {
  const context = `${subject} ${chapterName}`.toLowerCase();
  const conceptList = concepts.length ? concepts : ["Introduction", "Key concepts", "Summary", "Quiz"];
  const base = [
    `- Lesson scope: full chapter, not a single topic.`,
    `- Teach in this order: ${conceptList.join(" -> ")}.`,
    `- Every concept needs at least one animated visual scene with step narration.`,
    `- Add a final chapter summary and chapter quiz.`,
  ];
  if (/matter in our surroundings/.test(context)) {
    base.push(
      "- Use particle-motion-board for particles, space, motion, and attraction.",
      "- Use states-of-matter-board for solid, liquid, and gas.",
      "- Use heating-curve-board for ice -> water -> steam, melting, boiling, and latent heat.",
      "- Use evaporation-board for evaporation, sublimation, surface area, wind, and temperature.",
      "- Include stone, water, and air balloon as examples of matter.",
    );
  }
  if (/number systems/.test(context)) {
    base.push(
      "- Include natural numbers, whole numbers, integers, rational numbers, irrational numbers, real numbers, number line, decimal expansion, and laws of exponents.",
      "- Use number-line, table-board, comparison-board, and formula-board scenes.",
      "- For Irrational Numbers, include p/q condition, non-terminating non-repeating decimals, examples √2, √3, √5, π, and non-examples 1/2, 3, 0.75, 0.333...",
    );
  }
  return base.join("\n");
}

function sanitizeVisualLessonNarration(lesson: VisualLesson): VisualLesson {
  return {
    ...lesson,
    scenes: (lesson.scenes || []).map((scene) => ({
      ...scene,
      teacherScript: sanitizeTeacherNarration(scene.teacherScript || "", { language: "en-IN" }),
      steps: (scene.steps || []).map((step) => ({
        ...step,
        teacherNarration: sanitizeTeacherNarration(step.teacherNarration || step.narration || "", { language: "en-IN" }),
        narration: sanitizeTeacherNarration(step.narration || step.teacherNarration || "", { language: "en-IN" }),
      })),
      beats: (scene.beats || []).map((beat) => ({
        ...beat,
        teacherNarration: sanitizeTeacherNarration(beat.teacherNarration || "", { language: "en-IN" }),
      })),
    })),
    chapterConcepts: (lesson.chapterConcepts || []).map((concept) => ({
      ...concept,
      scenes: (concept.scenes || []).map((scene) => ({
        ...scene,
        teacherScript: sanitizeTeacherNarration(scene.teacherScript || "", { language: "en-IN" }),
        steps: (scene.steps || []).map((step) => ({
          ...step,
          teacherNarration: sanitizeTeacherNarration(step.teacherNarration || step.narration || "", { language: "en-IN" }),
          narration: sanitizeTeacherNarration(step.narration || step.teacherNarration || "", { language: "en-IN" }),
        })),
        beats: (scene.beats || []).map((beat) => ({
          ...beat,
          teacherNarration: sanitizeTeacherNarration(beat.teacherNarration || "", { language: "en-IN" }),
        })),
      })),
    })),
    slides: (lesson.slides || []).map((slide) => ({
      ...slide,
      teacherScript: sanitizeTeacherNarration(slide.teacherScript || "", { language: "en-IN" }),
    })),
  };
}

function normalizeVisualLesson(value: unknown, fallback: VisualLesson): VisualLesson {
  const input = Array.isArray(value) ? { title: fallback.title, gradeLevel: fallback.gradeLevel, slides: value } : asRecord(value);
  const chapterConcepts = asArray(input.chapterConcepts)
    .map((concept) => normalizeChapterConcept(concept))
    .filter((concept): concept is VisualLessonChapterConcept => Boolean(concept));
  const scenes = asArray(input.scenes)
    .map((scene) => normalizeScene(scene))
    .filter((scene): scene is VisualLessonScene => Boolean(scene));
  const slides = asArray(input.slides)
    .map((slide) => normalizeSlide(slide))
    .filter((slide): slide is VisualLessonSlide => Boolean(slide));

  const isRequestedChapter = fallback.lessonScope === "chapter";
  const flattenedChapterScenes = chapterConcepts.flatMap((concept) => concept.scenes);
  const fallbackChapterConcepts = fallback.chapterConcepts || [];
  const nextChapterConcepts = chapterConcepts.length ? chapterConcepts : fallbackChapterConcepts;
  const nextChapterScenes = nextChapterConcepts.flatMap((concept) => concept.scenes);
  const nextScenes = isRequestedChapter ? nextChapterScenes : flattenedChapterScenes.length ? flattenedChapterScenes : scenes.length ? scenes : fallback.scenes || [];
  const nextSlides = slides.length >= 3 ? slides : fallback.slides;
  if (!nextScenes.length && nextSlides.length < 3) return fallback;
  const candidate = {
    title: asString(input.title, fallback.title),
    lessonTitle: asString(input.lessonTitle, fallback.lessonTitle || fallback.title),
    gradeLevel: asString(input.gradeLevel, fallback.gradeLevel),
    classGrade: asString(input.classGrade, fallback.classGrade || fallback.gradeLevel),
    subject: asString(input.subject, fallback.subject),
    lessonScope: isRequestedChapter ? "chapter" : asString(input.lessonScope, fallback.lessonScope || "topic"),
    chapterTitle: asString(input.chapterTitle, fallback.chapterTitle || fallback.title),
    topicTitle: input.topicTitle === null ? null : asString(input.topicTitle, fallback.topicTitle || "") || null,
    narrationLanguage: asString(input.narrationLanguage, fallback.narrationLanguage || "en-IN"),
    narrationLanguageMode: asString(input.narrationLanguageMode, fallback.narrationLanguageMode || "english-only"),
    estimatedDurationMinutes: asPositiveNumber(input.estimatedDurationMinutes, fallback.estimatedDurationMinutes || estimateLessonDuration(nextScenes)),
    chapterConcepts: nextChapterConcepts,
    mode: "cinematic-visual-teacher",
    scenes: nextScenes,
    slides: nextSlides,
  };
  const sanitizedCandidate = sanitizeVisualLessonNarration(candidate);
  return isLessonQualityAcceptable(sanitizedCandidate, fallback) ? deepenVisualLesson(sanitizedCandidate) : fallback;
}

function normalizeChapterConcept(value: unknown): VisualLessonChapterConcept | undefined {
  const input = asRecord(value);
  const conceptNo = Number(input.conceptNo);
  const conceptTitle = asString(input.conceptTitle);
  const scenes = asArray(input.scenes)
    .map((scene) => normalizeScene(scene))
    .filter((scene): scene is VisualLessonScene => Boolean(scene));
  if (!Number.isFinite(conceptNo) || !conceptTitle || !scenes.length) return undefined;
  return {
    conceptNo,
    conceptTitle,
    learningGoal: asString(input.learningGoal) || undefined,
    misconceptionToFix: asString(input.misconceptionToFix) || undefined,
    scenes,
  };
}

function normalizeScene(value: unknown): VisualLessonScene | undefined {
  const input = asRecord(value);
  const sceneType = sceneTypes.includes(input.sceneType as VisualSceneType) ? (input.sceneType as VisualSceneType) : undefined;
  const title = asString(input.title);
  const teacherScript = asString(input.teacherScript);
  const beats = asArray(input.beats)
    .map((beat) => normalizeBeat(beat, sceneType))
    .filter((beat): beat is CinematicLessonBeat => Boolean(beat));
  const steps = (beats.length ? beats.map(beatToStep) : asArray(input.steps)
    .map((step) => normalizeStep(step))
    .filter((step): step is VisualLessonStep => Boolean(step)));
  if (!sceneType || !title || !teacherScript || !steps.length) return undefined;
  const question = asRecord(input.studentQuestion);
  const studentQuestion = asString(question.question)
    ? {
        question: asString(question.question),
        options: asStringArray(question.options),
        answer: asString(question.answer),
        explanation: asString(question.explanation) || undefined,
      }
    : undefined;
  return {
    sceneType,
    sceneId: asString(input.sceneId) || undefined,
    cinematicStyle: asString(input.cinematicStyle) || undefined,
    title,
    setting: asString(input.setting) || undefined,
    teacherIntent: asString(input.teacherIntent) || undefined,
    teacherScript,
    steps,
    beats: beats.length ? beats : undefined,
    studentQuestion,
  };
}

function normalizeBeat(value: unknown, fallbackVisualType?: VisualSceneType): CinematicLessonBeat | undefined {
  const input = asRecord(value);
  const camera = asRecord(input.camera);
  const visual = asRecord(input.visual);
  const visualData = asRecord(visual.visualData);
  const teacherNarration = normalizeTeacherNarration(asString(input.teacherNarration));
  const beatId = asString(input.beatId);
  const beatType = normalizeBeatType(input.beatType);
  if (!beatId || !teacherNarration || !Object.keys(visualData).length) return undefined;
  return {
    beatId,
    beatType,
    camera: {
      movement: normalizeCameraMovement(camera.movement),
      target: asString(camera.target, "main visual"),
      durationMs: asPositiveNumber(camera.durationMs, 1800),
    },
    visual: {
      visualType: asString(visual.visualType, fallbackVisualType || "diagram-label"),
      visualData,
    },
    animation: {
      durationMs: asPositiveNumber(asRecord(input.animation).durationMs, 6000),
      sequence: asArray(asRecord(input.animation).sequence),
    },
    boardText: asString(input.boardText, "Watch the visual"),
    teacherNarration,
    highlight: asString(input.highlight, "main idea"),
    soundCue: asString(input.soundCue) || undefined,
    checkForUnderstanding: normalizeStepCheck(input.checkForUnderstanding),
  };
}

function beatToStep(beat: CinematicLessonBeat): VisualLessonStep {
  return {
    stepId: beat.beatId,
    action: beat.beatType,
    title: beat.boardText,
    shortBoardText: beat.boardText,
    narration: beat.teacherNarration,
    teacherNarration: beat.teacherNarration,
    visualType: beat.visual.visualType,
    visual: beat.visual.visualData,
    visualData: beat.visual.visualData,
    animation: beat.animation,
    checkForUnderstanding: beat.checkForUnderstanding,
    beatType: beat.beatType,
    camera: beat.camera,
    highlight: beat.highlight,
    soundCue: beat.soundCue,
  };
}

function normalizeStep(value: unknown): VisualLessonStep | undefined {
  const input = asRecord(value);
  const action = asString(input.action, asString(input.title, "explain"));
  const title = asString(input.title, action);
  const shortBoardText = asString(input.shortBoardText, title);
  const teacherNarration = normalizeTeacherNarration(asString(input.teacherNarration, asString(input.narration)));
  const narration = teacherNarration || asString(input.narration);
  const visualData = asRecord(input.visualData);
  const visual = Object.keys(visualData).length ? visualData : asRecord(input.visual);
  if (!action || !narration) return undefined;
  return {
    stepId: asString(input.stepId) || undefined,
    action,
    title,
    shortBoardText,
    narration,
    teacherNarration: teacherNarration || narration,
    visualType: asString(input.visualType) || undefined,
    visual,
    visualData: visual,
    animation: asRecord(input.animation) as VisualLessonStep["animation"],
    checkForUnderstanding: normalizeStepCheck(input.checkForUnderstanding),
  };
}

function normalizeStepCheck(value: unknown): VisualLessonStep["checkForUnderstanding"] {
  const input = asRecord(value);
  const question = asString(input.question);
  if (!question) return undefined;
  return {
    question,
    options: asStringArray(input.options),
    answer: asString(input.answer) || undefined,
    remediation: asString(input.remediation) || undefined,
  };
}

function isLessonQualityAcceptable(lesson: VisualLesson, fallback: VisualLesson) {
  if (lesson.lessonScope === "chapter" && fallback.lessonScope === "chapter") {
    const conceptCount = lesson.chapterConcepts?.length || 0;
    if (conceptCount < 8) return false;
    const chapterName = (lesson.chapterTitle || "").toLowerCase();
    if (chapterName.includes("matter in our surroundings") && conceptCount < 12) return false;
    if (chapterName.includes("number systems") && conceptCount < 10) return false;
    if (lesson.chapterConcepts?.some((concept) => !concept.scenes.length)) return false;
  }

  const scenes = getLessonScenes(lesson);
  if (!scenes.length) return false;
  if (lesson.lessonScope === "topic" && scenes.length < 6) return false;
  return scenes.every((scene) => {
    if (hasGenericContent(scene.title) || hasGenericContent(scene.teacherScript)) return false;
    if (scene.steps.length < 4) return false;
    return scene.steps.every((step) => {
      const text = step.teacherNarration || step.narration;
      const visual = step.visualData || step.visual;
      return countWords(text) >= 55 && Object.keys(visual || {}).length > 0 && Boolean(step.visualType || scene.sceneType) && !hasGenericContent(text);
    });
  });
}

function deepenVisualLesson(lesson: VisualLesson): VisualLesson {
  const chapterConcepts = lesson.chapterConcepts?.map((concept) => ({
    ...concept,
    scenes: concept.scenes.map((scene) => deepenScene(scene, concept.conceptTitle, lesson.lessonScope === "chapter")),
  }));
  const topicScenes = lesson.lessonScope === "topic" ? ensureTopicSceneCount(lesson.scenes || [], lesson.topicTitle || lesson.title) : lesson.scenes || [];
  const scenes = chapterConcepts?.length
    ? chapterConcepts.flatMap((concept) => concept.scenes)
    : topicScenes.map((scene) => deepenScene(scene, lesson.topicTitle || lesson.chapterTitle || lesson.title, false));

  return {
    ...lesson,
    mode: "cinematic-visual-teacher",
    classGrade: lesson.classGrade || lesson.gradeLevel,
    topicTitle: lesson.lessonScope === "topic" ? lesson.topicTitle || lesson.title : null,
    estimatedDurationMinutes: lesson.estimatedDurationMinutes || estimateLessonDuration(scenes),
    chapterConcepts,
    scenes,
  };
}

function ensureTopicSceneCount(scenes: VisualLessonScene[], topicTitle: string) {
  if (scenes.length >= 6) return scenes.slice(0, 10);
  const result = [...scenes];
  const source = scenes[0] || {
    sceneType: "formula-board" as VisualSceneType,
    title: topicTitle,
    teacherScript: `Learn ${topicTitle} through a definition, visual example, comparison, correction, and practice.`,
    steps: [{ action: "definition", narration: `Begin with the textbook meaning of ${topicTitle}.`, visual: { formula: topicTitle } }],
  };
  const additions: Array<Pick<VisualLessonScene, "sceneType" | "title" | "teacherScript">> = [
    { sceneType: "comparison-board", title: `${topicTitle}: example and non-example`, teacherScript: `Compare a correct example of ${topicTitle} with a nearby non-example.` },
    { sceneType: "comparison-board", title: `${topicTitle}: common mistake correction`, teacherScript: `Reveal the common mistake and correct it using the defining condition.` },
    { sceneType: "table-board", title: `${topicTitle}: memory map`, teacherScript: `Connect the definition, rule, example, and reason in one visual map.` },
    { sceneType: "quiz-visual", title: `${topicTitle}: cinematic quick check`, teacherScript: `Check understanding with a short visual question and remediation.` },
    { sceneType: source.sceneType, title: `${topicTitle}: guided practice`, teacherScript: `Apply ${topicTitle} independently to a fresh practice example.` },
  ];
  for (const addition of additions) {
    if (result.length >= 6) break;
    result.push({
      ...source,
      sceneType: addition.sceneType,
      title: addition.title,
      teacherScript: addition.teacherScript,
      steps: source.steps.map((step) => ({ ...step, visual: { ...step.visual }, visualData: step.visualData ? { ...step.visualData } : undefined })),
      studentQuestion: addition.sceneType === "quiz-visual" ? source.studentQuestion : undefined,
    });
  }
  return result.slice(0, 10);
}

function deepenScene(scene: VisualLessonScene, conceptTitle: string, isChapter: boolean): VisualLessonScene {
  const targetStepCount = scene.sceneType === "quiz-visual" || /summary/i.test(scene.title) ? 6 : isChapter ? 8 : 7;
  const stageNames = getTeachingStages(scene.sceneType, targetStepCount, scene.title);
  const originalSteps = scene.steps.length ? scene.steps : [{ action: "explain", narration: scene.teacherScript, visual: {} }];
  const safeTitle = hasGenericContent(scene.title) ? `Understand ${conceptTitle} visually` : scene.title;

  const steps = stageNames.map((stage, index) => {
    const original = originalSteps[Math.min(index, originalSteps.length - 1)];
    const visualData = buildDeepVisualData(scene, original, stage, index, targetStepCount);
    const title = titleForStage(stage, scene, conceptTitle);
    const teacherNarration = detailedNarrationForStage(stage, scene, conceptTitle, original.narration || scene.teacherScript);
    const shortBoardText = shortBoardTextForStage(stage, scene, conceptTitle);
    return {
      stepId: `${toSlug(safeTitle)}-${index + 1}`,
      action: stage,
      title,
      shortBoardText,
      narration: teacherNarration,
      teacherNarration,
      visualType: scene.sceneType,
      visual: visualData,
      visualData,
      animation: {
        durationMs: Math.max(5500, Math.min(14000, countWords(teacherNarration) * 520)),
        sequence: [stage, original.action],
      },
      checkForUnderstanding: stage === "miniQuestion" ? buildStepCheck(scene, conceptTitle) : undefined,
    };
  });
  const beats = steps.map((step, index) => stepToBeat(step, scene.sceneType, safeTitle, index));

  return {
    ...scene,
    sceneId: scene.sceneId || toSlug(safeTitle),
    cinematicStyle: scene.cinematicStyle || cinematicStyleForScene(scene.sceneType),
    title: safeTitle,
    setting: scene.setting || settingForScene(scene.sceneType, safeTitle),
    teacherIntent: scene.teacherIntent || `Help the student understand ${conceptTitle} through one focused visual idea before moving to the next concept.`,
    teacherScript: scene.teacherScript && !hasGenericContent(scene.teacherScript) ? scene.teacherScript : detailedSceneScript(scene, conceptTitle),
    steps,
    beats,
  };
}

function getTeachingStages(sceneType: VisualSceneType, targetStepCount: number, sceneTitle: string) {
  if (sceneType === "quiz-visual") {
    return ["realLifeHook", "recall", "miniQuestion", "correction", "summary", "practice"].slice(0, targetStepCount);
  }
  if (/summary|recap|map/i.test(sceneTitle)) {
    return ["realLifeHook", "visualExplanation", "summary", "miniQuestion", "correction", "practice"].slice(0, targetStepCount);
  }
  const stages =
    targetStepCount >= 8
      ? ["realLifeHook", "priorKnowledge", "definition", "visualExplanation", "example", "commonMistake", "miniQuestion", "correction"]
      : ["realLifeHook", "definition", "visualExplanation", "example", "commonMistake", "miniQuestion", "correction"];
  return stages.slice(0, targetStepCount);
}

function stepToBeat(step: VisualLessonStep, sceneType: VisualSceneType, sceneTitle: string, index: number): CinematicLessonBeat {
  const beatType = stageToBeatType(step.action);
  const camera = cameraForBeat(beatType, step, index);
  const visualData = step.visualData || step.visual;
  return {
    beatId: step.stepId || `${toSlug(sceneTitle)}-beat-${index + 1}`,
    beatType,
    camera,
    visual: {
      visualType: cinematicVisualType(sceneType, sceneTitle),
      visualData,
    },
    animation: {
      durationMs: step.animation?.durationMs || Math.max(7000, countWords(step.teacherNarration || step.narration) * 560),
      sequence: step.animation?.sequence || [step.action, "highlight", "hold-for-narration"],
    },
    boardText: step.shortBoardText || step.title || step.action,
    teacherNarration: step.teacherNarration || step.narration,
    highlight: highlightForBeat(sceneType, beatType, visualData),
    soundCue: soundCueForBeat(beatType, sceneType),
    checkForUnderstanding: step.checkForUnderstanding,
  };
}

function stageToBeatType(stage: string): CinematicLessonBeat["beatType"] {
  if (/hook|prior|recall/i.test(stage)) return "intro";
  if (/definition|label/i.test(stage)) return "label";
  if (/visual|zoom/i.test(stage)) return "zoom";
  if (/breakdown|transform|change/i.test(stage)) return "transform";
  if (/example|nonExample|compare/i.test(stage)) return "compare";
  if (/question/i.test(stage)) return "question";
  if (/correction|mistake/i.test(stage)) return "correction";
  if (/summary|recap/i.test(stage)) return "recap";
  if (/practice/i.test(stage)) return "practice";
  return "reveal";
}

function cameraForBeat(beatType: CinematicLessonBeat["beatType"], step: VisualLessonStep, index: number): CinematicLessonBeat["camera"] {
  const movementByType: Record<CinematicLessonBeat["beatType"], CinematicLessonBeat["camera"]["movement"]> = {
    intro: "pan",
    zoom: "zoom-in",
    reveal: "focus",
    transform: "follow",
    compare: "zoom-out",
    label: "focus",
    question: "none",
    correction: "tilt",
    recap: "zoom-out",
    practice: "focus",
  };
  return {
    movement: movementByType[beatType],
    target: step.highlight || step.shortBoardText || step.title || "main visual",
    durationMs: Math.min(3200, 1400 + index * 180),
  };
}

function cinematicVisualType(sceneType: VisualSceneType, sceneTitle: string) {
  const title = sceneTitle.toLowerCase();
  if (sceneType === "particle-motion-board") return "particle-world";
  if (sceneType === "states-of-matter-board") return title.includes("matter") && !title.includes("state") ? "matter-real-world-scene" : "states-of-matter-cinematic";
  if (sceneType === "heating-curve-board") return "heating-transformation-scene";
  if (sceneType === "evaporation-board") return title.includes("sublimation") ? "sublimation-cinematic" : "evaporation-cinematic";
  if (sceneType === "fraction-circle") return "fraction-pizza-cinematic";
  if (sceneType === "fraction-bar") return "fraction-bar-cinematic";
  if (sceneType === "number-line") return "number-line-cinematic";
  if (sceneType === "comparison-board") return "comparison-cinematic";
  if (sceneType === "quiz-visual") return "quiz-cinematic";
  if (sceneType === "table-board" && /summary|map/i.test(sceneTitle)) return "concept-map-cinematic";
  if (sceneType === "table-board" && /decimal|rational|irrational/i.test(sceneTitle)) return "rational-irrational-decimal-scene";
  return sceneType;
}

function cinematicStyleForScene(sceneType: VisualSceneType) {
  if (["particle-motion-board", "states-of-matter-board", "heating-curve-board", "evaporation-board"].includes(sceneType)) return "immersive science laboratory with depth, glow, and controlled particle motion";
  if (["fraction-circle", "fraction-bar"].includes(sceneType)) return "warm classroom tabletop with realistic food and geometric overlays";
  if (sceneType === "number-line") return "infinite mathematical track with guided camera movement";
  if (sceneType === "quiz-visual") return "focused assessment stage with calm reveal";
  return "premium classroom board with layered depth and selective highlights";
}

function settingForScene(sceneType: VisualSceneType, title: string) {
  if (sceneType === "particle-motion-board") return /perfume|diffusion/i.test(title) ? "a classroom where perfume particles spread through the air" : "a magnified particle laboratory";
  if (sceneType === "states-of-matter-board") return /matter/i.test(title) ? "a study table with a book, stone, water glass, balloon, and moving air" : "three transparent chambers for solid, liquid, and gas";
  if (sceneType === "heating-curve-board") return "a safe science lab with an ice cube, beaker, burner, thermometer, and steam";
  if (sceneType === "evaporation-board") return /sublimation/i.test(title) ? "a glass dish showing camphor changing directly into vapour" : "a shallow water tray under controlled heat, wind, and humidity";
  if (sceneType === "fraction-circle") return "a classroom table with a whole pizza or chapati";
  if (sceneType === "number-line") return "a long illuminated number line stretching across a dark classroom stage";
  return "a focused cinematic classroom stage";
}

function highlightForBeat(sceneType: VisualSceneType, beatType: CinematicLessonBeat["beatType"], visualData: Record<string, unknown>) {
  if (typeof visualData.label === "string") return visualData.label;
  if (sceneType === "particle-motion-board") return beatType === "transform" ? "particle speed and spacing" : "active particles";
  if (sceneType === "heating-curve-board") return "temperature marker and phase change";
  if (sceneType === "fraction-circle" || sceneType === "fraction-bar") return "selected parts and fraction notation";
  if (sceneType === "number-line") return "moving number-line marker";
  return "current learning focus";
}

function soundCueForBeat(beatType: CinematicLessonBeat["beatType"], sceneType: VisualSceneType) {
  if (beatType === "question") return "soft-question-chime";
  if (beatType === "correction") return "gentle-correction-tone";
  if (beatType === "recap") return "soft-recap-rise";
  if (sceneType === "heating-curve-board") return "subtle-heat-hum";
  return undefined;
}

function buildDeepVisualData(scene: VisualLessonScene, original: VisualLessonStep, stage: string, index: number, total: number): Record<string, unknown> {
  const base = { ...(original.visual || {}), ...(original.visualData || {}) };
  const title = scene.title.toLowerCase();
  const progress = Math.min(1, (index + 1) / Math.max(1, total));
  const stageLabel = shortBoardTextForStage(stage, scene, scene.title);

  if (scene.sceneType === "fraction-circle") {
    const parts = getNumberLike(base.parts, stage === "realLifeHook" || stage === "priorKnowledge" ? 1 : title.includes("eight") ? 8 : 4);
    const highlightedParts = stage === "realLifeHook" || stage === "priorKnowledge" ? 0 : Math.max(1, Math.min(parts, Math.round(parts * Math.min(0.5, progress))));
    return {
      ...base,
      parts,
      highlightedParts,
      totalParts: parts,
      fraction: base.fraction || `${highlightedParts}/${parts}`,
      label: stageLabel,
      numeratorLabel: "selected parts",
      denominatorLabel: "total equal parts",
    };
  }

  if (scene.sceneType === "fraction-bar") {
    const parts = getNumberLike(base.parts, title.includes("five") ? 5 : 6);
    const highlightedParts = Math.max(0, Math.min(parts, getNumberLike(base.highlightedParts, Math.round(parts * Math.min(0.6, progress)))));
    return {
      ...base,
      parts,
      highlightedParts,
      totalParts: parts,
      fraction: base.fraction || `${highlightedParts}/${parts}`,
      label: stageLabel,
      numeratorLabel: "shaded parts",
      denominatorLabel: "equal parts in the whole",
    };
  }

  if (scene.sceneType === "number-line") {
    const markers = getMarkerVisuals(base, stage, title);
    return {
      ...base,
      min: getNumberLike(base.min, title.includes("integer") ? -4 : 0),
      max: getNumberLike(base.max, title.includes("integer") ? 4 : 3),
      markers,
      label: stageLabel,
    };
  }

  if (scene.sceneType === "comparison-board") {
    return {
      ...base,
      leftLabel: getVisualString(base.leftLabel, title.includes("irrational") ? "Rational examples" : "Example"),
      rightLabel: getVisualString(base.rightLabel, title.includes("irrational") ? "Irrational examples" : "Non-example"),
      leftItems: getVisualStringArray(base.leftItems, title.includes("fraction") ? ["1/2", "3", "0.75"] : ["correct idea", "textbook rule"]),
      rightItems: getVisualStringArray(base.rightItems, title.includes("root") || title.includes("irrational") ? ["√2", "√3", "π"] : ["mistake", "near example"]),
      comparison: getVisualString(base.comparison, stageLabel),
      highlightWinner: stage === "commonMistake" ? "right" : base.highlightWinner,
    };
  }

  if (scene.sceneType === "formula-board") {
    return {
      ...base,
      formula: getVisualString(base.formula, title.includes("irrational") || title.includes("rational") ? "p / q, q is not 0" : scene.title),
      lines: getVisualStringArray(base.lines, formulaLinesForScene(scene, stage)),
      label: stageLabel,
    };
  }

  if (scene.sceneType === "table-board") {
    return {
      ...base,
      headers: getVisualStringArray(base.headers, tableHeadersForScene(scene)),
      rows: getRowsFromUnknown(base.rows).length ? getRowsFromUnknown(base.rows) : tableRowsForScene(scene, stage),
      label: stageLabel,
    };
  }

  if (scene.sceneType === "states-of-matter-board") {
    const states = ["solid", "liquid", "gas"];
    const activeState = getVisualString(base.activeState, states[index % states.length]);
    return {
      ...base,
      activeState,
      solidLabel: getVisualString(base.solidLabel, title.includes("stone") ? "book / stone" : "solid"),
      liquidLabel: getVisualString(base.liquidLabel, title.includes("stone") ? "water glass" : "liquid"),
      gasLabel: getVisualString(base.gasLabel, title.includes("stone") ? "air balloon" : "gas"),
      label: stageLabel,
    };
  }

  if (scene.sceneType === "particle-motion-board") {
    const isGas = /perfume|moving|gas/.test(title) || stage === "example";
    const isSolid = /attract|solid/.test(title) && index < 3;
    return {
      ...base,
      state: getVisualString(base.state, isSolid ? "solid" : isGas ? "gas" : "liquid"),
      particles: getNumberLike(base.particles, 18 + index),
      guestParticles: /space|sugar/.test(title) ? Math.max(2, index + 2) : base.guestParticles,
      motion: getVisualString(base.motion, isGas ? "fast" : index > 3 ? "medium" : "slow"),
      attraction: /attract/.test(title) ? (index < 3 ? "strong" : index < 6 ? "medium" : "weak") : base.attraction,
      showBonds: /attract|solid/.test(title) && index < 4,
      temperature: /heat|moving/.test(title) ? (index > 4 ? "warmer" : "room temperature") : base.temperature,
      label: stageLabel,
    };
  }

  if (scene.sceneType === "heating-curve-board") {
    return {
      ...base,
      activeIndex: Math.min(3, Math.max(0, Math.floor(progress * 3))),
      plateau: /latent/.test(title) || stage === "visualExplanation" || stage === "stepBreakdown",
      labels: getVisualStringArray(base.labels, /latent/.test(title) ? ["heat enters", "temperature constant", "state changes"] : ["ice", "water", "steam"]),
      label: stageLabel,
    };
  }

  if (scene.sceneType === "evaporation-board") {
    const isSublimation = /sublimation|solid directly/.test(title);
    return {
      ...base,
      mode: isSublimation ? "sublimation" : "evaporation",
      vaporParticles: Math.max(2, Math.min(16, 2 + index * 2)),
      heat: index > 2 || Boolean(base.heat),
      wind: /wind|factor|evaporation/.test(title) && index > 4,
      wideSurface: /surface|factor|evaporation/.test(title) && index > 3,
      solidLabel: isSublimation ? "camphor / dry ice" : base.solidLabel,
      vaporLabel: isSublimation ? "solid particles become vapour" : "surface particles escape",
      factor: stageLabel,
    };
  }

  if (scene.sceneType === "quiz-visual") {
    return {
      ...base,
      question: scene.studentQuestion?.question || getVisualString(base.question, `What did the visual prove about ${scene.title}?`),
      options: scene.studentQuestion?.options || getVisualStringArray(base.options, ["Textbook rule", "Random heading", "Only memorization", "Skip practice"]),
      correctAnswer: scene.studentQuestion?.answer || getVisualString(base.correctAnswer, "Textbook rule"),
      explanation: scene.studentQuestion?.explanation || getVisualString(base.explanation, "The answer must match the visual rule explained by the teacher."),
      label: stageLabel,
    };
  }

  return {
    ...base,
    label: stageLabel,
    labels: getVisualStringArray(base.labels, [stageLabel, scene.title]),
    formula: getVisualString(base.formula, scene.title),
  };
}

function detailedNarrationForStage(stage: string, scene: VisualLessonScene, conceptTitle: string, originalNarration: string) {
  const topic = conceptTitle || scene.title;
  const context = `${topic} ${scene.title}`.toLowerCase();
  const original = hasGenericContent(originalNarration) ? "" : originalNarration;
  const subjectHint = topicSpecificHint(context);
  const stageText: Record<string, string> = {
    realLifeHook: `Look around before we start ${topic}. ${subjectHint.hook} A good teacher begins from what your eyes can see, because a concept becomes easier when it is connected to a real object, a real action, or a real problem. Watch the board first, then listen for the rule.`,
    priorKnowledge: `You already know something useful for ${topic}. Maybe you have seen examples in your book, at home, or on a number line, but the textbook now asks you to name the idea correctly. We will connect that old knowledge to today's rule step by step, without jumping straight to memorization.`,
    definition: `Here is the proper definition in simple language. ${subjectHint.definition} Do not only repeat the words; understand what each part of the definition is testing. The visual on the board will show the important condition, then we will use examples and non-examples to make the definition stay in memory.`,
    visualExplanation: `Now watch the movement carefully. ${subjectHint.visual} The board is not decoration; it is showing why the rule is true. I want you to notice what appears, what moves, what separates, and what gets highlighted. That change is the meaning of the concept, not just a label.`,
    stepBreakdown: `Let us break the idea into smaller teacher steps. First identify the object or number. Next apply the textbook condition. Then compare it with a nearby case that looks similar but behaves differently. ${original || subjectHint.breakdown} This habit protects you from rushing and making the common exam mistake.`,
    example: `Here is a real example. ${subjectHint.example} I am not asking you to memorize the example alone. Instead, watch how the example satisfies the rule on the board. If you can explain why it fits, then you can handle a new question in your exam instead of waiting for the same example.`,
    nonExample: `Now let us test a non-example, because non-examples sharpen understanding. ${subjectHint.nonExample} Many students lose marks because two cases look similar on the surface. The board will place the correct case and the wrong case side by side so your mind can see the boundary clearly.`,
    commonMistake: `Here is the mistake students commonly make. ${subjectHint.mistake} A careful student pauses and asks, "Which condition did I actually check?" If the condition was not checked, the answer may sound correct but still be wrong. This step is where exam readiness improves.`,
    miniQuestion: `Quick check: pause your mind for a moment and answer before looking at the explanation. ${subjectHint.question} If your answer is wrong, that is useful information, not failure. It tells us which part of the rule needs another visual example before moving ahead.`,
    correction: `If the answer felt confusing, here is the correction in simpler words. ${subjectHint.correction} Go back to the visual: what changed, what stayed the same, and what condition decided the answer? Once you can say that in your own sentence, the concept is no longer just memorized.`,
    summary: `Let us lock the idea in memory. ${subjectHint.summary} Your final memory point should be short, but it must come from the full explanation you just watched. In your notebook, write the rule, one example, one non-example, and the reason in one clean line.`,
    practice: `Now practice makes the learning independent. Try two or three small questions: one direct definition question, one example-or-non-example question, and one visual reasoning question. ${subjectHint.practice} If any answer is wrong, replay the visual step instead of guessing again.`,
  };
  return clampWords(stageText[stage] || stageText.visualExplanation, 60, 120);
}

function topicSpecificHint(context: string) {
  if (/matter|particle|solid|liquid|gas|evaporation|sublimation|latent|boiling|melting/.test(context)) {
    return {
      hook: "Your book, water bottle, chair, air in a balloon, and even the smell spreading from perfume are connected to matter.",
      definition: "Matter means anything that has mass and occupies space, so it can be felt through weight, volume, or the space it occupies.",
      visual: "particles will pack tightly, slide past one another, spread apart, dissolve into spaces, or escape from a surface.",
      breakdown: "For matter questions, always ask whether there is mass, occupied space, particle arrangement, particle motion, or a change of state.",
      example: "A balloon filled with air expands because air particles occupy space inside it, even though the air is invisible.",
      nonExample: "Heat, light, and sound are not matter in this school-level definition because they do not occupy space like particles of matter.",
      mistake: "Students often think only visible objects are matter, but air is matter because it has mass and fills space.",
      question: "Which item is matter: a stone, a glass of water, or air inside a balloon?",
      correction: "If it has mass and takes up space, count it as matter even when it is invisible.",
      summary: "Matter has mass, occupies space, and is made of moving particles that attract each other.",
      practice: "Classify book, air, smell, heat, ice, water vapour, and camphor vapour using the matter rule.",
    };
  }

  if (/irrational|rational|number system|decimal|root|√|pi|π|p\/q/.test(context)) {
    return {
      hook: "Numbers like 1/2 and 0.75 behave neatly as fractions, but numbers like root 2 and pi refuse to fit that fraction box.",
      definition: "An irrational number cannot be written as p over q, where p and q are integers and q is not zero.",
      visual: "the board will compare p over q form, decimal expansion, examples, non-examples, and the approximate place of root 2 on the number line.",
      breakdown: "First test p over q, then study the decimal expansion, then place the number correctly in the real number family.",
      example: "Root 2 is irrational because its decimal keeps going without ending and without repeating a fixed pattern.",
      nonExample: "Zero point three recurring is not irrational, because the repeating decimal equals 1 over 3.",
      mistake: "Students sometimes think every square root is irrational, but root 4 equals 2, so it is rational.",
      question: "Which is irrational: 3/4, 0.25, root 5, or 2?",
      correction: "The correct test is not just 'has a root'; the test is whether the number can be expressed as p over q.",
      summary: "Irrational numbers are real numbers that are not expressible as p over q and have non-terminating, non-repeating decimals.",
      practice: "Classify root 2, root 4, pi, 0.75, 0.333 recurring, and root 5 with reasons.",
    };
  }

  if (/fraction|pizza|numerator|denominator|parts/.test(context)) {
    return {
      hook: "Imagine a pizza, chocolate bar, or paper strip shared equally among friends.",
      definition: "A fraction shows selected equal parts of one whole, with the numerator on top and denominator below.",
      visual: "the circle or bar will divide into equal parts, selected parts will highlight, and the fraction will appear beside the picture.",
      breakdown: "First identify the whole, then count total equal parts, then count selected parts, then write selected over total.",
      example: "If 2 out of 8 equal pizza slices are selected, the fraction is 2 over 8.",
      nonExample: "If the parts are unequal, the picture does not correctly show a fraction of one whole.",
      mistake: "Students often swap numerator and denominator, writing total parts on top by mistake.",
      question: "If 3 parts are shaded out of 5 equal parts, what fraction is shaded?",
      correction: "The shaded or selected count goes on top; the total equal parts in the whole go below.",
      summary: "Fraction means selected equal parts divided by total equal parts of the same whole.",
      practice: "Draw 1/4, 2/8, and 3/5, then label numerator and denominator for each.",
    };
  }

  return {
    hook: `A real teacher starts ${context || "this idea"} from a familiar situation before naming the formal rule.`,
    definition: "The definition should explain the condition, the examples that satisfy it, and the boundary where it no longer applies.",
    visual: "the board will reveal the idea slowly through labels, movement, comparison, and a check question.",
    breakdown: "Move from meaning, to rule, to example, to non-example, then to practice.",
    example: "Use one clear case that satisfies the rule and explain the reason, not only the answer.",
    nonExample: "Use one nearby case that does not satisfy the rule so the boundary becomes visible.",
    mistake: "Students often memorize the heading but forget to test the condition.",
    question: "Which option follows the rule shown on the board?",
    correction: "Return to the definition, apply one condition at a time, and compare with the visual.",
    summary: "Meaning, condition, example, non-example, and practice make the concept stable.",
    practice: "Try one definition question, one example check, and one reason-based question.",
  };
}

function shortBoardTextForStage(stage: string, scene: VisualLessonScene, conceptTitle: string) {
  const labels: Record<string, string> = {
    realLifeHook: "Real-life hook",
    priorKnowledge: "What you already know",
    recall: "Recall first",
    definition: "Textbook definition",
    visualExplanation: "Watch the visual",
    stepBreakdown: "Break into steps",
    example: "Example",
    nonExample: "Non-example",
    commonMistake: "Common mistake",
    miniQuestion: "Quick check",
    correction: "Teacher correction",
    summary: "Memory point",
    practice: "Practice",
  };
  const label = labels[stage] || "Teacher step";
  if (/irrational/i.test(scene.title)) return `${label}: p/q test`;
  if (/fraction/i.test(scene.title)) return `${label}: selected / total`;
  if (/matter|particle|state|evaporation|sublimation|latent|heating|ice|water|steam/i.test(`${scene.title} ${conceptTitle}`)) return `${label}: particles`;
  return label;
}

function titleForStage(stage: string, scene: VisualLessonScene, conceptTitle: string) {
  const board = shortBoardTextForStage(stage, scene, conceptTitle);
  return board.includes(":") ? board.split(":")[0] : board;
}

function detailedSceneScript(scene: VisualLessonScene, conceptTitle: string) {
  return detailedNarrationForStage("definition", scene, conceptTitle, scene.teacherScript);
}

function buildStepCheck(scene: VisualLessonScene, conceptTitle: string) {
  return {
    question: scene.studentQuestion?.question || `What condition decides ${conceptTitle || scene.title}?`,
    options: scene.studentQuestion?.options || ["Definition", "Example only", "Guessing", "Heading only"],
    answer: scene.studentQuestion?.answer || "Definition",
    remediation: scene.studentQuestion?.explanation || "Replay the definition and visual explanation steps, then test the condition again.",
  };
}

function hasGenericContent(text: string) {
  const lower = text.toLowerCase();
  if (lower.trim() === "concept") return true;
  return [
    "this concept is part of the chapter",
    "this is one part of the chapter",
    "science ideas become clear",
    "now add the cause",
    "build a diagram",
    "add the cause or condition",
  ].some((phrase) => lower.includes(phrase));
}

function getLessonScenes(lesson: VisualLesson) {
  return lesson.chapterConcepts?.flatMap((concept) => concept.scenes) || lesson.scenes || [];
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function clampWords(text: string, min: number, max: number) {
  let expanded = text.trim();
  const coachingSentences = [
    "Watch the highlighted change, say the rule in your own words, and connect the example with the condition before moving to the next beat.",
    "Pause once more and compare the example with the non-example so the difference is clear enough to use independently in a new question.",
  ];
  let sentenceIndex = 0;
  while (countWords(expanded) < min) {
    expanded = `${expanded} ${coachingSentences[sentenceIndex % coachingSentences.length]}`;
    sentenceIndex += 1;
  }
  const words = expanded.split(/\s+/).filter(Boolean);
  return words.length > max ? `${words.slice(0, max).join(" ")}.` : expanded;
}

function toSlug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "step";
}

function getNumberLike(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getVisualString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getVisualStringArray(value: unknown, fallback: string[]) {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : fallback;
}

function getRowsFromUnknown(value: unknown) {
  return Array.isArray(value) ? value.map((row) => (Array.isArray(row) ? row.map((cell) => String(cell)) : [String(row)])) : [];
}

function getMarkerVisuals(base: Record<string, unknown>, stage: string, title: string) {
  const existing = Array.isArray(base.markers) ? base.markers : [];
  if (existing.length) return existing;
  if (/integer/.test(title)) {
    return [
      { label: "-2", value: -2 },
      { label: "0", value: 0 },
      { label: "2", value: 2 },
    ];
  }
  if (/irrational|root|√/.test(title)) {
    return stage === "realLifeHook"
      ? [
          { label: "1", value: 1 },
          { label: "2", value: 2 },
        ]
      : [
          { label: "1", value: 1 },
          { label: "√2 ≈ 1.414", value: 1.414 },
          { label: "2", value: 2 },
        ];
  }
  return [
    { label: "0", value: 0 },
    { label: "1/2", value: 0.5 },
    { label: "1", value: 1 },
  ];
}

function formulaLinesForScene(scene: VisualLessonScene, stage: string) {
  if (/irrational|rational/i.test(scene.title)) return ["p and q are integers", "q is not 0", "irrational numbers fail this form"];
  if (/exponent/i.test(scene.title)) return ["same base: add powers", "division: subtract powers", "power of power: multiply powers"];
  return [stage, scene.title, "definition + reason + example"];
}

function tableHeadersForScene(scene: VisualLessonScene) {
  if (/decimal|irrational|rational/i.test(scene.title)) return ["Number", "Decimal / form", "Type", "Reason"];
  return ["Step", "Board idea", "Reason"];
}

function tableRowsForScene(scene: VisualLessonScene, stage: string) {
  if (/decimal|irrational|rational/i.test(scene.title)) {
    return [
      ["1/2", "0.5", "Rational", "terminating decimal"],
      ["1/3", "0.333...", "Rational", "repeating decimal"],
      ["√2", "1.414213...", "Irrational", "non-terminating and non-repeating"],
    ];
  }
  return [[stage, scene.title, "watch, reason, answer"]];
}

function normalizeSlide(value: unknown): VisualLessonSlide | undefined {
  const input = asRecord(value);
  const title = asString(input.title);
  const teacherScript = asString(input.teacherScript);
  const visualType = visualTypes.includes(input.visualType as VisualType) ? (input.visualType as VisualType) : undefined;
  if (!title || !teacherScript || !visualType) return undefined;
  return {
    slideType: asString(input.slideType, "lesson"),
    title,
    teacherScript,
    visualType,
    visualData: asRecord(input.visualData),
    keyPoints: asStringArray(input.keyPoints),
    studentQuestion: asString(input.studentQuestion) || undefined,
    answer: asString(input.answer) || undefined,
  };
}

type TopicProfile = {
  concept: string;
  relatedConcept: string;
  hookTitle: string;
  knownTitle: string;
  knownExamples: string[];
  focusTitle: string;
  focusExamples: string[];
  definition: string;
  rule: string;
  ruleApplies: string;
  ruleDoesNotApply: string;
  examplesTitle: string;
  examples: string[];
  nonExamplesTitle: string;
  nonExamples: string[];
  exampleReason: string;
  stepRows: string[][];
  comparisonHeaders: string[];
  comparisonRows: string[][];
  visualSlide: Pick<VisualLessonSlide, "title" | "teacherScript" | "visualType" | "visualData" | "keyPoints">;
  mistake: string;
  correction: string;
  mistakeExample: string;
  quickQuestion: string;
  quickOptions: string[];
  quickAnswer: string;
  quickExplanation: string;
  studentQuestion: string;
  studentAnswer: string;
  summaryPoints: string[];
  memoryLine: string;
  practiceQuestion: string;
  practiceOptions: string[];
  practiceAnswer: string;
  practiceExplanation: string;
  scenes: VisualLessonScene[];
};

type SceneProfile = Omit<TopicProfile, "scenes">;

function createFallbackVisualLesson({
  grade,
  board,
  subject,
  chapterNumber,
  chapterName,
  conceptName,
  profile,
}: {
  grade: string;
  board: string;
  subject: string;
  chapterNumber: number;
  chapterName: string;
  conceptName: string;
  profile: TopicProfile;
}): VisualLesson {
  return deepenVisualLesson({
    title: `Chapter ${chapterNumber}: ${chapterName} - ${conceptName}`,
    lessonTitle: `${profile.concept} Cinematic Visual Lesson`,
    gradeLevel: `${grade} · ${subject} · ${board}`,
    classGrade: grade,
    subject,
    lessonScope: "topic",
    chapterTitle: chapterName,
    topicTitle: conceptName,
    mode: "cinematic-visual-teacher",
    scenes: profile.scenes,
    slides: buildTeacherSlides(profile),
  });
}

function createFallbackChapterVisualLesson({
  grade,
  board,
  subject,
  chapterNumber,
  chapterName,
  concepts,
}: {
  grade: string;
  board: string;
  subject: string;
  chapterNumber: number;
  chapterName: string;
  concepts: string[];
}): VisualLesson {
  const chapterConcepts = buildChapterConcepts({ board, subject, chapterName, concepts });
  const scenes = chapterConcepts.flatMap((concept) => concept.scenes);
  return deepenVisualLesson({
    title: `Chapter ${chapterNumber}: ${chapterName}`,
    lessonTitle: `${chapterName} Complete Cinematic Chapter`,
    gradeLevel: `${grade} · ${subject} · ${board}`,
    classGrade: grade,
    subject,
    lessonScope: "chapter",
    chapterTitle: chapterName,
    topicTitle: null,
    chapterConcepts,
    mode: "cinematic-visual-teacher",
    scenes,
    slides: buildChapterSlides(chapterName, chapterConcepts),
  });
}

function buildChapterConcepts({
  board,
  subject,
  chapterName,
  concepts,
}: {
  board: string;
  subject: string;
  chapterName: string;
  concepts: string[];
}): VisualLessonChapterConcept[] {
  const context = `${subject} ${chapterName}`.toLowerCase();
  if (/science/.test(context) && /matter in our surroundings/.test(context)) return buildMatterChapterConcepts();
  if (/math/.test(context) && /number systems/.test(context)) return buildNumberSystemsChapterConcepts();

  const suppliedConcepts = concepts.length ? concepts : ["Introduction", "Key terms", "Examples", "Practice"];
  const conceptNames = Array.from(
    new Set([...suppliedConcepts, "Chapter introduction", "Worked examples", "Common mistakes", "Revision practice"]),
  ).slice(0, 11);
  while (conceptNames.length < 6) conceptNames.push(`Learning checkpoint ${conceptNames.length + 1}`);
  const mainConcepts = conceptNames.map((conceptTitle, index) => {
    const profile = buildTopicProfile({ board, subject, chapterName, conceptName: conceptTitle, concepts: conceptNames });
    return {
      conceptNo: index + 1,
      conceptTitle,
      learningGoal: `Understand ${conceptTitle} through a visual rule, example, non-example, and practice.`,
      misconceptionToFix: misconceptionForConcept(conceptTitle),
      scenes: profile.scenes.slice(0, 1),
    };
  });
  return [
    ...mainConcepts,
    {
      conceptNo: mainConcepts.length + 1,
      conceptTitle: "Chapter summary",
      scenes: [summaryScene(chapterName, conceptNames)],
    },
    {
      conceptNo: mainConcepts.length + 2,
      conceptTitle: "Chapter quiz",
      scenes: [chapterQuizScene(chapterName, conceptNames[0] || chapterName)],
    },
  ];
}

function buildMatterChapterConcepts(): VisualLessonChapterConcept[] {
  const base = buildBaseMatterChapterConcepts();
  return [
    conceptGroup(1, "What is matter?", chapterOpeningScene("Matter in Our Surroundings", ["book", "water glass", "stone", "air balloon", "perfume"]), ...base[0].scenes),
    conceptGroup(2, "Matter has mass and occupies space", {
      sceneType: "states-of-matter-board",
      title: "Prove matter with mass and space",
      teacherScript: "A book, stone, water, and air in a balloon are matter because each has mass and occupies space.",
      steps: [
        { action: "showObjects", narration: "Place a book, stone, water glass, and balloon on the classroom table.", visual: { activeState: "solid", solidLabel: "book and stone", liquidLabel: "water glass", gasLabel: "air balloon", labels: ["mass", "space"] } },
        { action: "showMass", narration: "A balance icon shows that each object, including the air-filled balloon, has measurable mass.", visual: { activeState: "gas", labels: ["mass icon", "air has mass"] } },
        { action: "showSpace", narration: "The balloon expands because air particles occupy space inside it.", visual: { activeState: "gas", gasLabel: "air occupies space", labels: ["space icon"] } },
      ],
    }),
    conceptGroup(3, "Matter is made of particles", ...base[1].scenes),
    conceptGroup(4, "Particles have space between them", ...base[2].scenes),
    conceptGroup(5, "Particles are continuously moving", ...base[3].scenes),
    conceptGroup(6, "Diffusion", {
      sceneType: "particle-motion-board",
      title: "Perfume spreads through a room",
      teacherScript: "Diffusion is the movement and mixing of particles from a region of higher concentration to a region of lower concentration.",
      steps: [
        { action: "sprayPerfume", narration: "Perfume particles begin close together near the spray bottle.", visual: { state: "gas", particles: 24, motion: "slow", label: "high concentration", concentration: "high-left" } },
        { action: "spreadParticles", narration: "Continuous random motion carries perfume particles into the surrounding air.", visual: { state: "gas", particles: 34, motion: "fast", label: "particles spread", concentration: "mixing" } },
        { action: "reachRoom", narration: "The smell reaches distant parts of the room as particles mix from high concentration to low concentration.", visual: { state: "gas", particles: 40, motion: "fast", label: "diffusion", concentration: "even" } },
      ],
    }),
    conceptGroup(7, "Particles attract each other", ...base[4].scenes),
    conceptGroup(8, "Solid, liquid, and gas", ...base[5].scenes),
    conceptGroup(9, "Effect of temperature on particles", {
      sceneType: "particle-motion-board",
      title: "Heating changes particle motion",
      teacherScript: "When temperature rises, particles gain kinetic energy, move faster, and can overcome some attraction.",
      steps: [
        { action: "coolParticles", narration: "At lower temperature, particles have less kinetic energy and move more slowly.", visual: { state: "liquid", particles: 24, motion: "slow", temperature: "cool", label: "less kinetic energy" } },
        { action: "addHeat", narration: "Heat energy enters the material and increases particle motion.", visual: { state: "liquid", particles: 24, motion: "medium", temperature: "warming", label: "heat enters" } },
        { action: "fastParticles", narration: "At higher temperature, particles move faster and spread farther apart.", visual: { state: "gas", particles: 24, motion: "fast", temperature: "hot", label: "more kinetic energy" } },
      ],
    }),
    conceptGroup(10, "Melting and boiling", ...base[6].scenes, ...base[7].scenes),
    conceptGroup(11, "Latent heat", ...base[8].scenes),
    conceptGroup(12, "Evaporation", {
      sceneType: "evaporation-board",
      title: "Surface particles escape as vapour",
      teacherScript: "Evaporation is a surface phenomenon in which higher-energy liquid particles escape as vapour below the boiling point.",
      steps: [
        { action: "showSurface", narration: "Only particles at the open surface can escape directly into the air.", visual: { mode: "evaporation", vaporParticles: 2, factor: "surface phenomenon" } },
        { action: "selectFastParticles", narration: "Some surface particles have enough kinetic energy to overcome attraction.", visual: { mode: "evaporation", heat: true, vaporParticles: 6, factor: "high-energy particles" } },
        { action: "escapeAsVapour", narration: "Those particles leave the liquid and become vapour even below the boiling point.", visual: { mode: "evaporation", vaporParticles: 12, factor: "liquid to vapour at surface" } },
      ],
    }),
    conceptGroup(13, "Factors affecting evaporation", ...base[10].scenes),
    conceptGroup(14, "Sublimation", ...base[9].scenes),
    conceptGroup(15, "Chapter summary", summaryScene("Matter in Our Surroundings", ["matter has mass and occupies space", "matter is made of moving particles", "particles have space and attraction", "temperature changes particle motion and state", "evaporation and sublimation are distinct changes"])),
    conceptGroup(16, "Chapter quiz", chapterQuizScene("Matter in Our Surroundings", "particles of matter")),
  ];
}

function buildBaseMatterChapterConcepts(): VisualLessonChapterConcept[] {
  return [
    conceptGroup(1, "Meaning of matter", {
      sceneType: "states-of-matter-board",
      title: "Stone, water, and air are all matter",
      teacherScript: "Matter is anything that has mass and occupies space. We can see solids and liquids easily, and air also occupies space.",
      steps: [
        { action: "showSolid", narration: "A stone is matter because it has mass and takes up space.", visual: { activeState: "solid", solidLabel: "stone", liquidLabel: "water", gasLabel: "air balloon" } },
        { action: "showLiquid", narration: "Water is also matter. It has mass and takes the shape of its container.", visual: { activeState: "liquid" } },
        { action: "showGas", narration: "Air inside a balloon is matter too. It fills space even though we cannot see it directly.", visual: { activeState: "gas" } },
      ],
    }),
    conceptGroup(2, "Matter is made of particles", {
      sceneType: "particle-motion-board",
      title: "Zoom into matter",
      teacherScript: "If we imagine zooming into matter, we find tiny particles. These particles make up solids, liquids, and gases.",
      steps: [
        { action: "showObject", narration: "Start with a small piece of matter.", visual: { state: "solid", label: "matter", particles: 12, motion: "still" } },
        { action: "zoomIn", narration: "Now zoom in. The object is made of tiny particles.", visual: { particles: 24, label: "tiny particles", showBonds: true } },
        { action: "connectIdea", narration: "Different arrangements of particles create different states of matter.", visual: { state: "liquid", particles: 24, motion: "slow" } },
      ],
    }),
    conceptGroup(3, "Particles have space between them", {
      sceneType: "particle-motion-board",
      title: "There is space between particles",
      teacherScript: "Particles are not one solid block. There is space between them, and smaller particles can enter those spaces.",
      steps: [
        { action: "showSpaces", narration: "Look at the gaps between particles.", visual: { state: "liquid", particles: 18, spacing: "medium", label: "spaces between particles" } },
        { action: "addSugar", narration: "When sugar dissolves in water, sugar particles fit into spaces between water particles.", visual: { state: "liquid", particles: 24, guestParticles: 6, label: "sugar in water" } },
        { action: "explain", narration: "This is why the water level does not rise much after dissolving a little sugar.", visual: { state: "liquid", particles: 24, guestParticles: 10 } },
      ],
    }),
    conceptGroup(4, "Particles are continuously moving", {
      sceneType: "particle-motion-board",
      title: "Particles keep moving",
      teacherScript: "Particles of matter are continuously moving. Heating makes them move faster.",
      steps: [
        { action: "slowMotion", narration: "In a cooler liquid, particles move slowly.", visual: { state: "liquid", particles: 18, motion: "slow", label: "slow motion" } },
        { action: "heat", narration: "When we heat the matter, particles gain energy.", visual: { state: "liquid", particles: 18, motion: "medium", temperature: "warmer" } },
        { action: "fastMotion", narration: "With more energy, particles move faster.", visual: { state: "gas", particles: 18, motion: "fast", label: "fast motion" } },
      ],
    }),
    conceptGroup(5, "Particles attract each other", {
      sceneType: "particle-motion-board",
      title: "Attraction between particles",
      teacherScript: "Particles attract one another. The strength of attraction is different in solids, liquids, and gases.",
      steps: [
        { action: "strongAttraction", narration: "In solids, attraction is strong, so particles stay close.", visual: { state: "solid", particles: 16, attraction: "strong", showBonds: true } },
        { action: "mediumAttraction", narration: "In liquids, attraction is weaker, so particles can slide around.", visual: { state: "liquid", particles: 16, attraction: "medium" } },
        { action: "weakAttraction", narration: "In gases, attraction is very weak, so particles move far apart.", visual: { state: "gas", particles: 16, attraction: "weak" } },
      ],
    }),
    conceptGroup(6, "States of matter: solid, liquid, gas", {
      sceneType: "states-of-matter-board",
      title: "Compare solid, liquid, and gas",
      teacherScript: "The three common states of matter differ in shape, volume, particle space, and particle motion.",
      steps: [
        { action: "solid", narration: "A solid has fixed shape and fixed volume because particles are tightly packed.", visual: { activeState: "solid", solidLabel: "solid: fixed shape" } },
        { action: "liquid", narration: "A liquid has fixed volume but takes the shape of the container.", visual: { activeState: "liquid", liquidLabel: "liquid: flows" } },
        { action: "gas", narration: "A gas has no fixed shape or volume. It spreads to fill the container.", visual: { activeState: "gas", gasLabel: "gas: spreads" } },
      ],
      studentQuestion: {
        question: "Which state has particles far apart and moving fast?",
        options: ["Solid", "Liquid", "Gas", "All are same"],
        answer: "Gas",
        explanation: "Gas particles are far apart and move quickly.",
      },
    }),
    conceptGroup(7, "Change of state", {
      sceneType: "heating-curve-board",
      title: "Ice becomes water, then steam",
      teacherScript: "Matter can change state when heat energy changes particle motion and attraction.",
      steps: [
        { action: "ice", narration: "Ice is solid water. Its particles are locked in place.", visual: { phase: "ice", activeIndex: 0 } },
        { action: "water", narration: "After melting, particles can slide, so ice becomes liquid water.", visual: { phase: "water", activeIndex: 1 } },
        { action: "steam", narration: "After boiling, particles move far apart, so water becomes steam.", visual: { phase: "steam", activeIndex: 2 } },
      ],
    }),
    conceptGroup(8, "Melting, boiling, evaporation", {
      sceneType: "heating-curve-board",
      title: "Three ways water changes",
      teacherScript: "Melting changes solid to liquid. Boiling and evaporation change liquid to gas, but they happen differently.",
      steps: [
        { action: "melting", narration: "Melting is solid to liquid, like ice changing into water.", visual: { phase: "melting", activeIndex: 1, labels: ["melting point"] } },
        { action: "boiling", narration: "Boiling happens throughout the liquid at its boiling point.", visual: { phase: "boiling", activeIndex: 2, labels: ["boiling point"] } },
        { action: "evaporation", narration: "Evaporation happens at the surface, even below boiling point.", visual: { phase: "evaporation", activeIndex: 3, labels: ["surface change"] } },
      ],
    }),
    conceptGroup(9, "Latent heat", {
      sceneType: "heating-curve-board",
      title: "Heat can hide during state change",
      teacherScript: "During a change of state, heat energy is used to change the state, so temperature can stay constant.",
      steps: [
        { action: "addHeat", narration: "We keep adding heat to ice at its melting point.", visual: { phase: "melting", activeIndex: 1, plateau: true } },
        { action: "temperatureStays", narration: "The temperature stays constant during melting.", visual: { phase: "melting", activeIndex: 1, label: "temperature constant" } },
        { action: "latentHeat", narration: "This hidden heat used in changing state is called latent heat.", visual: { phase: "latent heat", activeIndex: 1, label: "latent heat" } },
      ],
    }),
    conceptGroup(10, "Sublimation", {
      sceneType: "evaporation-board",
      title: "Solid directly becomes vapour",
      teacherScript: "Sublimation is the change from solid directly to gas without becoming liquid.",
      steps: [
        { action: "showSolid", narration: "Start with camphor or dry ice as a solid.", visual: { mode: "sublimation", solidLabel: "camphor", vaporLabel: "vapour", vaporParticles: 2 } },
        { action: "vapour", narration: "On heating, it directly forms vapour.", visual: { mode: "sublimation", vaporParticles: 8 } },
        { action: "noLiquid", narration: "Notice that there is no liquid stage in between.", visual: { mode: "sublimation", vaporParticles: 12, label: "solid to gas" } },
      ],
    }),
    conceptGroup(11, "Factors affecting evaporation", {
      sceneType: "evaporation-board",
      title: "What makes evaporation faster?",
      teacherScript: "Evaporation becomes faster with higher temperature, larger surface area, lower humidity, and more wind speed.",
      steps: [
        { action: "temperature", narration: "Higher temperature gives surface particles more energy to escape.", visual: { mode: "evaporation", heat: true, vaporParticles: 5, factor: "higher temperature" } },
        { action: "surfaceArea", narration: "Larger surface area lets more particles escape at the same time.", visual: { mode: "evaporation", wideSurface: true, vaporParticles: 9, factor: "larger surface area" } },
        { action: "wind", narration: "Wind carries vapour away, so more particles can evaporate.", visual: { mode: "evaporation", wind: true, vaporParticles: 12, factor: "more wind speed" } },
      ],
    }),
    conceptGroup(12, "Chapter summary", summaryScene("Matter in Our Surroundings", ["matter has mass and occupies space", "particles have space, motion, and attraction", "states change with heat", "evaporation depends on conditions"])),
    conceptGroup(13, "Chapter quiz", chapterQuizScene("Matter in Our Surroundings", "gas particles")),
  ];
}

function buildNumberSystemsChapterConcepts(): VisualLessonChapterConcept[] {
  const base = buildBaseNumberSystemsChapterConcepts();
  return [
    conceptGroup(1, "Natural numbers", chapterOpeningScene("Number Systems", ["counting numbers", "zero", "negative numbers", "fractions", "√2", "π"]), ...base[0].scenes),
    conceptGroup(2, "Whole numbers", ...base[1].scenes),
    conceptGroup(3, "Integers", ...base[2].scenes),
    conceptGroup(4, "Rational numbers", ...base[3].scenes),
    conceptGroup(5, "Irrational numbers", ...buildIrrationalScenes().slice(0, 3)),
    conceptGroup(6, "Real numbers", ...base[5].scenes),
    conceptGroup(7, "Number line representation", ...base[6].scenes),
    conceptGroup(8, "Decimal expansion", ...base[7].scenes),
    conceptGroup(9, "Terminating and repeating decimals", {
      sceneType: "table-board",
      title: "Terminating and repeating decimals are rational",
      teacherScript: "A rational number has a decimal expansion that either terminates or repeats a fixed block.",
      steps: [
        { action: "terminating", narration: "One half becomes 0.5, which stops after one decimal place.", visual: { headers: ["Number", "Decimal", "Pattern"], rows: [["1/2", "0.5", "terminates"]] } },
        { action: "repeating", narration: "One third becomes 0.333 recurring, where the digit 3 repeats forever.", visual: { rows: [["1/3", "0.333...", "3 repeats"]] } },
        { action: "connectPQ", narration: "Both are rational because each number can be written in p over q form.", visual: { rows: [["Rule", "terminating or repeating", "rational"]] } },
      ],
    }),
    conceptGroup(10, "Non-terminating non-repeating decimals", {
      sceneType: "table-board",
      title: "Irrational decimals never settle into a pattern",
      teacherScript: "An irrational decimal continues without ending and without repeating a fixed block of digits.",
      steps: [
        { action: "showRootTwo", narration: "Root 2 begins 1.414213562 and continues without a repeating block.", visual: { headers: ["Number", "Decimal", "Pattern"], rows: [["√2", "1.414213562...", "no repeat"]] } },
        { action: "showPi", narration: "Pi begins 3.141592653 and also continues without a repeating block.", visual: { rows: [["π", "3.141592653...", "no repeat"]] } },
        { action: "compare", narration: "Non-terminating alone is not enough; the decimal must also be non-repeating.", visual: { rows: [["0.333...", "repeating", "rational"], ["√2", "non-repeating", "irrational"]] } },
      ],
    }),
    conceptGroup(11, "Rationalization basics", {
      sceneType: "formula-board",
      title: "Remove an irrational denominator",
      teacherScript: "Rationalization rewrites a fraction so that its denominator becomes rational without changing the value.",
      steps: [
        { action: "showFraction", narration: "Start with one over root 2, where the denominator is irrational.", visual: { formula: "1 / √2", lines: ["irrational denominator"] } },
        { action: "multiply", narration: "Multiply numerator and denominator by root 2, which is the same as multiplying by one.", visual: { formula: "(1 × √2) / (√2 × √2)", lines: ["multiply by √2/√2"] } },
        { action: "simplify", narration: "Root 2 times root 2 is 2, so the rationalized form is root 2 over 2.", visual: { formula: "√2 / 2", lines: ["rational denominator"] } },
      ],
    }),
    conceptGroup(12, "Laws of exponents", ...base[8].scenes),
    conceptGroup(13, "Chapter summary", summaryScene("Number Systems", ["natural and whole numbers", "integers and rational numbers", "irrational and real numbers", "decimal expansion and number-line representation", "rationalization and exponent laws"])),
    conceptGroup(14, "Chapter quiz", chapterQuizScene("Number Systems", "irrational numbers")),
  ];
}

function buildBaseNumberSystemsChapterConcepts(): VisualLessonChapterConcept[] {
  return [
    conceptGroup(1, "Natural numbers", numberSetScene("Natural numbers", "Natural numbers are counting numbers.", ["1", "2", "3", "4"], "Starts from 1")),
    conceptGroup(2, "Whole numbers", numberSetScene("Whole numbers", "Whole numbers include zero along with natural numbers.", ["0", "1", "2", "3"], "Natural numbers plus 0")),
    conceptGroup(3, "Integers", {
      sceneType: "number-line",
      title: "Integers on both sides of zero",
      teacherScript: "Integers include negative numbers, zero, and positive numbers.",
      steps: [
        { action: "showZero", narration: "Put zero at the center of the number line.", visual: { min: -4, max: 4, markers: [{ label: "0", value: 0 }] } },
        { action: "showPositive", narration: "Positive integers go to the right.", visual: { markers: [{ label: "1", value: 1 }, { label: "2", value: 2 }, { label: "3", value: 3 }] } },
        { action: "showNegative", narration: "Negative integers go to the left.", visual: { markers: [{ label: "-1", value: -1 }, { label: "-2", value: -2 }, { label: "-3", value: -3 }] } },
      ],
    }),
    conceptGroup(4, "Rational numbers", {
      sceneType: "formula-board",
      title: "Rational numbers fit p/q",
      teacherScript: "A rational number can be written as p over q, where p and q are integers and q is not zero.",
      steps: [
        { action: "writeForm", narration: "Write the form p over q.", visual: { formula: "p / q", lines: ["p and q are integers", "q is not 0"] } },
        { action: "examples", narration: "Examples are 1/2, 3, 0.75, and 0.333 repeating.", visual: { lines: ["1/2", "3 = 3/1", "0.75 = 3/4", "0.333... = 1/3"] } },
        { action: "test", narration: "If it can be written as p over q, it is rational.", visual: { formula: "p/q test" } },
      ],
    }),
    conceptGroup(5, "Irrational numbers", ...buildIrrationalScenes().slice(0, 1)),
    conceptGroup(6, "Real numbers", {
      sceneType: "comparison-board",
      title: "Real numbers include rational and irrational",
      teacherScript: "Real numbers are all numbers that can be placed on the number line.",
      steps: [
        { action: "rational", narration: "Rational numbers are one part of real numbers.", visual: { leftLabel: "Rational", leftItems: ["1/2", "3", "0.75"], leftValue: 0.7 } },
        { action: "irrational", narration: "Irrational numbers are also real numbers.", visual: { rightLabel: "Irrational", rightItems: ["√2", "π", "√5"], rightValue: 0.7 } },
        { action: "combine", narration: "Together they form the real number system.", visual: { comparison: "Rational + Irrational = Real numbers" } },
      ],
    }),
    conceptGroup(7, "Number line representation", {
      sceneType: "number-line",
      title: "Every real number has a point",
      teacherScript: "Natural numbers, integers, rational numbers, and irrational numbers can all be represented on the number line.",
      steps: [
        { action: "integers", narration: "First mark integers like 0, 1, and 2.", visual: { min: 0, max: 3, markers: [{ label: "0", value: 0 }, { label: "1", value: 1 }, { label: "2", value: 2 }] } },
        { action: "rational", narration: "Now mark 1/2 between 0 and 1.", visual: { markers: [{ label: "1/2", value: 0.5 }] } },
        { action: "irrational", narration: "Now mark √2 around 1.414.", visual: { markers: [{ label: "√2", value: 1.414 }] } },
      ],
    }),
    conceptGroup(8, "Decimal expansion", {
      sceneType: "table-board",
      title: "Decimals reveal the type",
      teacherScript: "Terminating and repeating decimals are rational. Non-terminating, non-repeating decimals are irrational.",
      steps: [
        { action: "terminating", narration: "0.5 terminates, so it is rational.", visual: { headers: ["Number", "Decimal", "Type"], rows: [["1/2", "0.5", "Rational"]] } },
        { action: "repeating", narration: "0.333... repeats, so it is rational.", visual: { rows: [["1/3", "0.333...", "Rational"]] } },
        { action: "nonRepeating", narration: "1.414213... neither ends nor repeats, so √2 is irrational.", visual: { rows: [["√2", "1.414213...", "Irrational"]] } },
      ],
    }),
    conceptGroup(9, "Laws of exponents", {
      sceneType: "formula-board",
      title: "Exponent laws for real numbers",
      teacherScript: "Exponent laws help us simplify powers when the base is a non-zero real number.",
      steps: [
        { action: "product", narration: "When bases are same, add powers: a to m times a to n equals a to m plus n.", visual: { formula: "a^m × a^n = a^(m+n)", lines: ["same base", "add powers"] } },
        { action: "quotient", narration: "When dividing same bases, subtract powers.", visual: { formula: "a^m / a^n = a^(m-n)", lines: ["same base", "subtract powers"] } },
        { action: "power", narration: "A power raised to another power means multiply the powers.", visual: { formula: "(a^m)^n = a^(mn)", lines: ["power of a power", "multiply powers"] } },
      ],
    }),
    conceptGroup(10, "Chapter summary", summaryScene("Number Systems", ["natural, whole, integers", "rational numbers fit p/q", "irrational numbers do not fit p/q", "all are real numbers on number line", "decimal expansion identifies type"])),
    conceptGroup(11, "Chapter quiz", chapterQuizScene("Number Systems", "irrational numbers")),
  ];
}

function conceptGroup(conceptNo: number, conceptTitle: string, ...scenes: VisualLessonScene[]): VisualLessonChapterConcept {
  return {
    conceptNo,
    conceptTitle,
    learningGoal: `Understand ${conceptTitle}, explain the textbook rule, and apply it to a new visual example.`,
    misconceptionToFix: misconceptionForConcept(conceptTitle),
    scenes,
  };
}

function misconceptionForConcept(conceptTitle: string) {
  const title = conceptTitle.toLowerCase();
  if (title.includes("matter")) return "Only visible solids and liquids are matter; invisible air is often forgotten.";
  if (title.includes("particle")) return "Particles are imagined as completely still or as having no space between them.";
  if (title.includes("diffusion")) return "Diffusion is mistaken for particles moving in only one fixed direction.";
  if (title.includes("evaporation")) return "Evaporation is confused with boiling and assumed to happen throughout the liquid.";
  if (title.includes("sublimation")) return "A liquid stage is incorrectly inserted between solid and gas.";
  if (title.includes("irrational")) return "Every square root is assumed to be irrational.";
  if (title.includes("rational")) return "Only written fractions are considered rational numbers.";
  if (title.includes("decimal")) return "Every non-terminating decimal is assumed to be irrational.";
  if (title.includes("fraction")) return "Numerator and denominator are swapped or unequal parts are counted.";
  return `The student may remember the heading ${conceptTitle} without checking its defining condition.`;
}

function numberSetScene(title: string, definition: string, examples: string[], clue: string): VisualLessonScene {
  return {
    sceneType: "table-board",
    title,
    teacherScript: definition,
    steps: [
      { action: "definition", narration: definition, visual: { headers: ["Set", "Examples", "Teacher clue"], rows: [[title, examples.join(", "), clue]] } },
      { action: "examples", narration: `Examples are ${examples.join(", ")}.`, visual: { rows: [[title, examples.join(", "), clue]] } },
      { action: "nonExample", narration: "Check the boundary by asking what is not included.", visual: { rows: [[title, examples.join(", "), clue], ["Boundary", title === "Natural numbers" ? "0 is not natural in NCERT Class 9" : "negative fractions are not integers", "Know the first missing case"]] } },
    ],
  };
}

function chapterOpeningScene(chapterName: string, visualObjects: string[]): VisualLessonScene {
  return {
    sceneType: "diagram-label",
    title: `${chapterName} cinematic opening`,
    teacherScript: `Begin the chapter by connecting familiar objects and prior knowledge to the full learning path for ${chapterName}.`,
    steps: [
      { action: "enterStage", narration: `The camera enters a classroom stage where the chapter begins with familiar examples.`, visual: { diagram: chapterName, labels: visualObjects.slice(0, 3), active: true } },
      { action: "revealPath", narration: `The remaining examples appear and connect into the chapter learning path.`, visual: { diagram: chapterName, labels: visualObjects, active: true } },
      { action: "setGoal", narration: `The teacher highlights what the student will understand by the end of the chapter.`, visual: { diagram: "chapter goal", labels: ["meaning", "visual proof", "examples", "practice"] } },
    ],
  };
}

function summaryScene(chapterName: string, points: string[]): VisualLessonScene {
  return {
    sceneType: "table-board",
    title: `${chapterName} summary`,
    teacherScript: "Let us collect the full chapter on one teacher board before the quiz.",
    steps: points.map((point, index) => ({
      action: `summaryPoint${index + 1}`,
      narration: point,
      visual: {
        headers: ["No.", "Chapter idea"],
        rows: [[String(index + 1), point]],
      },
    })),
  };
}

function chapterQuizScene(chapterName: string, answer: string): VisualLessonScene {
  return {
    sceneType: "quiz-visual",
    title: `${chapterName} chapter quiz`,
    teacherScript: "Now answer one chapter-level question using the visual lesson.",
    steps: [{ action: "showQuestion", narration: "Try this quick check before moving ahead.", visual: { question: `Which idea best matches ${answer}?` } }],
    studentQuestion: {
      question: `Which idea best matches ${answer}?`,
      options: [answer, "A memorized heading only", "A random example", "None of these"],
      answer,
      explanation: `The correct answer is ${answer} because it matches the chapter rule taught on the board.`,
    },
  };
}

function buildChapterSlides(chapterName: string, chapterConcepts: VisualLessonChapterConcept[]): VisualLessonSlide[] {
  return [
    {
      slideType: "hook",
      title: `Start ${chapterName}`,
      teacherScript: `We will learn ${chapterName} concept by concept, with visuals and quick checks.`,
      visualType: "summary-card",
      visualData: { keyTakeaways: chapterConcepts.slice(0, 5).map((concept) => concept.conceptTitle) },
      keyPoints: ["Learn in order.", "Watch each visual.", "Answer quick checks."],
    },
    {
      slideType: "summary",
      title: "Chapter path",
      teacherScript: "This is the full route for the chapter.",
      visualType: "comparison-table",
      visualData: {
        headers: ["No.", "Concept"],
        rows: chapterConcepts.map((concept) => [String(concept.conceptNo), concept.conceptTitle]),
      },
      keyPoints: chapterConcepts.map((concept) => concept.conceptTitle),
    },
    {
      slideType: "quick-check",
      title: "Chapter quiz",
      teacherScript: "Use the animated board first, then answer the chapter quiz.",
      visualType: "quiz-card",
      visualData: {
        question: `What should you do first when learning ${chapterName}?`,
        options: ["Watch the visual steps", "Skip examples", "Memorize only headings", "Avoid practice"],
        correctAnswer: "Watch the visual steps",
        explanation: "ConceptKid teaches by visual steps first, then quiz and practice.",
      },
      keyPoints: ["Visual first.", "Practice next.", "Quiz after understanding."],
    },
  ];
}

function buildTeacherSlides(profile: TopicProfile): VisualLessonSlide[] {
  return [
    {
      slideType: "hook",
      title: profile.hookTitle,
      teacherScript: `Let us begin with a teacher question. Which ideas already feel familiar, and which ones need a new rule for ${profile.concept}?`,
      visualType: "two-column-card",
      visualData: {
        leftTitle: profile.knownTitle,
        leftExamples: profile.knownExamples,
        rightTitle: profile.focusTitle,
        rightExamples: profile.focusExamples,
      },
      keyPoints: ["Start from what is already known.", `Use examples to notice what makes ${profile.concept} special.`],
    },
    {
      slideType: "definition",
      title: `Meaning of ${profile.concept}`,
      teacherScript: profile.definition,
      visualType: "formula-card",
      visualData: {
        formula: profile.rule,
        validFor: profile.ruleApplies,
        notValidFor: profile.ruleDoesNotApply,
      },
      keyPoints: [profile.definition, profile.ruleApplies, profile.ruleDoesNotApply],
    },
    {
      slideType: "visual-explanation",
      title: profile.visualSlide.title,
      teacherScript: profile.visualSlide.teacherScript,
      visualType: profile.visualSlide.visualType,
      visualData: profile.visualSlide.visualData,
      keyPoints: profile.visualSlide.keyPoints,
    },
    {
      slideType: "example",
      title: "Examples and non-examples",
      teacherScript: `A real teacher checks both sides. Examples show ${profile.concept}; non-examples look close but fail the rule.`,
      visualType: "example-card",
      visualData: {
        examplesTitle: profile.examplesTitle,
        examples: profile.examples,
        nonExamplesTitle: profile.nonExamplesTitle,
        nonExamples: profile.nonExamples,
        reason: profile.exampleReason,
      },
      keyPoints: ["Examples show the rule.", "Non-examples show the boundary.", profile.exampleReason],
    },
    {
      slideType: "step-by-step",
      title: "How to reason step by step",
      teacherScript: `Use this thinking path whenever you see a question about ${profile.concept}.`,
      visualType: "comparison-table",
      visualData: {
        headers: ["Step", "Teacher asks", "Student checks"],
        rows: profile.stepRows,
      },
      keyPoints: profile.stepRows.map((row) => row[2]).filter(Boolean).slice(0, 3),
    },
    {
      slideType: "comparison",
      title: `${profile.concept} vs ${profile.relatedConcept}`,
      teacherScript: `Now compare ${profile.concept} with ${profile.relatedConcept}. The difference becomes clear when we place the ideas side by side.`,
      visualType: "comparison-table",
      visualData: {
        headers: profile.comparisonHeaders,
        rows: profile.comparisonRows,
      },
      keyPoints: profile.comparisonRows.map((row) => row[row.length - 1]).filter(Boolean).slice(0, 3),
    },
    {
      slideType: "common-mistake",
      title: "Common mistake",
      teacherScript: `Here is a common trap. If you spot it early, ${profile.concept} becomes much easier.`,
      visualType: "mistake-card",
      visualData: {
        mistake: profile.mistake,
        correction: profile.correction,
        example: profile.mistakeExample,
      },
      keyPoints: [profile.mistake, profile.correction],
    },
    {
      slideType: "quick-check",
      title: "Quick check",
      teacherScript: "Pause and answer this like a student in class. Then use the explanation to correct your thinking.",
      visualType: "quiz-card",
      visualData: {
        question: profile.quickQuestion,
        options: profile.quickOptions,
        correctAnswer: profile.quickAnswer,
        explanation: profile.quickExplanation,
      },
      keyPoints: [profile.quickExplanation],
      studentQuestion: profile.studentQuestion,
      answer: profile.studentAnswer,
    },
    {
      slideType: "summary",
      title: "Teacher board summary",
      teacherScript: `Let us collect the main ideas about ${profile.concept} before practice.`,
      visualType: "summary-card",
      visualData: {
        keyTakeaways: profile.summaryPoints,
        memoryLine: profile.memoryLine,
      },
      keyPoints: profile.summaryPoints,
    },
    {
      slideType: "practice",
      title: "Practice question",
      teacherScript: `Now try one question. Do not guess. Use the rule for ${profile.concept}, then check your answer.`,
      visualType: "quiz-card",
      visualData: {
        question: profile.practiceQuestion,
        options: profile.practiceOptions,
        correctAnswer: profile.practiceAnswer,
        explanation: profile.practiceExplanation,
      },
      keyPoints: ["Use the definition.", "Test one example.", "Explain your answer."],
    },
  ];
}

function buildTopicProfile({
  board,
  subject,
  chapterName,
  conceptName,
  concepts,
}: {
  board: string;
  subject: string;
  chapterName: string;
  conceptName: string;
  concepts: string[];
}): TopicProfile {
  const concept = conceptName === "All Concepts" ? chapterName : conceptName;
  const context = `${subject} ${chapterName} ${concept}`.toLowerCase();
  if (/math|mathematics/.test(subject.toLowerCase())) return buildMathProfile(concept, chapterName, concepts, context, board);
  if (/science|physics|chemistry|biology/.test(subject.toLowerCase())) return buildScienceProfile(concept, chapterName, concepts, board);
  if (/english|language|grammar|literature/.test(subject.toLowerCase())) return buildLanguageProfile(concept, chapterName, concepts, board);
  if (/social|history|geography|civics|political|economics/.test(subject.toLowerCase())) return buildSocialScienceProfile(concept, chapterName, concepts, board);
  return buildGeneralProfile(concept, chapterName, concepts, board);
}

function buildMathProfile(concept: string, chapterName: string, concepts: string[], context: string, board: string): TopicProfile {
  if (/fraction/.test(context)) {
    return createProfile({
      concept,
      chapterName,
      concepts,
      board,
      relatedConcept: "Whole numbers",
      hookTitle: "How can one whole become equal parts?",
      knownTitle: "One whole",
      knownExamples: ["One full pizza", "One complete bar", "One full cake"],
      focusTitle: "Selected equal parts",
      focusExamples: ["1/4", "2/8", "3/5"],
      definition: "A fraction shows selected equal parts of one whole. The top number counts selected parts and the bottom number counts total equal parts.",
      rule: "selected parts / total equal parts",
      ruleApplies: "Use a fraction when the whole is divided into equal parts.",
      ruleDoesNotApply: "Do not use one simple fraction for unequal pieces.",
      examplesTitle: "Fractions",
      examples: ["1/4", "2/8", "3/5"],
      nonExamplesTitle: "Not fair fractions",
      nonExamples: ["Unequal pizza slices", "3 selected but no total", "A whole not divided"],
      exampleReason: "The denominator tells total equal parts; the numerator tells selected parts.",
      stepRows: [
        ["1", "What is the whole?", "Start with one complete object."],
        ["2", "Are the parts equal?", "Fractions need equal parts."],
        ["3", "How many parts are selected?", "This becomes the numerator."],
        ["4", "How many equal parts in all?", "This becomes the denominator."],
      ],
      comparisonHeaders: ["Fraction", "Selected parts", "Total equal parts", "Meaning"],
      comparisonRows: [
        ["1/4", "1", "4", "One part out of four"],
        ["2/8", "2", "8", "Two parts out of eight"],
        ["3/5", "3", "5", "Three parts out of five"],
      ],
      visualSlide: {
        title: "Fractions are parts of a whole",
        teacherScript: "Watch the whole split into equal parts. Then count selected parts on top and total equal parts below.",
        visualType: "formula-card",
        visualData: {
          formula: "numerator / denominator",
          validFor: "2/8 means 2 selected parts out of 8 equal parts.",
          notValidFor: "Unequal parts cannot be counted as one fair fraction.",
        },
        keyPoints: ["Start with one whole.", "Split into equal parts.", "Count selected parts and total parts."],
      },
      mistake: "Counting unequal parts as if they were fair fraction parts.",
      correction: "First check that all parts are equal, then write selected parts over total equal parts.",
      mistakeExample: "If a pizza is cut into unequal slices, one slice is not automatically 1/4.",
      quickQuestion: "A bar has 5 equal parts and 3 are shaded. What is the fraction?",
      quickOptions: ["3/5", "5/3", "2/5", "3/2"],
      quickAnswer: "3/5",
      quickExplanation: "The selected parts are 3 and the total equal parts are 5.",
      studentQuestion: "What does the denominator show?",
      studentAnswer: "It shows the total number of equal parts.",
      summaryPoints: ["Fractions show equal parts of a whole.", "Numerator means selected parts.", "Denominator means total equal parts."],
      memoryLine: "Top is selected; bottom is total.",
      practiceQuestion: "If 3 out of 8 equal parts are selected, what is the fraction?",
      practiceOptions: ["3/8", "8/3", "3/5", "5/8"],
      practiceAnswer: "3/8",
      practiceExplanation: "Selected parts go on top, and total equal parts go below.",
      scenes: buildFractionScenes(),
    });
  }

  if (/irrational/.test(context)) {
    return createProfile({
      concept,
      chapterName,
      concepts,
      board,
      relatedConcept: "Rational numbers",
      hookTitle: "Can every number be written as a fraction?",
      knownTitle: "Can be written as p/q",
      knownExamples: ["1/2", "3", "0.75", "0.333..."],
      focusTitle: "Cannot be written as p/q",
      focusExamples: ["√2", "√3", "√5", "π"],
      definition: "An irrational number cannot be written as p/q, where p and q are integers and q is not zero.",
      rule: "Not expressible as p / q",
      ruleApplies: "Numbers like √2, √3, √5, and π have non-terminating, non-repeating decimal expansions.",
      ruleDoesNotApply: "Fractions, integers, terminating decimals, and repeating decimals are rational.",
      examplesTitle: "Irrational examples",
      examples: ["√2", "√3", "√5", "π"],
      nonExamplesTitle: "Rational non-examples",
      nonExamples: ["1/2", "3", "0.75", "0.333..."],
      exampleReason: "The non-examples can be written as p/q, but the irrational examples cannot.",
      stepRows: [
        ["1", "Can it be written as p/q?", "If yes, it is rational."],
        ["2", "Does the decimal terminate?", "Terminating decimals are rational."],
        ["3", "Does the decimal repeat?", "Repeating decimals are rational."],
        ["4", "Does it never end and never repeat?", "Then it is irrational."],
      ],
      comparisonHeaders: ["Feature", "Rational", "Irrational", "Classroom clue"],
      comparisonRows: [
        ["Fraction form", "Can be written as p/q", "Cannot be written as p/q", "Check the p/q condition"],
        ["Decimal", "Terminates or repeats", "Never ends and never repeats", "Look for a repeating pattern"],
        ["Examples", "1/2, 3, 0.75", "√2, √3, π", "Sort by the rule"],
      ],
      visualSlide: {
        title: "Where is √2 on the number line?",
        teacherScript: "√2 is approximately 1.414. That places it between 1 and 2, so irrational numbers also have fixed positions on the number line.",
        visualType: "number-line",
        visualData: {
          min: 0,
          max: 3,
          markers: [
            { label: "1", value: 1 },
            { label: "√2 ≈ 1.414", value: 1.414 },
            { label: "2", value: 2 },
          ],
        },
        keyPoints: ["Irrational numbers are real numbers.", "They can be shown on a number line."],
      },
      mistake: "Thinking every never-ending decimal is irrational.",
      correction: "Only non-terminating and non-repeating decimals are irrational. Repeating decimals are rational.",
      mistakeExample: "0.333... = 1/3, so it is rational.",
      quickQuestion: "Which one is an irrational number?",
      quickOptions: ["3/4", "0.25", "√5", "2"],
      quickAnswer: "√5",
      quickExplanation: "√5 cannot be written as p/q and its decimal is non-terminating and non-repeating.",
      studentQuestion: "Why is 0.25 rational?",
      studentAnswer: "Because 0.25 = 1/4, so it can be written as p/q.",
      summaryPoints: ["Cannot be written as p/q", "Decimal never ends and never repeats", "Examples include √2, √3, √5, and π"],
      memoryLine: "No p/q and no repeating pattern means irrational.",
      practiceQuestion: "Which list contains only irrational numbers?",
      practiceOptions: ["√2, √3, π", "1/2, √5, 3", "0.75, 0.333..., 2", "3, 4, 5"],
      practiceAnswer: "√2, √3, π",
      practiceExplanation: "Each number in this list cannot be written as p/q.",
      scenes: buildIrrationalScenes(),
    });
  }

  if (/equation|linear/.test(context)) {
    return createProfile({
      concept,
      chapterName,
      concepts,
      board,
      relatedConcept: "Expressions",
      definition: `${concept} means a mathematical statement with an equals sign that can be solved by keeping both sides balanced.`,
      rule: "Do the same operation on both sides",
      ruleApplies: "Balanced equations such as 2x + 3 = 11.",
      ruleDoesNotApply: "Expressions such as 2x + 3 because there is no equals sign to solve.",
      examples: ["2x + 3 = 11", "x - 5 = 9", "3y = 12"],
      nonExamples: ["2x + 3", "5a - 7", "A number pattern without an equals sign"],
      exampleReason: "An equation has two sides connected by equals, and solving means finding the unknown value.",
      stepRows: [
        ["1", "Where is the unknown?", "Circle the variable."],
        ["2", "What operation is attached?", "Undo addition, subtraction, multiplication, or division."],
        ["3", "What happens to the other side?", "Do the same operation to keep balance."],
        ["4", "Does the value work?", "Substitute it back and check."],
      ],
      visualSlide: {
        title: "Think of an equation as a balance",
        teacherScript: "If one side changes, the other side must change the same way. That is why we do the same operation on both sides.",
        visualType: "formula-card",
        visualData: {
          formula: "2x + 3 = 11 → 2x = 8 → x = 4",
          validFor: "Solving equations while keeping both sides equal.",
          notValidFor: "Changing only one side of the equation.",
        },
        keyPoints: ["Keep both sides balanced.", "Undo operations step by step.", "Check by substitution."],
      },
      mistake: "Changing only one side of the equation.",
      correction: "Whatever operation you do on one side, do the same on the other side.",
      mistakeExample: "From x + 3 = 8, subtract 3 from both sides to get x = 5.",
      quickQuestion: "What is the first safe move for x + 6 = 10?",
      quickOptions: ["Subtract 6 from both sides", "Add 6 to both sides", "Change x to 10", "Ignore the equals sign"],
      quickAnswer: "Subtract 6 from both sides",
      quickExplanation: "Subtracting 6 from both sides keeps the equation balanced and gives x = 4.",
      practiceQuestion: "Solve: 3x = 15",
      practiceOptions: ["x = 3", "x = 5", "x = 12", "x = 45"],
      practiceAnswer: "x = 5",
      practiceExplanation: "Divide both sides by 3, so x = 5.",
      scenes: buildEquationScenes(concept),
    });
  }

  return createProfile({
    concept,
    chapterName,
    concepts,
    board,
    relatedConcept: concepts.find((item) => item !== concept) || "a related maths idea",
    definition: `${concept} is understood by identifying the rule, representing it visually, and checking examples against the rule.`,
    rule: `Rule for ${concept}`,
    ruleApplies: "Examples that satisfy the mathematical condition.",
    ruleDoesNotApply: "Similar-looking cases that break the condition.",
    examples: [`A clear ${concept} example`, `A worked example from ${chapterName}`, "A diagram or table that matches the rule"],
    nonExamples: [`A similar case that is not ${concept}`, "A value that breaks the condition", "A shortcut that does not preserve the rule"],
    exampleReason: "In maths, the reason matters as much as the answer.",
    stepRows: [
      ["1", "What is given?", "List the values, diagram labels, or condition."],
      ["2", "Which rule applies?", `Choose the rule for ${concept}.`],
      ["3", "How can we show it?", "Use a table, formula, diagram, or number line."],
      ["4", "Does the answer satisfy the rule?", "Check the result with the original condition."],
    ],
    visualSlide: {
      title: `Visual model for ${concept}`,
      teacherScript: `Represent ${concept} with a rule card first, then connect it to an example.`,
      visualType: "formula-card",
      visualData: {
        formula: `Given → rule for ${concept} → check`,
        validFor: "Questions where the condition matches the rule.",
        notValidFor: "Questions where the condition is different.",
      },
      keyPoints: ["Read the condition.", "Apply the rule.", "Check the answer."],
    },
    mistake: "Using a memorized rule without checking if the condition matches.",
    correction: "Read the question, identify the condition, then choose the rule.",
    mistakeExample: `Ask: does this example actually match ${concept}?`,
  });
}

function buildScienceProfile(concept: string, chapterName: string, concepts: string[], board: string): TopicProfile {
  return createProfile({
    concept,
    chapterName,
    concepts,
    board,
    relatedConcept: concepts.find((item) => item !== concept) || "a related science idea",
    definition: `${concept} is a science idea we understand by observing what happens, naming the cause, and connecting it to evidence.`,
    rule: "Observation → cause → evidence",
    ruleApplies: "Situations where the observation can be explained using evidence.",
    ruleDoesNotApply: "Guesses that do not match the observation or evidence.",
    examples: [`A lab or daily-life observation of ${concept}`, `A diagram from ${chapterName}`, "A measured or visible effect"],
    nonExamples: ["A guess without evidence", "A similar event with a different cause", "A statement that cannot be observed or tested"],
    exampleReason: "Science explanations connect what we see with why it happens.",
    stepRows: [
      ["1", "What do we observe?", "Describe what is seen or measured."],
      ["2", "What is changing?", "Identify the object, material, or process."],
      ["3", "What causes it?", `Use ${concept} to explain the cause.`],
      ["4", "What is the evidence?", "Point to a result, diagram, or example."],
    ],
    comparisonHeaders: ["Question", concept, "Related idea", "Evidence clue"],
    comparisonRows: [
      ["What is happening?", "Explains this concept", "Explains a nearby concept", "Look at the observation"],
      ["How do we know?", "Evidence matches the rule", "Evidence points elsewhere", "Use data or a diagram"],
      ["Classroom test", "Can be explained and checked", "Needs a different explanation", "Ask what changed"],
    ],
    visualSlide: {
      title: `See ${concept} as cause and effect`,
      teacherScript: `A clear science explanation shows the cause, the effect, and the evidence between them.`,
      visualType: "comparison-table",
      visualData: {
        headers: ["Cause", "Effect", "Evidence"],
        rows: [
          [`Cause linked to ${concept}`, "Visible change or result", "Observation or data"],
          ["Different cause", "Different result", "Different evidence"],
        ],
      },
      keyPoints: ["Observe first.", "Explain with cause.", "Support with evidence."],
    },
    mistake: "Writing a definition without connecting it to evidence.",
    correction: "Always add what we observe and why it proves the idea.",
    mistakeExample: `For ${concept}, say what happens and how you know.`,
    scenes: buildScienceScenes(concept, chapterName),
  });
}

function buildLanguageProfile(concept: string, chapterName: string, concepts: string[], board: string): TopicProfile {
  return createProfile({
    concept,
    chapterName,
    concepts,
    board,
    relatedConcept: concepts.find((item) => item !== concept) || "a related language idea",
    definition: `${concept} is understood by noticing its purpose in a sentence or text and checking how it changes meaning.`,
    rule: "Purpose + form + meaning",
    ruleApplies: "Sentences or text examples where the purpose and form match.",
    ruleDoesNotApply: "Similar-looking words or lines with a different purpose.",
    examples: [`A sentence that clearly shows ${concept}`, `A line from ${chapterName}`, "A short example with the right purpose"],
    nonExamples: ["A sentence with a different purpose", "A word used in another role", "A line that does not match the rule"],
    exampleReason: "In language, the role of a word or line depends on how it is used.",
    stepRows: [
      ["1", "Where is it used?", "Find the word, phrase, sentence, or line."],
      ["2", "What job does it do?", "Check purpose in context."],
      ["3", "What meaning changes?", "Explain the effect on the reader."],
      ["4", "Can we prove it?", "Quote or point to the exact clue."],
    ],
    comparisonHeaders: ["Feature", concept, "Related idea", "Clue in text"],
    comparisonRows: [
      ["Purpose", "Does this exact job", "Does a different job", "Read the surrounding sentence"],
      ["Form", "Matches the rule", "Looks similar but functions differently", "Check placement and role"],
      ["Effect", "Changes meaning in this way", "Changes meaning differently", "Explain the reader effect"],
    ],
    visualSlide: {
      title: `Mark the clues for ${concept}`,
      teacherScript: `Read the sentence slowly, underline the clue, and ask what job it is doing.`,
      visualType: "formula-card",
      visualData: {
        formula: "Text clue → purpose → meaning",
        validFor: "Examples where the text clue matches the purpose.",
        notValidFor: "Examples where the same word or line does a different job.",
      },
      keyPoints: ["Use context.", "Name the purpose.", "Explain the effect."],
    },
    mistake: "Naming the term without proving it from the sentence or text.",
    correction: "Point to the clue and explain its job.",
    mistakeExample: `Say: this is ${concept} because the clue shows its purpose.`,
  });
}

function buildSocialScienceProfile(concept: string, chapterName: string, concepts: string[], board: string): TopicProfile {
  return createProfile({
    concept,
    chapterName,
    concepts,
    board,
    relatedConcept: concepts.find((item) => item !== concept) || "a related social science idea",
    definition: `${concept} is understood by connecting the idea to people, place, time, cause, and consequence.`,
    rule: "Who/where/when → cause → effect",
    ruleApplies: "Events, places, or systems where the cause and effect match the concept.",
    ruleDoesNotApply: "Similar events or terms with a different cause, place, or effect.",
    examples: [`A case study related to ${concept}`, `A map, timeline, or civic example from ${chapterName}`, "A cause-and-effect situation"],
    nonExamples: ["A similar term from a different context", "An event with a different cause", "A statement missing place, time, or effect"],
    exampleReason: "Social science ideas become clear when we connect context with consequences.",
    stepRows: [
      ["1", "Who or what is involved?", "Name the people, place, group, or institution."],
      ["2", "What caused it?", "Find the reason or background."],
      ["3", "What changed?", `Connect the change to ${concept}.`],
      ["4", "Why does it matter?", "Explain the effect or importance."],
    ],
    comparisonHeaders: ["Lens", concept, "Related idea", "Clue"],
    comparisonRows: [
      ["Context", "This place or situation", "Different place or situation", "Look for who, where, and when"],
      ["Cause", "This reason", "Different reason", "Ask why it happened"],
      ["Effect", "This consequence", "Different consequence", "Ask what changed"],
    ],
    visualSlide: {
      title: `Cause and effect map for ${concept}`,
      teacherScript: `Place ${concept} in the middle, then connect the cause before it and the effect after it.`,
      visualType: "comparison-table",
      visualData: {
        headers: ["Before", "Concept", "After"],
        rows: [[`Cause or background`, concept, "Effect or importance"]],
      },
      keyPoints: ["Use context.", "Track cause.", "Explain consequence."],
    },
    mistake: "Memorizing dates or terms without explaining cause and effect.",
    correction: "Attach the term to context, cause, and consequence.",
    mistakeExample: `For ${concept}, explain what caused it and why it mattered.`,
  });
}

function buildGeneralProfile(concept: string, chapterName: string, concepts: string[], board: string): TopicProfile {
  return createProfile({
    concept,
    chapterName,
    concepts,
    board,
    relatedConcept: concepts.find((item) => item !== concept) || "a related idea",
    definition: `${concept} means the main idea, rule, or process we use to understand this topic clearly.`,
    rule: `Meaning → example → reason`,
    ruleApplies: `Examples that match the meaning of ${concept}.`,
    ruleDoesNotApply: `Cases that look similar but do not match ${concept}.`,
    examples: [`A clear example of ${concept}`, `A textbook-style example from ${chapterName}`, "A daily-life connection"],
    nonExamples: [`A similar case that is not ${concept}`, "A wrong shortcut", "A statement with missing reason"],
    exampleReason: "The comparison helps the definition become visible.",
    stepRows: [
      ["1", "What does the term mean?", "Say the meaning in simple words."],
      ["2", "What example shows it?", "Pick one clear example."],
      ["3", "What is not an example?", "Name a close non-example."],
      ["4", "How do we know?", "Give the reason."],
    ],
    visualSlide: {
      title: `Build ${concept} from examples`,
      teacherScript: `We will understand ${concept} by placing one example next to one non-example and reading the difference.`,
      visualType: "example-card",
      visualData: {
        examplesTitle: "Example",
        examples: [`A clear ${concept} case`],
        nonExamplesTitle: "Non-example",
        nonExamples: [`A close but wrong case`],
        reason: "The reason explains the difference.",
      },
      keyPoints: ["Use a clear example.", "Compare with a non-example.", "Say the reason."],
    },
    mistake: "Remembering only the name of the concept.",
    correction: "Connect the name to a meaning, example, and reason.",
    mistakeExample: `Ask: what makes this ${concept}?`,
  });
}

function createProfile({
  concept,
  chapterName,
  concepts,
  board,
  relatedConcept = concepts.find((item) => item !== concept) || "a related idea",
  hookTitle = `What makes ${concept} different?`,
  knownTitle = "Already familiar",
  knownExamples = concepts.filter((item) => item !== concept).slice(0, 3),
  focusTitle = "Today we focus on",
  focusExamples = [concept],
  definition,
  rule,
  ruleApplies,
  ruleDoesNotApply,
  examplesTitle = `${concept} examples`,
  examples,
  nonExamplesTitle = "Non-examples",
  nonExamples,
  exampleReason,
  stepRows,
  comparisonHeaders = ["Feature", concept, relatedConcept, "Teacher clue"],
  comparisonRows,
  visualSlide,
  mistake,
  correction,
  mistakeExample,
  quickQuestion,
  quickOptions,
  quickAnswer,
  quickExplanation,
  studentQuestion,
  studentAnswer,
  summaryPoints,
  memoryLine,
  practiceQuestion,
  practiceOptions,
  practiceAnswer,
  practiceExplanation,
  scenes,
}: {
  concept: string;
  chapterName: string;
  concepts: string[];
  board: string;
  relatedConcept?: string;
  hookTitle?: string;
  knownTitle?: string;
  knownExamples?: string[];
  focusTitle?: string;
  focusExamples?: string[];
  definition: string;
  rule: string;
  ruleApplies: string;
  ruleDoesNotApply: string;
  examplesTitle?: string;
  examples: string[];
  nonExamplesTitle?: string;
  nonExamples: string[];
  exampleReason: string;
  stepRows: string[][];
  comparisonHeaders?: string[];
  comparisonRows?: string[][];
  visualSlide: TopicProfile["visualSlide"];
  mistake: string;
  correction: string;
  mistakeExample: string;
  quickQuestion?: string;
  quickOptions?: string[];
  quickAnswer?: string;
  quickExplanation?: string;
  studentQuestion?: string;
  studentAnswer?: string;
  summaryPoints?: string[];
  memoryLine?: string;
  practiceQuestion?: string;
  practiceOptions?: string[];
  practiceAnswer?: string;
  practiceExplanation?: string;
  scenes?: VisualLessonScene[];
}): TopicProfile {
  const safeKnownExamples = knownExamples.length ? knownExamples : [`A known idea from ${chapterName}`, "A familiar example", "A related concept"];
  const safeComparisonRows = comparisonRows || [
    ["Meaning", definition, relatedConcept, "Compare definitions"],
    ["Example", examples[0] || concept, nonExamples[0] || relatedConcept, "Check which one matches the rule"],
    ["Reason", ruleApplies, ruleDoesNotApply, "Always explain why"],
  ];
  const safeQuickOptions = quickOptions || [examples[0] || concept, nonExamples[0] || relatedConcept, "A random guess", "None of these"];
  const safeQuickAnswer = quickAnswer || safeQuickOptions[0];
  const safePracticeOptions = practiceOptions || [examples[0] || concept, nonExamples[0] || relatedConcept, "Only memorize the term", "Skip the reason"];
  const safePracticeAnswer = practiceAnswer || safePracticeOptions[0];

  const profileWithoutScenes = {
    concept,
    relatedConcept,
    hookTitle,
    knownTitle,
    knownExamples: safeKnownExamples,
    focusTitle,
    focusExamples,
    definition,
    rule,
    ruleApplies,
    ruleDoesNotApply,
    examplesTitle,
    examples,
    nonExamplesTitle,
    nonExamples,
    exampleReason,
    stepRows,
    comparisonHeaders,
    comparisonRows: safeComparisonRows,
    visualSlide,
    mistake,
    correction,
    mistakeExample,
    quickQuestion: quickQuestion || `Which option best shows ${concept}?`,
    quickOptions: safeQuickOptions,
    quickAnswer: safeQuickAnswer,
    quickExplanation: quickExplanation || `${safeQuickAnswer} matches the rule: ${ruleApplies}`,
    studentQuestion: studentQuestion || `How can you prove an example is ${concept}?`,
    studentAnswer: studentAnswer || "Use the definition, then show which part of the example matches it.",
    summaryPoints: summaryPoints || [definition, ruleApplies, exampleReason],
    memoryLine: memoryLine || `${board} habit: meaning, example, reason, practice.`,
    practiceQuestion: practiceQuestion || `Which answer follows the rule for ${concept}?`,
    practiceOptions: safePracticeOptions,
    practiceAnswer: safePracticeAnswer,
    practiceExplanation: practiceExplanation || `${safePracticeAnswer} follows the definition and the rule for ${concept}.`,
  };

  return {
    ...profileWithoutScenes,
    scenes: scenes?.length ? scenes : buildDefaultScenes(profileWithoutScenes),
  };
}

function buildFractionScenes(): VisualLessonScene[] {
  return [
    {
      sceneType: "fraction-circle",
      title: "What does one part of a whole look like?",
      teacherScript: "Imagine this circle is a pizza. First we see one whole, then we divide it into equal parts.",
      steps: [
        { action: "showWhole", narration: "This is one whole pizza.", visual: { shape: "circle", label: "1 whole", parts: 1, highlightedParts: 0 } },
        { action: "divideEqualParts", narration: "Now we divide the whole into 4 equal parts.", visual: { parts: 4, label: "4 equal parts" } },
        { action: "highlightParts", narration: "If we select 1 part, we say 1 out of 4 parts.", visual: { highlightedParts: 1, totalParts: 4 } },
        {
          action: "showFraction",
          narration: "So the fraction is 1 over 4.",
          visual: { fraction: "1/4", numeratorLabel: "selected part", denominatorLabel: "total equal parts" },
        },
      ],
    },
    {
      sceneType: "fraction-circle",
      title: "Two selected parts out of eight",
      teacherScript: "The same whole can be divided into more equal parts. The fraction changes based on selected parts and total parts.",
      steps: [
        { action: "showWhole", narration: "Start with the same one whole.", visual: { shape: "circle", label: "1 whole", parts: 1, highlightedParts: 0 } },
        { action: "divideEqualParts", narration: "Now divide it into 8 equal parts.", visual: { parts: 8, label: "8 equal parts" } },
        { action: "highlightParts", narration: "Highlight 2 parts. We count 2 selected parts.", visual: { highlightedParts: 2, totalParts: 8 } },
        {
          action: "showFraction",
          narration: "The fraction is 2 over 8. The top number is selected parts, and the bottom number is total equal parts.",
          visual: { fraction: "2/8", numeratorLabel: "2 selected parts", denominatorLabel: "8 total equal parts" },
        },
      ],
      studentQuestion: {
        question: "If 3 parts are selected out of 8, what is the fraction?",
        options: ["3/8", "8/3", "3/5", "5/8"],
        answer: "3/8",
        explanation: "Selected parts go on top and total equal parts go below.",
      },
    },
    {
      sceneType: "fraction-bar",
      title: "Fractions can be shown with bars too",
      teacherScript: "A fraction does not have to be a circle. A bar can also show equal parts of a whole.",
      steps: [
        { action: "showWholeBar", narration: "This full bar is one whole.", visual: { parts: 1, highlightedParts: 0, label: "1 whole bar" } },
        { action: "splitBar", narration: "Split the bar into 5 equal parts.", visual: { parts: 5, label: "5 equal parts" } },
        { action: "highlightBarParts", narration: "Highlight 3 parts out of 5.", visual: { highlightedParts: 3, totalParts: 5 } },
        { action: "showFraction", narration: "The shaded fraction is 3 over 5.", visual: { fraction: "3/5", numeratorLabel: "3 shaded", denominatorLabel: "5 total" } },
      ],
      studentQuestion: {
        question: "What fraction is shaded?",
        options: ["3/5", "5/3", "2/5", "1/5"],
        answer: "3/5",
        explanation: "There are 3 shaded parts out of 5 equal parts.",
      },
    },
    {
      sceneType: "comparison-board",
      title: "Which is bigger: 1/2 or 1/4?",
      teacherScript: "When the whole is the same size, more area means the fraction is larger.",
      steps: [
        { action: "showFirstFraction", narration: "Here is 1/2. One out of two equal parts is shaded.", visual: { leftLabel: "1/2", leftValue: 0.5 } },
        { action: "showSecondFraction", narration: "Here is 1/4. One out of four equal parts is shaded.", visual: { rightLabel: "1/4", rightValue: 0.25 } },
        { action: "compareArea", narration: "The shaded area for 1/2 is larger than the shaded area for 1/4.", visual: { comparison: "1/2 is bigger", highlightWinner: "left" } },
      ],
    },
    {
      sceneType: "fraction-circle",
      title: "The numerator counts selected parts",
      teacherScript: "The numerator is the top number in a fraction and tells us how many equal parts are selected.",
      steps: [
        { action: "showFourParts", narration: "Divide one whole pizza into four equal slices.", visual: { parts: 4, highlightedParts: 0, fraction: "0/4", label: "4 equal slices" } },
        { action: "selectThree", narration: "Highlight three slices and count only the selected parts.", visual: { parts: 4, highlightedParts: 3, fraction: "3/4", numeratorLabel: "3 selected parts" } },
        { action: "pointNumerator", narration: "The number 3 goes on top because the numerator counts selected parts.", visual: { parts: 4, highlightedParts: 3, fraction: "3/4", numeratorLabel: "numerator = selected" } },
      ],
    },
    {
      sceneType: "fraction-bar",
      title: "The denominator counts all equal parts",
      teacherScript: "The denominator is the bottom number and tells us the total number of equal parts in the whole.",
      steps: [
        { action: "showWholeBar", narration: "Begin with one complete bar as the whole.", visual: { parts: 1, highlightedParts: 0, label: "one whole" } },
        { action: "splitFive", narration: "Split the whole into five equal sections and count all sections.", visual: { parts: 5, highlightedParts: 0, label: "5 equal parts" } },
        { action: "pointDenominator", narration: "The number 5 goes below because the denominator counts all equal parts.", visual: { parts: 5, highlightedParts: 2, fraction: "2/5", denominatorLabel: "denominator = total equal parts" } },
      ],
    },
    {
      sceneType: "formula-board",
      title: "Write fraction notation correctly",
      teacherScript: "Fraction notation places selected parts above the fraction bar and total equal parts below it.",
      steps: [
        { action: "writeSelected", narration: "Write the selected-parts count at the top.", visual: { formula: "selected parts", lines: ["numerator goes above"] } },
        { action: "drawBar", narration: "Draw the fraction bar to mean division and to separate the two counts.", visual: { formula: "selected parts / total parts", lines: ["fraction bar means divide"] } },
        { action: "writeTotal", narration: "Write the total equal-parts count below the bar.", visual: { formula: "3 / 5", lines: ["3 selected", "5 equal parts"] } },
      ],
    },
    {
      sceneType: "fraction-bar",
      title: "Equivalent fractions cover the same amount",
      teacherScript: "Equivalent fractions use different numbers but represent the same part of the same-sized whole.",
      steps: [
        { action: "showHalf", narration: "Shade one of two equal parts to show one half.", visual: { parts: 2, highlightedParts: 1, fraction: "1/2", label: "one half" } },
        { action: "splitAgain", narration: "Split each half again so the same bar now has four equal parts.", visual: { parts: 4, highlightedParts: 2, fraction: "2/4", label: "two fourths" } },
        { action: "alignAmounts", narration: "The shaded length remains the same, proving that one half equals two fourths.", visual: { parts: 4, highlightedParts: 2, fraction: "1/2 = 2/4", label: "same amount" } },
      ],
    },
    {
      sceneType: "comparison-board",
      title: "Common fraction mistakes",
      teacherScript: "Fractions must use equal parts, and the numerator and denominator must not be swapped.",
      steps: [
        { action: "showCorrect", narration: "The correct picture has equal parts and writes selected over total.", visual: { leftLabel: "Correct", leftItems: ["equal parts", "3 selected", "5 total", "3/5"], leftValue: 0.8 } },
        { action: "showUnequal", narration: "Unequal pieces cannot be counted as equal fractional parts of one whole.", visual: { rightLabel: "Mistake", rightItems: ["unequal pieces", "not a valid fraction model"], rightValue: 0.4 } },
        { action: "showSwap", narration: "Writing 5/3 instead of 3/5 swaps total parts and selected parts.", visual: { comparison: "selected / total, not total / selected", highlightWinner: "left" } },
      ],
    },
    {
      sceneType: "quiz-visual",
      title: "Quick visual quiz",
      teacherScript: "Use what you watched. Count selected parts first, then total equal parts.",
      steps: [
        { action: "showQuestion", narration: "Look at the bar: 2 parts are shaded out of 6 equal parts.", visual: { parts: 6, highlightedParts: 2, question: "What fraction is shaded?" } },
      ],
      studentQuestion: {
        question: "What fraction is shaded?",
        options: ["2/6", "6/2", "2/4", "4/6"],
        answer: "2/6",
        explanation: "The numerator is 2 shaded parts and the denominator is 6 total equal parts.",
      },
    },
  ];
}

function buildIrrationalScenes(): VisualLessonScene[] {
  return [
    {
      sceneType: "formula-board",
      title: "Definition of irrational numbers",
      teacherScript: "An irrational number cannot be written as p over q, where p and q are integers and q is not zero.",
      steps: [
        { action: "writeRationalForm", narration: "First write the rational number form: p over q.", visual: { formula: "p / q", lines: ["p and q are integers", "q is not 0"] } },
        { action: "crossOut", narration: "An irrational number cannot fit this p over q form.", visual: { formula: "not p / q", lines: ["√2", "√3", "√5", "π"] } },
        { action: "teacherRule", narration: "So the teacher rule is: not expressible as p over q.", visual: { formula: "Irrational = cannot be written as p/q", lines: ["decimal never ends", "decimal never repeats"] } },
      ],
    },
    {
      sceneType: "comparison-board",
      title: "Can every number fit p/q?",
      teacherScript: "Some numbers can be written as p over q. Some real numbers cannot fit that fraction form.",
      steps: [
        { action: "showRationalSide", narration: "Numbers like 1/2, 3, and 0.75 can be written as p/q.", visual: { leftLabel: "Fits p/q", leftItems: ["1/2", "3", "0.75"], leftValue: 0.65 } },
        { action: "showIrrationalSide", narration: "Numbers like √2, √3, and pi cannot be written as p/q.", visual: { rightLabel: "Does not fit p/q", rightItems: ["√2", "√3", "π"], rightValue: 0.95 } },
        { action: "highlightDifference", narration: "This difference gives us rational and irrational numbers.", visual: { comparison: "p/q test", highlightWinner: "right" } },
      ],
    },
    {
      sceneType: "table-board",
      title: "Examples and non-examples",
      teacherScript: "A good way to learn irrational numbers is to compare examples with non-examples.",
      steps: [
        { action: "showNonExamples", narration: "1/2, 3, 0.75, and 0.333 repeating are not irrational because they are rational.", visual: { headers: ["Number", "Why not irrational?"], rows: [["1/2", "Already p/q"], ["3", "3/1"], ["0.75", "3/4"], ["0.333...", "1/3"]] } },
        { action: "showExamples", narration: "√2, √3, √5, and pi are irrational.", visual: { rows: [["√2", "not p/q"], ["√3", "not p/q"], ["√5", "not p/q"], ["π", "not p/q"]] } },
        { action: "teacherCheck", narration: "Always check the p/q condition before deciding.", visual: { rows: [["Teacher check", "Can it be written as p/q?"]] } },
      ],
    },
    {
      sceneType: "number-line",
      title: "Place √2 on the number line",
      teacherScript: "Irrational numbers still live on the number line. √2 is about 1.414, between 1 and 2.",
      steps: [
        { action: "showLine", narration: "Start with the number line from 0 to 3.", visual: { min: 0, max: 3, markers: [{ label: "1", value: 1 }, { label: "2", value: 2 }] } },
        { action: "moveMarker", narration: "Move to about 1.414.", visual: { markers: [{ label: "√2 ≈ 1.414", value: 1.414 }] } },
        { action: "labelMarker", narration: "That point is √2. It is real, but it is not rational.", visual: { fraction: "√2", label: "irrational number" } },
      ],
    },
    {
      sceneType: "table-board",
      title: "Decimal clue",
      teacherScript: "Decimals help us test the idea. Rational decimals terminate or repeat. Irrational decimals never end and never repeat.",
      steps: [
        { action: "showTerminating", narration: "0.5 ends, so 1/2 is rational.", visual: { headers: ["Number", "Decimal", "Type"], rows: [["1/2", "0.5", "Rational"]] } },
        { action: "showRepeating", narration: "0.333... repeats, so 1/3 is rational.", visual: { rows: [["1/3", "0.333...", "Rational"]] } },
        { action: "showNonRepeating", narration: "1.414213... does not end or repeat, so √2 is irrational.", visual: { rows: [["√2", "1.414213...", "Irrational"]] } },
      ],
    },
    {
      sceneType: "comparison-board",
      title: "Common mistake: non-terminating is not enough",
      teacherScript: "A common mistake is thinking every non-terminating decimal is irrational. Repeating decimals are rational.",
      steps: [
        { action: "repeatDecimal", narration: "0.333 repeating never ends, but it repeats, so it is rational.", visual: { leftLabel: "0.333...", leftItems: ["repeats", "1/3", "rational"], leftValue: 0.6 } },
        { action: "nonRepeatDecimal", narration: "1.414213... never ends and does not repeat, so √2 is irrational.", visual: { rightLabel: "√2", rightItems: ["never ends", "never repeats", "irrational"], rightValue: 0.9 } },
        { action: "fixMistake", narration: "The correct test is non-terminating and non-repeating.", visual: { comparison: "Irrational decimals: non-terminating + non-repeating", highlightWinner: "right" } },
      ],
    },
    {
      sceneType: "quiz-visual",
      title: "Quick check",
      teacherScript: "Now use the p/q and decimal tests.",
      steps: [{ action: "showQuestion", narration: "Which number is irrational?", visual: { question: "Which number is irrational?" } }],
      studentQuestion: {
        question: "Which one is irrational?",
        options: ["3/4", "0.25", "√5", "2"],
        answer: "√5",
        explanation: "√5 cannot be written as p/q and its decimal does not terminate or repeat.",
      },
    },
  ];
}

function buildEquationScenes(concept: string): VisualLessonScene[] {
  return [
    {
      sceneType: "formula-board",
      title: "Keep the equation balanced",
      teacherScript: "An equation works like a balance. Whatever we do to one side, we do to the other side.",
      steps: [
        { action: "writeEquation", narration: "Start with 2x + 3 = 11.", visual: { lines: ["2x + 3 = 11"], formula: "2x + 3 = 11" } },
        { action: "subtractBothSides", narration: "Subtract 3 from both sides.", visual: { lines: ["2x + 3 - 3 = 11 - 3", "2x = 8"], formula: "2x = 8" } },
        { action: "divideBothSides", narration: "Divide both sides by 2.", visual: { lines: ["2x / 2 = 8 / 2", "x = 4"], formula: "x = 4" } },
      ],
    },
    {
      sceneType: "comparison-board",
      title: `${concept} vs expression`,
      teacherScript: "An equation has an equals sign and can be solved. An expression does not have two balanced sides.",
      steps: [
        { action: "showExpression", narration: "2x + 3 is an expression.", visual: { leftLabel: "Expression", leftItems: ["2x + 3"], leftValue: 0.45 } },
        { action: "showEquation", narration: "2x + 3 = 11 is an equation.", visual: { rightLabel: "Equation", rightItems: ["2x + 3 = 11"], rightValue: 0.9 } },
      ],
    },
  ];
}

function buildScienceScenes(concept: string, chapterName: string): VisualLessonScene[] {
  const context = `${concept} ${chapterName}`.toLowerCase();
  if (/matter in our surroundings|matter|particle|state|evaporation|sublimation|latent|boiling|melting/.test(context)) {
    const chapterConcepts = buildMatterChapterConcepts();
    const scenesFor = (...titles: string[]) =>
      titles.flatMap((title) => chapterConcepts.find((item) => item.conceptTitle.toLowerCase() === title.toLowerCase())?.scenes || []);
    if (/state|solid|liquid|gas/.test(context)) {
      return scenesFor("Solid, liquid, and gas", "Effect of temperature on particles", "Chapter summary");
    }
    if (/evaporation|sublimation|latent|boiling|melting|change/.test(context)) {
      return scenesFor("Melting and boiling", "Latent heat", "Evaporation", "Factors affecting evaporation", "Sublimation");
    }
    return scenesFor("What is matter?", "Matter has mass and occupies space", "Matter is made of particles", "Particles have space between them", "Particles are continuously moving", "Diffusion");
  }
  if (/inertia|motion/.test(context)) {
    return [
      {
        sceneType: "motion-track",
        title: `${concept} on a motion track`,
        teacherScript: "Watch the object. Motion ideas become easier when we see position changing over time.",
        steps: [
          { action: "showObject", narration: "The object starts at rest.", visual: { position: 10, label: "rest" } },
          { action: "moveObject", narration: "When a push acts, the object changes its motion.", visual: { position: 65, label: "moving" } },
          { action: "showInertia", narration: "Inertia is the tendency to keep the same state of motion unless a force changes it.", visual: { position: 65, label: "keeps moving", trail: true } },
        ],
      },
      {
        sceneType: "force-arrows",
        title: "Forces as arrows",
        teacherScript: "A force has direction. Arrows help us see which way the push or pull acts.",
        steps: [
          { action: "showObject", narration: "First locate the object.", visual: { objectLabel: concept } },
          { action: "addArrow", narration: "Add an arrow in the direction of force.", visual: { rightArrow: true, forceLabel: "push" } },
          { action: "showResult", narration: "The object changes motion in the direction of the net force.", visual: { rightArrow: true, netForce: "to the right" } },
        ],
      },
    ];
  }

  if (/electric|circuit/.test(context)) {
    return [
      {
        sceneType: "diagram-label",
        title: "Follow the circuit path",
        teacherScript: "Electricity is easier when we trace the path like a loop.",
        steps: [
          { action: "showDiagram", narration: "Start with the battery.", visual: { diagram: "circuit", labels: ["Battery"] } },
          { action: "addWire", narration: "Current needs a closed path through wires.", visual: { labels: ["Battery", "Wire", "Switch"] } },
          { action: "lightBulb", narration: "When the path is closed, the bulb can glow.", visual: { labels: ["Battery", "Wire", "Switch", "Bulb"], active: true } },
        ],
      },
    ];
  }

  return [
    {
      sceneType: "diagram-label",
      title: `Observe ${concept} as a working system`,
      teacherScript: `We will study ${concept} by locating the important parts, watching what changes, and connecting each observation to measurable evidence.`,
      steps: [
        { action: "showSystem", narration: `First locate ${concept} inside the real system or process being studied.`, visual: { diagram: concept, labels: ["Main system", concept] } },
        { action: "showChange", narration: `Watch the property, part, or condition that changes during ${concept}.`, visual: { labels: ["Starting condition", concept, "Visible change"] } },
        { action: "showEvidence", narration: "Use an observation or measurement to explain why the change happened.", visual: { labels: ["Starting condition", concept, "Visible change", "Evidence"] } },
      ],
    },
    {
      sceneType: "table-board",
      title: "Observation and evidence",
      teacherScript: "A science answer should connect observation, cause, and evidence.",
      steps: [
        { action: "showObservation", narration: "Write what we observe.", visual: { headers: ["Observation", "Cause", "Evidence"], rows: [["What we see", "", ""]] } },
        { action: "showCause", narration: `Connect the observation to ${concept}.`, visual: { rows: [["What we see", concept, ""]] } },
        { action: "showEvidence", narration: "Add evidence so the answer is scientific.", visual: { rows: [["What we see", concept, "Measured or visible proof"]] } },
      ],
    },
  ];
}

function buildDefaultScenes(profile: SceneProfile): VisualLessonScene[] {
  return [
    {
      sceneType: profile.visualSlide.visualType === "comparison-table" ? "table-board" : "formula-board",
      title: `Watch ${profile.concept} appear step by step`,
      teacherScript: profile.definition,
      steps: [
        { action: "writeMeaning", narration: `First, write the meaning of ${profile.concept}.`, visual: { lines: [profile.definition], formula: profile.rule } },
        { action: "showExample", narration: `Now show one example: ${profile.examples[0] || profile.concept}.`, visual: { lines: [profile.examples[0] || profile.concept], formula: profile.ruleApplies } },
        { action: "showNonExample", narration: `Compare it with a non-example: ${profile.nonExamples[0] || profile.relatedConcept}.`, visual: { lines: [profile.nonExamples[0] || profile.relatedConcept], formula: profile.ruleDoesNotApply } },
      ],
    },
    {
      sceneType: "comparison-board",
      title: `${profile.concept} compared visually`,
      teacherScript: `Place ${profile.concept} beside ${profile.relatedConcept} so the difference is visible.`,
      steps: [
        { action: "showLeft", narration: `Left side: ${profile.concept}.`, visual: { leftLabel: profile.concept, leftItems: profile.examples.slice(0, 3), leftValue: 0.8 } },
        { action: "showRight", narration: `Right side: ${profile.relatedConcept}.`, visual: { rightLabel: profile.relatedConcept, rightItems: profile.nonExamples.slice(0, 3), rightValue: 0.45 } },
        { action: "showReason", narration: profile.exampleReason, visual: { comparison: profile.exampleReason } },
      ],
    },
    {
      sceneType: "quiz-visual",
      title: "Try one question",
      teacherScript: "Use the visual rule, not guessing.",
      steps: [{ action: "showQuestion", narration: profile.quickQuestion, visual: { question: profile.quickQuestion } }],
      studentQuestion: {
        question: profile.quickQuestion,
        options: profile.quickOptions,
        answer: profile.quickAnswer,
        explanation: profile.quickExplanation,
      },
    },
  ];
}

function createPromptHints(profile: TopicProfile) {
  return [
    `- Core definition: ${profile.definition}`,
    `- Rule or test: ${profile.rule}`,
    `- Useful examples: ${profile.examples.join(", ")}`,
    `- Useful non-examples: ${profile.nonExamples.join(", ")}`,
    `- Related comparison: ${profile.concept} vs ${profile.relatedConcept}`,
    `- Suggested animated scenes: ${profile.scenes.map((scene) => `${scene.sceneType}: ${scene.title}`).join("; ")}`,
    `- Common mistake to address: ${profile.mistake}`,
    `- Quick check style: ${profile.quickQuestion}`,
  ].join("\n");
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => asString(item)).filter(Boolean) : [];
}

function asPositiveNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function normalizeBeatType(value: unknown): CinematicLessonBeat["beatType"] {
  const allowed: CinematicLessonBeat["beatType"][] = ["intro", "zoom", "reveal", "transform", "compare", "label", "question", "correction", "recap", "practice"];
  return allowed.includes(value as CinematicLessonBeat["beatType"]) ? (value as CinematicLessonBeat["beatType"]) : "reveal";
}

function normalizeCameraMovement(value: unknown): CinematicLessonBeat["camera"]["movement"] {
  const allowed: CinematicLessonBeat["camera"]["movement"][] = ["none", "pan", "zoom-in", "zoom-out", "follow", "tilt", "focus"];
  return allowed.includes(value as CinematicLessonBeat["camera"]["movement"]) ? (value as CinematicLessonBeat["camera"]["movement"]) : "focus";
}

function estimateLessonDuration(scenes: VisualLessonScene[]) {
  const totalWords = scenes.flatMap((scene) => scene.steps).reduce((sum, step) => sum + countWords(step.teacherNarration || step.narration), 0);
  return Math.max(5, Math.ceil(totalWords / 125));
}
