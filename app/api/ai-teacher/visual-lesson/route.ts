import OpenAI from "openai";
import { getChild } from "@/lib/mock-data";
import { getChapterByNumber } from "@/lib/learning/chapter-catalog";
import { checkAndIncrementAiUsage } from "@/lib/usage-store";
import { getRequestAccess } from "@/lib/request-access";
import type { PlanName } from "@/lib/billing-types";
import type { ChildId, VisualLesson, VisualLessonSlide, VisualType } from "@/lib/types";

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
  "gradeLevel": string,
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
Create teacher-style slides, not paragraph notes. Every concept must include a hook, definition, visual explanation, real example, non-example, step-by-step reasoning, comparison, common mistake, quick check, summary, and practice question. Use simple English, age-appropriate examples, and CBSE/NCERT terminology for Class 9 Maths. Avoid generic lines like "this is one part of the chapter." For maths, use formulas, tables, number lines, and visual representations wherever relevant.`,
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

Use 8 to 12 slides. Each slide should be short enough for narration and should include visualData that can be rendered as the chosen visualType. Build the lesson for the selected concept only. Do not reuse examples from a different topic unless they genuinely explain this concept.`,
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
  const slides = asArray(input.slides)
    .map((slide) => normalizeSlide(slide))
    .filter((slide): slide is VisualLessonSlide => Boolean(slide));

  if (slides.length < 3) return fallback;
  return {
    title: asString(input.title, fallback.title),
    gradeLevel: asString(input.gradeLevel, fallback.gradeLevel),
    slides,
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
};

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
    gradeLevel: `${grade} · ${subject} · ${board}`,
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

  return {
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
}

function createPromptHints(profile: TopicProfile) {
  return [
    `- Core definition: ${profile.definition}`,
    `- Rule or test: ${profile.rule}`,
    `- Useful examples: ${profile.examples.join(", ")}`,
    `- Useful non-examples: ${profile.nonExamples.join(", ")}`,
    `- Related comparison: ${profile.concept} vs ${profile.relatedConcept}`,
    `- Suggested visual: ${profile.visualSlide.visualType} (${profile.visualSlide.title})`,
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
