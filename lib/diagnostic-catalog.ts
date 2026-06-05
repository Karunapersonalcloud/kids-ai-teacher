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
        q("alpha-1", "Reading Foundations", "English", "Which letter comes after M?", ["L", "N", "O", "P"], 1),
        q("numrec-1", "Number Recognition", "Mathematics", "Which number means three hundred five?", ["35", "305", "350", "3005"], 1),
        q("arith-1", "Arithmetic Basics", "Mathematics", "9 + 6 = ?", ["14", "15", "16", "96"], 1),
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
      q("alpha-1", "Reading Foundations", "English", "Which letter comes after M?", ["L", "N", "O", "P"], 1),
      q("numrec-1", "Number Recognition", "Mathematics", "Which number means three hundred five?", ["35", "305", "350", "3005"], 1),
      q("arith-1", "Arithmetic Basics", "Mathematics", "12 + 9 = ?", ["19", "20", "21", "129"], 2),
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
  domainLevels: Record<string, { percentage: number; level: string }>;
  strongAreas: string[];
  weakAreas: string[];
  riskLevel: "Low" | "Medium" | "High";
  recommendedStartLevel: string;
  actualLearningLevel: string;
  gradeReadinessPercentage: number;
  recommendedStartingPoint: string;
  foundationRecoveryRequired: boolean;
  readingLevel: string;
  writingLevel: string;
  numberRecognitionLevel: string;
  arithmeticLevel: string;
  subjectFoundationLevel: string;
  classLevelReadiness: string;
  learningSpeed: string;
  mistakePatterns: { area: string; pattern: string; repairAction: string }[];
  learningPlan: string[];
};

export function scoreDiagnostic(pack: DiagnosticPack, answers: DiagnosticAnswer[]): DiagnosticScore {
  const answerById = new Map(answers.map((a) => [a.questionId, a.choiceId]));
  const perArea: Record<string, { correct: number; total: number }> = {};
  const perDomain: Record<string, { correct: number; total: number }> = {
    reading: { correct: 0, total: 0 },
    writing: { correct: 0, total: 0 },
    numberRecognition: { correct: 0, total: 0 },
    arithmetic: { correct: 0, total: 0 },
    subjectFoundation: { correct: 0, total: 0 },
    classLevelReadiness: { correct: 0, total: 0 },
  };
  let score = 0;

  for (const question of pack.questions) {
    const area = (perArea[question.area] ??= { correct: 0, total: 0 });
    const correct = answerById.get(question.id) === question.correctChoiceId;
    area.total += 1;
    for (const domain of domainsForQuestion(question)) {
      perDomain[domain].total += 1;
      if (correct) perDomain[domain].correct += 1;
    }
    if (correct) {
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
  const classNumber = getClassNumberFromGrade(pack.grade) || 1;
  const domainLevels = Object.fromEntries(
    Object.entries(perDomain).map(([domain, value]) => {
      const domainPercentage = value.total === 0 ? percentage : Math.round((value.correct / value.total) * 1000) / 10;
      return [domain, { percentage: domainPercentage, level: levelLabel(classNumber, domainPercentage) }];
    })
  );

  const riskLevel: DiagnosticScore["riskLevel"] = percentage >= 75 ? "Low" : percentage >= 50 ? "Medium" : "High";
  const actualLearningLevel = levelLabel(classNumber, percentage);
  const readingLevel = domainLevels.reading.level;
  const writingLevel = domainLevels.writing.level;
  const numberRecognitionLevel = domainLevels.numberRecognition.level;
  const arithmeticLevel = domainLevels.arithmetic.level;
  const subjectFoundationLevel = domainLevels.subjectFoundation.level;
  const classLevelReadiness = domainLevels.classLevelReadiness.level;
  const foundationRecoveryRequired =
    percentage < 60 ||
    domainLevels.reading.percentage < 50 ||
    domainLevels.numberRecognition.percentage < 50 ||
    domainLevels.arithmetic.percentage < 50;
  const recommendedStartingPoint = foundationRecoveryRequired
    ? `Foundation Recovery Level ${Math.max(1, estimatedClassNumber(classNumber, Math.min(percentage, domainLevels.arithmetic.percentage, domainLevels.reading.percentage)))}`
    : percentage >= 80
      ? "Grade-Level Learning"
      : "Bridge Course before Grade-Level Learning";
  const recommendedStartLevel = recommendedStartingPoint;
  const learningSpeed = percentage >= 75 ? "Fast progression possible" : percentage >= 50 ? "Steady with revision support" : "Slow foundation recovery";
  const mistakePatterns = weakAreas.map((area) => ({
    area,
    pattern: `Repeated gaps in ${area}`,
    repairAction: repairActionForArea(area),
  }));

  const learningPlan: string[] = [];
  learningPlan.push(`Start phase: ${foundationRecoveryRequired ? "Foundation Recovery" : percentage >= 80 ? "Grade-Level Learning" : "Bridge Learning"}.`);
  learningPlan.push(`Actual level estimate: ${actualLearningLevel}; enrolled level: ${pack.grade}.`);
  if (weakAreas.length) {
    learningPlan.push(`Repair weak areas first: ${weakAreas.join(", ")}.`);
  }
  learningPlan.push("Use Visual Teacher Mode, then a quick quiz, then practice questions.");
  learningPlan.push("If a topic quiz is below 70%, explain again with another visual and move to the prerequisite.");
  learningPlan.push("Target 95% readiness with weekly revision and mock tests.");
  if (riskLevel === "High") {
    learningPlan.push("Keep sessions short: 20 minutes foundation recovery + 10 minutes confidence practice.");
  }

  return {
    score,
    total,
    percentage,
    perArea,
    domainLevels,
    strongAreas,
    weakAreas,
    riskLevel,
    recommendedStartLevel,
    actualLearningLevel,
    gradeReadinessPercentage: percentage,
    recommendedStartingPoint,
    foundationRecoveryRequired,
    readingLevel,
    writingLevel,
    numberRecognitionLevel,
    arithmeticLevel,
    subjectFoundationLevel,
    classLevelReadiness,
    learningSpeed,
    mistakePatterns,
    learningPlan,
  };
}

type DiagnosticDomain = "reading" | "writing" | "numberRecognition" | "arithmetic" | "subjectFoundation" | "classLevelReadiness";

function domainsForQuestion(question: DiagnosticQuestion): DiagnosticDomain[] {
  const text = `${question.area} ${question.subject} ${question.prompt}`.toLowerCase();
  const domains = new Set<DiagnosticDomain>(["classLevelReadiness"]);
  if (/reading|comprehension|alphabet|vowel|synonym|antonym|language/.test(text)) domains.add("reading");
  if (/writing|grammar|sentence|verb|language/.test(text)) domains.add("writing");
  if (/number recognition|number sense|which number|biggest number|comes after|place value|number line/.test(text)) domains.add("numberRecognition");
  if (/math|addition|subtraction|multiplication|division|arithmetic|fraction|decimal|percentage|algebra|solve|simplify|factorise/.test(text)) domains.add("arithmetic");
  if (/science|social|evs|constitution|energy|boils|methane|study/.test(text)) domains.add("subjectFoundation");
  return Array.from(domains);
}

function estimatedClassNumber(enrolledClass: number, percentage: number) {
  if (percentage >= 80) return enrolledClass;
  if (percentage >= 60) return Math.max(1, enrolledClass - 1);
  if (percentage >= 40) return Math.max(1, enrolledClass - 2);
  return Math.max(1, enrolledClass - 4);
}

function levelLabel(enrolledClass: number, percentage: number) {
  return `Class ${estimatedClassNumber(enrolledClass, percentage)} level`;
}

function repairActionForArea(area: string) {
  if (/reading|language|grammar/i.test(area)) return "Start reading recovery with phonics, sentence meaning, and short comprehension.";
  if (/number|addition|subtraction|multiplication|division|fraction|decimal|percentage|algebra/i.test(area)) return "Move to prerequisite maths visuals, worked examples, and daily fluency practice.";
  if (/science/i.test(area)) return "Use diagrams, cause-effect visuals, and one experiment-style explanation.";
  if (/social/i.test(area)) return "Use timeline/map/context cards before textbook questions.";
  return "Explain again, show a simpler visual, and give two scaffolded practice questions.";
}
