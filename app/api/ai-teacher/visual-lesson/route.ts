import OpenAI from "openai";
import { getChild } from "@/lib/mock-data";
import { getChapterByNumber } from "@/lib/learning/chapter-catalog";
import { checkAndIncrementAiUsage } from "@/lib/usage-store";
import { getRequestAccess } from "@/lib/request-access";
import type { PlanName } from "@/lib/billing-types";
import type { ChildId, VisualLesson, VisualLessonScene, VisualLessonSlide, VisualLessonStep, VisualSceneType, VisualType } from "@/lib/types";

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
  };
  const access = await getRequestAccess(request);
  if (access.mustChangeCredentials || access.status === "pending" || access.status === "blocked" || access.status === "rejected" || access.status === "expired") {
    return Response.json({ error: "Your account is not ready for AI access yet." }, { status: 403 });
  }
  if (!access.policy.canUseAI && access.status !== "guest") {
    return Response.json({ error: "AI access is not enabled for this account." }, { status: 403 });
  }
  const session = getSessionFromCookie(request.headers.get("cookie") || "");
  const usage = await checkAndIncrementAiUsage(access.userId || session.userId, access.plan || session.plan, access.dailyAiLimit);
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
  const conceptName = body.conceptName || body.topic || catalogChapter.concepts[0] || chapterName;
  const concepts = body.concepts?.length ? body.concepts : catalogChapter.concepts;
  const profile = buildTopicProfile({ board, subject, chapterName, conceptName, concepts });
  const fallback = createFallbackVisualLesson({ grade, board, subject, chapterNumber, chapterName, conceptName, profile });

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
  "mode": "animated-visual-teacher",
  "scenes": [
    {
      "sceneType": "fraction-circle" | "fraction-bar" | "number-line" | "comparison-board" | "formula-board" | "table-board" | "force-arrows" | "motion-track" | "diagram-label" | "quiz-visual",
      "title": string,
      "teacherScript": string,
      "steps": [
        {
          "action": string,
          "narration": string,
          "visual": object
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
Create animated visual teacher scenes first, with slides only as fallback. Every scene must reveal the concept through visual motion: show, split, move, highlight, point, compare, or reveal one step at a time. Keep narration short and synchronized with each step. Use simple English, age-appropriate examples, and CBSE/NCERT terminology for Class 9 Maths. Avoid generic lines like "this is one part of the chapter." For maths, use circles, bars, number lines, balance scales, graphs, formulas, or tables wherever relevant. For science, use motion tracks, arrows, particles, circuits, or labeled diagrams wherever relevant.`,
        },
        {
          role: "user",
          content: `Create a visual classroom lesson for ${body.childName || child.name}.
Grade: ${grade}
Board: ${board}
Subject: ${subject}
Chapter ${chapterNumber}: ${chapterName}
Concept selection: ${conceptName}
Chapter concepts: ${concepts.join(", ")}

Topic hints:
${createPromptHints(profile)}

Use 4 to 7 animated scenes. Each scene should have 3 to 6 steps. Include slides as fallback summaries, but scenes are the primary experience. Build the lesson for the selected concept only. Do not reuse examples from a different topic unless they genuinely explain this concept.`,
        },
      ],
    });
    const parsed = JSON.parse(completion.choices[0]?.message.content || "{}");
    return Response.json(normalizeVisualLesson(parsed, fallback));
  } catch (error) {
    console.warn("[visual-lesson] Falling back to structured lesson", error);
    return Response.json(fallback);
  }
}

function getSessionFromCookie(cookie: string) {
  const values = Object.fromEntries(cookie.split(";").map((part) => part.trim().split("=")).filter((part) => part.length === 2).map(([key, value]) => [key, decodeURIComponent(value)]));
  return { userId: values.kids_user_id || "demo-user", plan: ((values.kids_access_plan as PlanName | undefined) || "demo") };
}

function normalizeVisualLesson(value: unknown, fallback: VisualLesson): VisualLesson {
  const input = Array.isArray(value) ? { title: fallback.title, gradeLevel: fallback.gradeLevel, slides: value } : asRecord(value);
  const scenes = asArray(input.scenes)
    .map((scene) => normalizeScene(scene))
    .filter((scene): scene is VisualLessonScene => Boolean(scene));
  const slides = asArray(input.slides)
    .map((slide) => normalizeSlide(slide))
    .filter((slide): slide is VisualLessonSlide => Boolean(slide));

  const nextScenes = scenes.length ? scenes : fallback.scenes || [];
  const nextSlides = slides.length >= 3 ? slides : fallback.slides;
  if (!nextScenes.length && nextSlides.length < 3) return fallback;
  return {
    title: asString(input.title, fallback.title),
    lessonTitle: asString(input.lessonTitle, fallback.lessonTitle || fallback.title),
    gradeLevel: asString(input.gradeLevel, fallback.gradeLevel),
    mode: asString(input.mode, fallback.mode || "animated-visual-teacher"),
    scenes: nextScenes,
    slides: nextSlides,
  };
}

function normalizeScene(value: unknown): VisualLessonScene | undefined {
  const input = asRecord(value);
  const sceneType = sceneTypes.includes(input.sceneType as VisualSceneType) ? (input.sceneType as VisualSceneType) : undefined;
  const title = asString(input.title);
  const teacherScript = asString(input.teacherScript);
  const steps = asArray(input.steps)
    .map((step) => normalizeStep(step))
    .filter((step): step is VisualLessonStep => Boolean(step));
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
    title,
    teacherScript,
    steps,
    studentQuestion,
  };
}

function normalizeStep(value: unknown): VisualLessonStep | undefined {
  const input = asRecord(value);
  const action = asString(input.action);
  const narration = asString(input.narration);
  if (!action || !narration) return undefined;
  return {
    action,
    narration,
    visual: asRecord(input.visual),
  };
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
  return {
    title: `Chapter ${chapterNumber}: ${chapterName} - ${conceptName}`,
    lessonTitle: `${profile.concept} Animated Lesson`,
    gradeLevel: `${grade} · ${subject} · ${board}`,
    mode: "animated-visual-teacher",
    scenes: profile.scenes,
    slides: buildTeacherSlides(profile),
  };
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
      title: `Build a diagram for ${concept}`,
      teacherScript: "Science ideas become clear when we label the parts and connect cause to effect.",
      steps: [
        { action: "showDiagram", narration: `First place ${concept} in the center.`, visual: { diagram: "concept", labels: [concept] } },
        { action: "addCause", narration: "Now add the cause or condition.", visual: { labels: ["Cause", concept] } },
        { action: "addEffect", narration: "Finally add the effect or evidence.", visual: { labels: ["Cause", concept, "Effect", "Evidence"] } },
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
