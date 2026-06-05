import { getClassNumberFromGrade, getSubjectsForStudent } from "./grade-catalog";
import type { DiagnosticRecord } from "./diagnostic-store";

export type MasteryStatus = "Not started" | "Learning" | "Needs practice" | "Weak" | "Improving" | "Mastered" | "Exam-ready";

export type AdaptiveTask = {
  title: string;
  type: "diagnostic" | "foundation" | "bridge" | "grade-level" | "visual-lesson" | "quiz" | "revision" | "mock-test";
  minutes: number;
  subject: string;
  topic: string;
  action: string;
};

export type AdaptiveLearningSnapshot = {
  childId: string;
  childName: string;
  enrolledGrade: string;
  actualLearningLevel: string;
  gradeReadinessPercentage: number;
  currentPhase: "Diagnostic" | "Foundation Recovery" | "Grade-Level Learning" | "Exam Mastery" | "95% Target Plan";
  recommendedStartingPoint: string;
  foundationRecoveryRequired: boolean;
  learningSpeed: string;
  weakAreas: string[];
  strongAreas: string[];
  foundationTopics: string[];
  bridgeTopics: string[];
  classSyllabusTopics: string[];
  revisionTopics: string[];
  weakTopicRepairLoop: string[];
  todayPlan: AdaptiveTask[];
  weeklyRevisionPlan: string[];
  mockTestSchedule: string[];
  masteryMap: { subject: string; topic: string; status: MasteryStatus; masteryScore: number; nextAction: string }[];
  examReadiness: {
    targetScore: number;
    examDate: string;
    currentReadinessPercentage: number;
    predictedScore: number;
    topicsBlockingTarget: string[];
    dailyStudyPlan: string[];
    weeklyRevisionPlan: string[];
    mockTestSchedule: string[];
  };
  parentAction: string;
  studentAction: string;
};

export function buildAdaptiveLearningSnapshot({
  childId,
  childName,
  enrolledGrade,
  diagnostic,
  targetScore = 95,
  dailyAvailableMinutes = 45,
  examDate,
}: {
  childId: string;
  childName: string;
  enrolledGrade: string;
  diagnostic?: DiagnosticRecord | null;
  targetScore?: number;
  dailyAvailableMinutes?: number;
  examDate?: Date;
}): AdaptiveLearningSnapshot {
  if (!diagnostic) {
    return buildPreDiagnosticSnapshot({ childId, childName, enrolledGrade, targetScore, dailyAvailableMinutes, examDate });
  }

  const weakAreas = diagnostic.weakAreas;
  const strongAreas = diagnostic.strongAreas;
  const readiness = Math.round(diagnostic.gradeReadinessPercentage ?? diagnostic.percentage);
  const foundationRecoveryRequired = diagnostic.foundationRecoveryRequired || readiness < 60;
  const currentPhase = phaseForReadiness(readiness, foundationRecoveryRequired);
  const foundationTopics = foundationRecoveryRequired ? foundationTopicsForDiagnostic(diagnostic) : [];
  const bridgeTopics = bridgeTopicsForDiagnostic(diagnostic);
  const classSyllabusTopics = getClassSyllabusTopics(enrolledGrade, weakAreas);
  const revisionTopics = Array.from(new Set([...weakAreas, ...strongAreas.slice(0, 2)])).slice(0, 8);
  const weakTopicRepairLoop = buildWeakTopicRepairLoop(weakAreas);
  const todayPlan = buildTodayPlan({ diagnostic, foundationTopics, bridgeTopics, classSyllabusTopics, dailyAvailableMinutes });
  const weeklyRevisionPlan = buildWeeklyRevisionPlan(revisionTopics, readiness);
  const mockTestSchedule = buildMockTestSchedule(readiness);
  const topicsBlockingTarget = Array.from(new Set([...weakAreas, ...foundationTopics, ...bridgeTopics])).slice(0, 10);
  const predictedScore = predictExamScore(readiness, weakAreas.length, foundationRecoveryRequired);

  return {
    childId,
    childName,
    enrolledGrade,
    actualLearningLevel: diagnostic.actualLearningLevel,
    gradeReadinessPercentage: readiness,
    currentPhase,
    recommendedStartingPoint: diagnostic.recommendedStartingPoint || diagnostic.recommendedStartLevel,
    foundationRecoveryRequired,
    learningSpeed: diagnostic.learningSpeed,
    weakAreas,
    strongAreas,
    foundationTopics,
    bridgeTopics,
    classSyllabusTopics,
    revisionTopics,
    weakTopicRepairLoop,
    todayPlan,
    weeklyRevisionPlan,
    mockTestSchedule,
    masteryMap: buildMasteryMap(diagnostic, classSyllabusTopics),
    examReadiness: {
      targetScore,
      examDate: (examDate || defaultExamDate()).toISOString(),
      currentReadinessPercentage: readiness,
      predictedScore,
      topicsBlockingTarget,
      dailyStudyPlan: todayPlan.map((task) => `${task.minutes} min: ${task.title}`),
      weeklyRevisionPlan,
      mockTestSchedule,
    },
    parentAction: foundationRecoveryRequired
      ? "Let the app run foundation recovery first. Do not push class syllabus until prerequisites improve."
      : "Keep daily practice consistent and let the app unlock grade-level chapters after pre-checks.",
    studentAction: todayPlan[0]?.action || "Start your diagnostic honestly.",
  };
}

export function calculateMasteryStatus(input: {
  diagnosticScore?: number;
  quizScore?: number;
  retryCount?: number;
  timeSpentMinutes?: number;
  repeatedMistakes?: number;
  revisionScore?: number;
  mockTestScore?: number;
}): { status: MasteryStatus; masteryScore: number; nextAction: string } {
  const diagnostic = input.diagnosticScore ?? 0;
  const quiz = input.quizScore ?? diagnostic;
  const revision = input.revisionScore ?? quiz;
  const mock = input.mockTestScore ?? revision;
  const retryPenalty = Math.min(15, (input.retryCount || 0) * 3);
  const mistakePenalty = Math.min(20, (input.repeatedMistakes || 0) * 5);
  const timeBoost = Math.min(8, Math.floor((input.timeSpentMinutes || 0) / 20));
  const masteryScore = clamp(Math.round(diagnostic * 0.2 + quiz * 0.35 + revision * 0.2 + mock * 0.25 + timeBoost - retryPenalty - mistakePenalty), 0, 100);

  if (masteryScore >= 95 && mock >= 90) return { status: "Exam-ready", masteryScore, nextAction: "Keep weekly mock tests and light revision." };
  if (masteryScore >= 85) return { status: "Mastered", masteryScore, nextAction: "Take exam-style questions to reach 95%." };
  if (masteryScore >= 70) return { status: "Improving", masteryScore, nextAction: "Practice mixed questions and revise mistakes." };
  if (masteryScore >= 50) return { status: "Needs practice", masteryScore, nextAction: "Explain again with another visual, then retry quiz." };
  if (masteryScore > 0) return { status: "Weak", masteryScore, nextAction: "Move back to prerequisite concept." };
  return { status: "Not started", masteryScore, nextAction: "Start with diagnostic or first visual lesson." };
}

function buildPreDiagnosticSnapshot({
  childId,
  childName,
  enrolledGrade,
  targetScore,
  dailyAvailableMinutes,
  examDate,
}: {
  childId: string;
  childName: string;
  enrolledGrade: string;
  targetScore: number;
  dailyAvailableMinutes: number;
  examDate?: Date;
}): AdaptiveLearningSnapshot {
  const subjects = getSubjectsForStudent(enrolledGrade).slice(0, 5);
  const todayPlan: AdaptiveTask[] = [
    {
      title: "Complete baseline diagnostic",
      type: "diagnostic",
      minutes: Math.min(30, dailyAvailableMinutes),
      subject: "Overall",
      topic: "Baseline",
      action: "Answer honestly so the app can start at the real level.",
    },
  ];
  return {
    childId,
    childName,
    enrolledGrade,
    actualLearningLevel: "Not measured yet",
    gradeReadinessPercentage: 0,
    currentPhase: "Diagnostic",
    recommendedStartingPoint: "Baseline Diagnostic",
    foundationRecoveryRequired: true,
    learningSpeed: "Not measured yet",
    weakAreas: [],
    strongAreas: [],
    foundationTopics: ["Reading basics", "Number recognition", "Basic arithmetic"],
    bridgeTopics: [],
    classSyllabusTopics: subjects,
    revisionTopics: [],
    weakTopicRepairLoop: ["Diagnose", "Start foundation recovery", "Retest"],
    todayPlan,
    weeklyRevisionPlan: ["Complete diagnostic first."],
    mockTestSchedule: ["Mock tests begin after foundation and bridge topics start."],
    masteryMap: subjects.map((subject) => ({ subject, topic: "Baseline", status: "Not started", masteryScore: 0, nextAction: "Complete diagnostic." })),
    examReadiness: {
      targetScore,
      examDate: (examDate || defaultExamDate()).toISOString(),
      currentReadinessPercentage: 0,
      predictedScore: 0,
      topicsBlockingTarget: ["Baseline diagnostic not complete"],
      dailyStudyPlan: todayPlan.map((task) => `${task.minutes} min: ${task.title}`),
      weeklyRevisionPlan: ["No revision schedule until baseline is complete."],
      mockTestSchedule: ["No mock test until baseline is complete."],
    },
    parentAction: "Ask the child to complete the diagnostic without help.",
    studentAction: "Start baseline diagnostic.",
  };
}

function phaseForReadiness(readiness: number, foundationRecoveryRequired: boolean): AdaptiveLearningSnapshot["currentPhase"] {
  if (foundationRecoveryRequired) return "Foundation Recovery";
  if (readiness < 80) return "Grade-Level Learning";
  if (readiness < 93) return "Exam Mastery";
  return "95% Target Plan";
}

function foundationTopicsForDiagnostic(diagnostic: DiagnosticRecord) {
  const topics = new Set<string>();
  if (diagnostic.readingLevel.includes("Class 1") || diagnostic.readingLevel.includes("Class 2") || diagnostic.weakAreas.some((area) => /reading|alphabet/i.test(area))) {
    topics.add("Reading sounds and simple words");
  }
  if (diagnostic.numberRecognitionLevel.includes("Class 1") || diagnostic.weakAreas.some((area) => /number/i.test(area))) {
    topics.add("Number recognition and place value");
  }
  if (diagnostic.arithmeticLevel.includes("Class 1") || diagnostic.arithmeticLevel.includes("Class 2") || diagnostic.weakAreas.some((area) => /arithmetic|addition|subtraction/i.test(area))) {
    topics.add("Addition and subtraction facts");
  }
  diagnostic.weakAreas.forEach((area) => {
    if (/fraction|decimal/i.test(area)) topics.add("Fractions made visual");
    if (/multiplication|division/i.test(area)) topics.add("Multiplication and division recovery");
  });
  return Array.from(topics).length ? Array.from(topics) : ["Reading basics", "Number recognition", "Basic arithmetic"];
}

function bridgeTopicsForDiagnostic(diagnostic: DiagnosticRecord) {
  const topics = new Set<string>();
  diagnostic.weakAreas.forEach((area) => {
    if (/fraction|decimal|percentage/i.test(area)) topics.add("Fractions, decimals, and percentages bridge");
    if (/algebra/i.test(area)) topics.add("Variables and simple equations bridge");
    if (/science/i.test(area)) topics.add("Science vocabulary and cause-effect bridge");
    if (/social/i.test(area)) topics.add("Timeline, map, and civics basics bridge");
    if (/reading|grammar|language/i.test(area)) topics.add("Reading comprehension and grammar bridge");
  });
  if (!topics.size && diagnostic.percentage < 80) topics.add("Mixed prerequisite bridge");
  return Array.from(topics);
}

function getClassSyllabusTopics(enrolledGrade: string, weakAreas: string[]) {
  const classNumber = getClassNumberFromGrade(enrolledGrade);
  const base = classNumber >= 6
    ? ["Maths current chapter", "Science current chapter", "Social Science current chapter", "English reading and writing"]
    : ["Maths basics", "EVS", "Reading", "Writing"];
  return Array.from(new Set([...weakAreas.slice(0, 3).map((area) => `${area} grade-level application`), ...base])).slice(0, 8);
}

function buildWeakTopicRepairLoop(weakAreas: string[]) {
  if (!weakAreas.length) {
    return ["Teach grade-level concept", "Quick quiz", "Spaced revision", "Mock test"];
  }
  return weakAreas.flatMap((area) => [
    `${area}: explain again with a simpler visual`,
    `${area}: give prerequisite practice`,
    `${area}: retest and unlock next step only after 70%+`,
  ]);
}

function buildTodayPlan({
  diagnostic,
  foundationTopics,
  bridgeTopics,
  classSyllabusTopics,
  dailyAvailableMinutes,
}: {
  diagnostic: DiagnosticRecord;
  foundationTopics: string[];
  bridgeTopics: string[];
  classSyllabusTopics: string[];
  dailyAvailableMinutes: number;
}): AdaptiveTask[] {
  const plan: AdaptiveTask[] = [];
  const primaryFoundation = foundationTopics[0];
  const primaryBridge = bridgeTopics[0];
  const primaryGrade = classSyllabusTopics[0] || "Current class topic";
  if (diagnostic.foundationRecoveryRequired && primaryFoundation) {
    plan.push({ title: `Foundation recovery: ${primaryFoundation}`, type: "foundation", minutes: 20, subject: "Foundation", topic: primaryFoundation, action: "Watch animated visual lesson, then answer 5 basics." });
    plan.push({ title: "Weak-topic repair quiz", type: "quiz", minutes: 10, subject: "Foundation", topic: primaryFoundation, action: "If below 70%, move to prerequisite and explain again." });
  } else if (primaryBridge) {
    plan.push({ title: `Bridge topic: ${primaryBridge}`, type: "bridge", minutes: 20, subject: "Bridge", topic: primaryBridge, action: "Connect prerequisite to class-level topic." });
  }
  plan.push({ title: `Grade-level preview: ${primaryGrade}`, type: "grade-level", minutes: 15, subject: "Grade", topic: primaryGrade, action: "Try only after the prerequisite visual feels clear." });
  plan.push({ title: "Spaced revision", type: "revision", minutes: Math.max(5, dailyAvailableMinutes - plan.reduce((sum, task) => sum + task.minutes, 0)), subject: "Revision", topic: diagnostic.weakAreas[0] || "Mixed revision", action: "Review yesterday's mistakes." });
  return plan;
}

function buildWeeklyRevisionPlan(revisionTopics: string[], readiness: number) {
  const topics = revisionTopics.length ? revisionTopics : ["Current weak topics"];
  return [
    `Mon-Wed: repair ${topics.slice(0, 2).join(", ")} with visual lessons.`,
    `Thu: mixed practice from ${topics.slice(0, 3).join(", ")}.`,
    "Fri: retry weak-topic quizzes.",
    readiness >= 70 ? "Sat: chapter mock test." : "Sat: foundation checkpoint.",
    "Sun: light revision and confidence practice.",
  ];
}

function buildMockTestSchedule(readiness: number) {
  if (readiness < 50) return ["No full mock yet. Start with 10-question foundation checkpoints twice a week."];
  if (readiness < 75) return ["One short mock every Saturday after bridge practice."];
  return ["One chapter mock every week and one cumulative mock every month."];
}

function buildMasteryMap(diagnostic: DiagnosticRecord, classSyllabusTopics: string[]) {
  const weak = diagnostic.weakAreas.map((topic) => {
    const mastery = calculateMasteryStatus({ diagnosticScore: 35, repeatedMistakes: 2 });
    return { subject: subjectForTopic(topic), topic, ...mastery };
  });
  const strong = diagnostic.strongAreas.slice(0, 4).map((topic) => {
    const mastery = calculateMasteryStatus({ diagnosticScore: 82, quizScore: 82, revisionScore: 78 });
    return { subject: subjectForTopic(topic), topic, ...mastery };
  });
  const upcoming = classSyllabusTopics.slice(0, 4).map((topic) => ({ subject: subjectForTopic(topic), topic, status: "Not started" as MasteryStatus, masteryScore: 0, nextAction: "Locked until prerequisites are ready." }));
  return [...weak, ...strong, ...upcoming].slice(0, 10);
}

function predictExamScore(readiness: number, weakTopicCount: number, foundationRecoveryRequired: boolean) {
  const recoveryPenalty = foundationRecoveryRequired ? 12 : 0;
  const weakPenalty = Math.min(18, weakTopicCount * 3);
  return clamp(Math.round(readiness + 12 - recoveryPenalty - weakPenalty), 0, 96);
}

function subjectForTopic(topic: string) {
  if (/fraction|decimal|percentage|algebra|number|arithmetic|addition|subtraction|multiplication|division|math/i.test(topic)) return "Maths";
  if (/science|energy|water|organ|motion|force|chemical/i.test(topic)) return "Science";
  if (/reading|grammar|language|writing|alphabet|sentence/i.test(topic)) return "English";
  if (/social|constitution|capital|map|timeline/i.test(topic)) return "Social Science";
  return "Overall";
}

function defaultExamDate() {
  const now = new Date();
  return new Date(now.getFullYear() + (now.getMonth() >= 2 ? 1 : 0), 2, 15);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
