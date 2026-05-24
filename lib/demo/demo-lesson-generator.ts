import { getDemoPreviewRules, type DemoPreviewMode } from "./demo-preview-rules";

export type DemoLessonRequest = {
  grade: string;
  board: string;
  subject: string;
  chapter: string;
  topic?: string;
};

export type DemoSlide = {
  title: string;
  icon: string;
  description: string;
};

export type DemoPracticeQuestion = {
  question: string;
  answer: string;
};

export type DemoVisualLesson = DemoLessonRequest & {
  title: string;
  previewMode: DemoPreviewMode;
  previewLabel: string;
  previewPercent: number;
  slides: DemoSlide[];
  practiceQuestions: DemoPracticeQuestion[];
  lockedSections: string[];
  safetyNote: string;
};

const lowerPrimarySubjects = new Set(["English", "Maths", "EVS", "Hindi", "Kannada", "Telugu"]);

export function generateDemoLesson(input: DemoLessonRequest): DemoVisualLesson {
  const hasTopic = Boolean(input.topic?.trim());
  const rules = getDemoPreviewRules({ hasTopic });
  const classNumber = Number(input.grade.replace(/\D/g, "")) || 1;
  const focus = input.topic?.trim() || input.chapter.trim();
  const style = getStyle(classNumber);
  const subject = input.subject || (classNumber <= 5 ? "EVS" : "Science");

  const allSlides: DemoSlide[] = [
    {
      title: `${focus} - topic intro`,
      icon: classNumber <= 3 ? "🌱" : "📘",
      description: `${style.opening} In this preview, we introduce ${focus} for ${input.grade} ${subject}.`,
    },
    {
      title: "Simple explanation",
      icon: "💡",
      description: getExplanation(classNumber, subject, focus),
    },
    {
      title: "Real-life example",
      icon: "🏠",
      description: getRealLifeExample(classNumber, subject, focus),
    },
    {
      title: "Visual understanding",
      icon: "🧩",
      description: `${style.visual} The full lesson uses more diagrams, examples, and guided practice after registration.`,
    },
    {
      title: "Memory trick",
      icon: "⭐",
      description: getMemoryTrick(classNumber, focus),
    },
  ];

  const allPractice = getPracticeQuestions(classNumber, subject, focus);

  return {
    ...input,
    subject,
    topic: input.topic || "",
    title: hasTopic ? `${focus} demo preview` : `${input.chapter} chapter demo preview`,
    previewMode: rules.previewMode,
    previewLabel: rules.previewLabel,
    previewPercent: rules.previewPercent,
    slides: allSlides.slice(0, rules.maxSlides),
    practiceQuestions: allPractice.slice(0, rules.maxPracticeQuestions),
    lockedSections:
      rules.previewMode === "chapter_25_percent"
        ? ["Remaining visual lesson", "Full practice", "Quiz", "Chapter exam", "Weak area report"]
        : ["Full topic practice", "Quiz", "Chapter exam", "Progress tracking"],
    safetyNote:
      "Demo content is a general grade-level preview. Registered users can get textbook-based teaching after the parent selects/upload authorized textbooks.",
  };
}

function getStyle(classNumber: number) {
  if (classNumber <= 3) {
    return {
      opening: "We use simple words, friendly examples, and visual hints.",
      visual: "Pictures and small story-like examples help the child understand.",
    };
  }
  if (classNumber <= 5) {
    return {
      opening: "We start with the concept and connect it to daily life.",
      visual: "Visual cards break the idea into small steps.",
    };
  }
  if (classNumber <= 8) {
    return {
      opening: "We explain the concept in a structured way with examples.",
      visual: "Diagrams, comparison cards, and practice checks make the idea clear.",
    };
  }
  return {
    opening: "We explain from prerequisites and connect the idea to CBSE-style application.",
    visual: "Visual steps and competency-style examples prepare the student for exams.",
  };
}

function getExplanation(classNumber: number, subject: string, focus: string) {
  if (classNumber <= 3 && lowerPrimarySubjects.has(subject)) {
    return `${focus} is explained with simple words, examples from home and school, and one small question.`;
  }
  if (classNumber <= 5) {
    return `${focus} is introduced as a clear idea first, then shown through an example the child already knows.`;
  }
  if (classNumber <= 8) {
    return `${focus} is explained by definition, example, and a small practice step so the student can apply it.`;
  }
  return `${focus} is explained with concept meaning, prerequisite basics, formula or definition if needed, and CBSE-style application.`;
}

function getRealLifeExample(classNumber: number, subject: string, focus: string) {
  if (subject.toLowerCase().includes("math")) {
    return `For ${focus}, we use examples like sharing food, measuring distance, money, or classroom objects.`;
  }
  if (subject.toLowerCase().includes("science") || subject === "EVS") {
    return `For ${focus}, we connect the idea to things the child sees around home, road, plants, animals, weather, or school.`;
  }
  if (subject.toLowerCase().includes("english")) {
    return `For ${focus}, we use a short sentence, a story line, and a quick reading check.`;
  }
  return `For ${focus}, we use an example from daily life first, then move to school-style practice.`;
}

function getMemoryTrick(classNumber: number, focus: string) {
  if (classNumber <= 3) return `${focus} + picture + example = easy memory.`;
  if (classNumber <= 5) return `Say the idea, see one example, solve one question.`;
  return `Meaning -> example -> application. This order helps avoid rote learning.`;
}

function getPracticeQuestions(classNumber: number, subject: string, focus: string): DemoPracticeQuestion[] {
  if (classNumber <= 3) {
    return [
      { question: `What is one example of ${focus}?`, answer: `A correct answer names one simple example from daily life.` },
      { question: `Can you draw or point to something related to ${focus}?`, answer: `The child connects the idea to a picture or real object.` },
      { question: `Say ${focus} in your own words.`, answer: `A short simple sentence is enough at this level.` },
    ];
  }

  if (subject.toLowerCase().includes("math")) {
    return [
      { question: `Solve one simple question from ${focus}.`, answer: `Use the concept step-by-step and check the final value.` },
      { question: `Explain why the answer is correct.`, answer: `The reasoning should match the formula or visual example.` },
      { question: `Create one daily-life example for ${focus}.`, answer: `A real-life example shows the student understood the idea.` },
    ];
  }

  return [
    { question: `Define ${focus} in simple words.`, answer: `A good answer gives the meaning without memorizing blindly.` },
    { question: `Give one real-life example of ${focus}.`, answer: `The example should connect the concept to daily life.` },
    { question: `Why is ${focus} important?`, answer: `The answer should explain where or why the idea is used.` },
  ];
}
