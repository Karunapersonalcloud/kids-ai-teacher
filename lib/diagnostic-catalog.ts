import { getClassNumberFromGrade } from "./grade-catalog";

export type DiagnosticChoice = {
  id: string;
  label: string;
};

export type DiagnosticQuestion = {
  id: string;
  /** Concept area this question maps to (used to compute strong/weak areas). */
  area: string;
  /** Subject this question belongs to (e.g. "Mathematics"). */
  subject: string;
  prompt: string;
  choices: DiagnosticChoice[];
  correctChoiceId: string;
};

export type DiagnosticPack = {
  /** Friendly label, e.g. "Class 9 Baseline Diagnostic". */
  title: string;
  grade: string;
  questions: DiagnosticQuestion[];
};

/**
 * Returns a baseline diagnostic question pack for a given grade.
 * Honest evaluation: questions cover grade-appropriate prerequisites,
 * not random easy questions. Used once per child before learning starts.
 */
export function getDiagnosticPackForGrade(grade: string): DiagnosticPack {
  const classNumber = getClassNumberFromGrade(grade) || 9;

  if (classNumber <= 2) {
    return {
      title: `${grade} Baseline Check`,
      grade,
      questions: [
        q("read-1", "Reading", "English", "Which word starts with the same sound as 'cat'?", ["bat", "dog", "cup", "fan"], 2),
        q("read-2", "Reading", "English", "Choose the correct word: The sun is ____.", ["bright", "fish", "table", "shoe"], 0),
        q("num-1", "Number Sense", "Mathematics", "What comes after 19?", ["18", "20", "29", "10"], 1),
        q("num-2", "Number Sense", "Mathematics", "Which is the biggest number?", ["12", "7", "21", "15"], 2),
        q("add-1", "Addition", "Mathematics", "5 + 4 = ?", ["8", "9", "10", "11"], 1),
        q("sub-1", "Subtraction", "Mathematics", "10 - 3 = ?", ["6", "7", "8", "9"], 1),
        q("evs-1", "EVS", "EVS", "Which one is a plant?", ["Cow", "Mango tree", "Bus", "Phone"], 1),
        q("write-1", "Writing Readiness", "English", "Which letter is a vowel?", ["B", "C", "E", "M"], 2),
      ],
    };
  }

  if (classNumber <= 5) {
    return {
      title: `${grade} Baseline Diagnostic`,
      grade,
      questions: [
        q("read-1", "Reading Comprehension", "English", "Choose the antonym of 'happy'.", ["joyful", "sad", "glad", "bright"], 1),
        q("read-2", "Grammar", "English", "Pick the correct verb: She ____ to school every day.", ["go", "going", "goes", "gone"], 2),
        q("mul-1", "Multiplication", "Mathematics", "7 × 8 = ?", ["54", "56", "63", "49"], 1),
        q("div-1", "Division", "Mathematics", "72 ÷ 9 = ?", ["7", "8", "9", "6"], 1),
        q("frac-1", "Fractions", "Mathematics", "Which fraction is equal to 1/2?", ["2/3", "3/6", "1/3", "4/5"], 1),
        q("dec-1", "Decimals", "Mathematics", "0.5 + 0.25 = ?", ["0.75", "0.55", "0.30", "1.25"], 0),
        q("sci-1", "EVS / Science", "Science", "Which organ helps us breathe?", ["Heart", "Lungs", "Liver", "Kidney"], 1),
        q("soc-1", "Social Basics", "Social Science", "Which is the capital of India?", ["Mumbai", "Chennai", "New Delhi", "Kolkata"], 2),
      ],
    };
  }

  if (classNumber <= 8) {
    return {
      title: `${grade} Baseline Diagnostic`,
      grade,
      questions: [
        q("frac-1", "Fractions", "Mathematics", "Simplify: 18/24", ["2/3", "3/4", "4/5", "1/2"], 1),
        q("dec-1", "Decimals", "Mathematics", "0.6 × 0.5 = ?", ["0.30", "0.11", "0.06", "0.36"], 0),
        q("per-1", "Percentages", "Mathematics", "20% of 250 = ?", ["25", "40", "50", "75"], 2),
        q("alg-1", "Algebra Basics", "Mathematics", "If x + 7 = 12, then x = ?", ["3", "4", "5", "19"], 2),
        q("alg-2", "Algebra Basics", "Mathematics", "Simplify: 3(x + 2)", ["3x + 2", "3x + 6", "x + 6", "3x + 5"], 1),
        q("sci-1", "Science Reasoning", "Science", "Which is a renewable source of energy?", ["Coal", "Petrol", "Solar", "Diesel"], 2),
        q("sci-2", "Science Reasoning", "Science", "Water boils at how many degrees Celsius at sea level?", ["50", "75", "100", "120"], 2),
        q("read-1", "Reading Comprehension", "English", "Choose the correct synonym of 'rapid'.", ["slow", "fast", "weak", "old"], 1),
        q("soc-1", "Social Basics", "Social Science", "The Indian Constitution came into effect in?", ["1947", "1950", "1952", "1962"], 1),
      ],
    };
  }

  return {
    title: `${grade} Baseline Diagnostic`,
    grade,
    questions: [
      q("alg-1", "Algebra Foundation", "Mathematics", "Solve: 2x − 5 = 11", ["2", "6", "8", "10"], 2),
      q("alg-2", "Algebra Foundation", "Mathematics", "Factorise: x² − 9", ["(x−3)(x−3)", "(x+3)(x+3)", "(x−3)(x+3)", "(x+9)(x−1)"], 2),
      q("frac-1", "Fractions / Decimals", "Mathematics", "Convert 7/20 to decimal.", ["0.07", "0.20", "0.35", "0.70"], 2),
      q("per-1", "Percentages", "Mathematics", "If marked price is ₹800 and discount is 15%, selling price = ?", ["₹680", "₹720", "₹760", "₹780"], 0),
      q("geo-1", "Geometry", "Mathematics", "Sum of angles in a triangle is?", ["90°", "180°", "270°", "360°"], 1),
      q("sci-1", "Science Basics", "Science", "Newton's first law is also called?", ["Law of action–reaction", "Law of inertia", "Law of momentum", "Law of gravity"], 1),
      q("sci-2", "Science Basics", "Science", "Chemical formula of methane?", ["CH₄", "CO₂", "C₂H₆", "NH₃"], 0),
      q("read-1", "Reading Comprehension", "English", "Choose the best meaning of 'inevitable'.", ["avoidable", "unavoidable", "impossible", "rare"], 1),
      q("read-2", "Language Confidence", "English", "Pick the grammatically correct sentence.", ["He don't like tea.", "He doesn't likes tea.", "He doesn't like tea.", "He not like tea."], 2),
      q("habit-1", "Study Habit", "Study Skills", "Best way to remember a concept long-term?", ["Read once", "Highlight only", "Practice + spaced revision", "Watch a video"], 2),
    ],
  };
}

function q(
  id: string,
  area: string,
  subject: string,
  prompt: string,
  choices: string[],
  correctIndex: number
): DiagnosticQuestion {
  return {
    id,
    area,
    subject,
    prompt,
    choices: choices.map((label, index) => ({ id: String.fromCharCode(97 + index), label })),
    correctChoiceId: String.fromCharCode(97 + correctIndex),
  };
}

export type DiagnosticAnswer = {
  questionId: string;
  choiceId: string;
};

export type DiagnosticScore = {
  score: number;
  total: number;
  percentage: number;
  perArea: Record<string, { correct: number; total: number }>;
  strongAreas: string[];
  weakAreas: string[];
  riskLevel: "Low" | "Medium" | "High";
  recommendedStartLevel: string;
  learningPlan: string[];
};

export function scoreDiagnostic(pack: DiagnosticPack, answers: DiagnosticAnswer[]): DiagnosticScore {
  const answerById = new Map(answers.map((a) => [a.questionId, a.choiceId]));
  const perArea: Record<string, { correct: number; total: number }> = {};
  let score = 0;

  for (const question of pack.questions) {
    const area = (perArea[question.area] ??= { correct: 0, total: 0 });
    area.total += 1;
    if (answerById.get(question.id) === question.correctChoiceId) {
      area.correct += 1;
      score += 1;
    }
  }

  const total = pack.questions.length;
  const percentage = total === 0 ? 0 : Math.round((score / total) * 1000) / 10;

  const areaPercentages = Object.entries(perArea).map(([area, value]) => ({
    area,
    percentage: value.total === 0 ? 0 : (value.correct / value.total) * 100,
  }));
  const strongAreas = areaPercentages.filter((a) => a.percentage >= 75).map((a) => a.area);
  const weakAreas = areaPercentages.filter((a) => a.percentage < 60).map((a) => a.area);

  const riskLevel: DiagnosticScore["riskLevel"] = percentage >= 75 ? "Low" : percentage >= 50 ? "Medium" : "High";
  const recommendedStartLevel = percentage >= 80
    ? "Grade level"
    : percentage >= 60
      ? "Grade level with revision"
      : percentage >= 40
        ? "One grade below for prerequisites"
        : "Foundation recovery before grade level";

  const learningPlan: string[] = [];
  if (weakAreas.length) {
    learningPlan.push(`Strengthen ${weakAreas.join(", ")} with daily 15-minute practice.`);
  }
  learningPlan.push("Begin first chapter with a pre-check before lessons.");
  learningPlan.push("Target 95% mastery in chapter exam before next chapter.");
  if (riskLevel === "High") {
    learningPlan.push("Schedule short daily revision sessions; avoid stress, build confidence.");
  }

  return {
    score,
    total,
    percentage,
    perArea,
    strongAreas,
    weakAreas,
    riskLevel,
    recommendedStartLevel,
    learningPlan,
  };
}
