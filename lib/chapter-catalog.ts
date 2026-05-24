// Lean chapter catalog — Math chapters across grades 6-10.
// Each chapter has prerequisite-check questions (gate) and chapter-exam questions (mastery test).
// Question concept tags drive weak-concept detection + backlog plans.

export type ChapterChoice = { id: string; text: string };
export type ChapterQuestion = {
  id: string;
  prompt: string;
  choices: ChapterChoice[];
  correctChoiceId: string;
  concept: string;
};

export type ChapterPack = {
  chapterId: string;
  grade: string;
  subject: string;
  chapter: string;
  description: string;
  prerequisites: string[];
  prerequisiteLessons: Record<string, string>;
  precheckQuestions: ChapterQuestion[];
  examQuestions: ChapterQuestion[];
};

export type ChapterAnswer = { questionId: string; choiceId: string };

export type PrecheckScore = {
  score: number;
  total: number;
  percentage: number;
  status: "ready" | "needs-prerequisites";
  weakPrerequisites: string[];
  recommendedPrerequisiteLessons: { concept: string; summary: string }[];
};

export type ExamScore = {
  score: number;
  total: number;
  percentage: number;
  mastered: boolean;
  weakConcepts: string[];
};

export const PRECHECK_PASS_PERCENT = 80;
export const MASTERY_PASS_PERCENT = 95;

// --- Catalog -----------------------------------------------------------------

const CHAPTERS: ChapterPack[] = [
  // Class 6 Math
  {
    chapterId: "c6-math-knowing-numbers",
    grade: "Class 6",
    subject: "Mathematics",
    chapter: "Knowing Our Numbers",
    description: "Place value, comparing and rounding large numbers.",
    prerequisites: ["Place value", "Comparing numbers", "Number reading"],
    prerequisiteLessons: {
      "Place value": "Each digit's value depends on its position: ones, tens, hundreds, thousands, lakhs.",
      "Comparing numbers": "Compare digits left to right; more digits means larger; equal digits compare next position.",
      "Number reading": "Read in groups: lakhs, thousands, hundreds (Indian system) or millions, thousands (international).",
    },
    precheckQuestions: [
      { id: "pc1", prompt: "In 47,328, the digit 7 is in which place?", choices: [{ id: "a", text: "Ones" }, { id: "b", text: "Tens" }, { id: "c", text: "Hundreds" }, { id: "d", text: "Thousands" }], correctChoiceId: "d", concept: "Place value" },
      { id: "pc2", prompt: "Which is the largest?", choices: [{ id: "a", text: "9,089" }, { id: "b", text: "9,809" }, { id: "c", text: "9,890" }, { id: "d", text: "9,098" }], correctChoiceId: "c", concept: "Comparing numbers" },
      { id: "pc3", prompt: "Read 1,05,200 in Indian system.", choices: [{ id: "a", text: "One lakh five thousand two hundred" }, { id: "b", text: "One lakh fifty two hundred" }, { id: "c", text: "Ten lakh five thousand two hundred" }, { id: "d", text: "One lakh five lakh two hundred" }], correctChoiceId: "a", concept: "Number reading" },
      { id: "pc4", prompt: "Which is smaller: 4,567 or 4,576?", choices: [{ id: "a", text: "4,567" }, { id: "b", text: "4,576" }, { id: "c", text: "Equal" }, { id: "d", text: "Cannot tell" }], correctChoiceId: "a", concept: "Comparing numbers" },
    ],
    examQuestions: [
      { id: "e1", prompt: "Round 4,567 to the nearest 100.", choices: [{ id: "a", text: "4,500" }, { id: "b", text: "4,600" }, { id: "c", text: "4,560" }, { id: "d", text: "5,000" }], correctChoiceId: "b", concept: "Rounding" },
      { id: "e2", prompt: "What is the successor of 99,999?", choices: [{ id: "a", text: "10,000" }, { id: "b", text: "1,00,000" }, { id: "c", text: "99,998" }, { id: "d", text: "1,00,001" }], correctChoiceId: "b", concept: "Successor / Predecessor" },
      { id: "e3", prompt: "Write 50,000 + 4,000 + 200 + 30 + 6 in standard form.", choices: [{ id: "a", text: "54,236" }, { id: "b", text: "54,326" }, { id: "c", text: "45,236" }, { id: "d", text: "5,4236" }], correctChoiceId: "a", concept: "Expanded form" },
      { id: "e4", prompt: "Largest 5-digit number using 7, 0, 3, 5, 1 (no repeat).", choices: [{ id: "a", text: "75,310" }, { id: "b", text: "73,510" }, { id: "c", text: "70,531" }, { id: "d", text: "57,310" }], correctChoiceId: "a", concept: "Forming numbers" },
      { id: "e5", prompt: "1 lakh = ?", choices: [{ id: "a", text: "10,000" }, { id: "b", text: "1,00,000" }, { id: "c", text: "10,00,000" }, { id: "d", text: "1,000" }], correctChoiceId: "b", concept: "Indian number system" },
    ],
  },
  {
    chapterId: "c6-math-whole-numbers",
    grade: "Class 6",
    subject: "Mathematics",
    chapter: "Whole Numbers",
    description: "Properties of whole numbers; number line basics.",
    prerequisites: ["Addition", "Subtraction", "Number line"],
    prerequisiteLessons: {
      Addition: "Combine quantities; commutative (a+b = b+a) and associative properties.",
      Subtraction: "Find the difference; not commutative; check by adding back.",
      "Number line": "Numbers shown left-to-right on a line; right is larger.",
    },
    precheckQuestions: [
      { id: "pc1", prompt: "15 + 27 = ?", choices: [{ id: "a", text: "32" }, { id: "b", text: "42" }, { id: "c", text: "52" }, { id: "d", text: "41" }], correctChoiceId: "b", concept: "Addition" },
      { id: "pc2", prompt: "80 − 36 = ?", choices: [{ id: "a", text: "54" }, { id: "b", text: "44" }, { id: "c", text: "34" }, { id: "d", text: "46" }], correctChoiceId: "b", concept: "Subtraction" },
      { id: "pc3", prompt: "On a number line, which is to the right of 7?", choices: [{ id: "a", text: "5" }, { id: "b", text: "6" }, { id: "c", text: "9" }, { id: "d", text: "3" }], correctChoiceId: "c", concept: "Number line" },
      { id: "pc4", prompt: "Predecessor of 100 is?", choices: [{ id: "a", text: "101" }, { id: "b", text: "99" }, { id: "c", text: "98" }, { id: "d", text: "1" }], correctChoiceId: "b", concept: "Successor / Predecessor" },
    ],
    examQuestions: [
      { id: "e1", prompt: "0 × 25 = ?", choices: [{ id: "a", text: "25" }, { id: "b", text: "0" }, { id: "c", text: "1" }, { id: "d", text: "Undefined" }], correctChoiceId: "b", concept: "Multiplication by 0" },
      { id: "e2", prompt: "Identity for addition of whole numbers is?", choices: [{ id: "a", text: "0" }, { id: "b", text: "1" }, { id: "c", text: "−1" }, { id: "d", text: "100" }], correctChoiceId: "a", concept: "Identity" },
      { id: "e3", prompt: "Smallest whole number is?", choices: [{ id: "a", text: "1" }, { id: "b", text: "0" }, { id: "c", text: "−1" }, { id: "d", text: "10" }], correctChoiceId: "b", concept: "Whole number basics" },
      { id: "e4", prompt: "Is subtraction of whole numbers commutative?", choices: [{ id: "a", text: "Yes" }, { id: "b", text: "No" }, { id: "c", text: "Sometimes" }, { id: "d", text: "Only for equal numbers" }], correctChoiceId: "b", concept: "Properties" },
      { id: "e5", prompt: "12 × (10 + 5) = ?", choices: [{ id: "a", text: "150" }, { id: "b", text: "60" }, { id: "c", text: "180" }, { id: "d", text: "170" }], correctChoiceId: "c", concept: "Distributive property" },
    ],
  },

  // Class 7 Math
  {
    chapterId: "c7-math-integers",
    grade: "Class 7",
    subject: "Mathematics",
    chapter: "Integers",
    description: "Operations on positive and negative integers.",
    prerequisites: ["Number line", "Addition", "Subtraction"],
    prerequisiteLessons: {
      "Number line": "Negatives go left of zero; positives go right.",
      Addition: "Combine quantities; sign of result depends on signs of inputs.",
      Subtraction: "Subtracting is adding the opposite: a − b = a + (−b).",
    },
    precheckQuestions: [
      { id: "pc1", prompt: "Which is greater: −5 or −9?", choices: [{ id: "a", text: "−5" }, { id: "b", text: "−9" }, { id: "c", text: "Equal" }, { id: "d", text: "Cannot tell" }], correctChoiceId: "a", concept: "Comparing integers" },
      { id: "pc2", prompt: "On a number line, where is −3?", choices: [{ id: "a", text: "Right of 0" }, { id: "b", text: "Left of 0" }, { id: "c", text: "At 0" }, { id: "d", text: "At 3" }], correctChoiceId: "b", concept: "Number line" },
      { id: "pc3", prompt: "7 + (−7) = ?", choices: [{ id: "a", text: "14" }, { id: "b", text: "0" }, { id: "c", text: "−14" }, { id: "d", text: "1" }], correctChoiceId: "b", concept: "Additive inverse" },
      { id: "pc4", prompt: "12 − 5 = ?", choices: [{ id: "a", text: "7" }, { id: "b", text: "−7" }, { id: "c", text: "17" }, { id: "d", text: "5" }], correctChoiceId: "a", concept: "Subtraction" },
    ],
    examQuestions: [
      { id: "e1", prompt: "(−4) + (−6) = ?", choices: [{ id: "a", text: "−10" }, { id: "b", text: "10" }, { id: "c", text: "−2" }, { id: "d", text: "2" }], correctChoiceId: "a", concept: "Adding negatives" },
      { id: "e2", prompt: "(−8) − (−3) = ?", choices: [{ id: "a", text: "−11" }, { id: "b", text: "11" }, { id: "c", text: "−5" }, { id: "d", text: "5" }], correctChoiceId: "c", concept: "Subtracting negatives" },
      { id: "e3", prompt: "(−5) × 4 = ?", choices: [{ id: "a", text: "20" }, { id: "b", text: "−20" }, { id: "c", text: "−9" }, { id: "d", text: "9" }], correctChoiceId: "b", concept: "Multiplying integers" },
      { id: "e4", prompt: "(−24) ÷ (−6) = ?", choices: [{ id: "a", text: "4" }, { id: "b", text: "−4" }, { id: "c", text: "−30" }, { id: "d", text: "30" }], correctChoiceId: "a", concept: "Dividing integers" },
      { id: "e5", prompt: "Absolute value of −17 is?", choices: [{ id: "a", text: "−17" }, { id: "b", text: "17" }, { id: "c", text: "0" }, { id: "d", text: "1" }], correctChoiceId: "b", concept: "Absolute value" },
    ],
  },
  {
    chapterId: "c7-math-fractions",
    grade: "Class 7",
    subject: "Mathematics",
    chapter: "Fractions and Decimals",
    description: "Operations on fractions and decimal numbers.",
    prerequisites: ["Fraction basics", "Decimal place value", "Multiplication"],
    prerequisiteLessons: {
      "Fraction basics": "A fraction has a numerator (top) and denominator (bottom).",
      "Decimal place value": "After the decimal: tenths, hundredths, thousandths.",
      Multiplication: "Repeated addition; rules for fractions: multiply numerators × numerators, denominators × denominators.",
    },
    precheckQuestions: [
      { id: "pc1", prompt: "Which is bigger: 1/2 or 1/3?", choices: [{ id: "a", text: "1/2" }, { id: "b", text: "1/3" }, { id: "c", text: "Equal" }, { id: "d", text: "Cannot tell" }], correctChoiceId: "a", concept: "Comparing fractions" },
      { id: "pc2", prompt: "0.5 + 0.25 = ?", choices: [{ id: "a", text: "0.75" }, { id: "b", text: "0.7" }, { id: "c", text: "0.30" }, { id: "d", text: "0.50" }], correctChoiceId: "a", concept: "Decimal addition" },
      { id: "pc3", prompt: "Simplify 6/8.", choices: [{ id: "a", text: "3/4" }, { id: "b", text: "4/6" }, { id: "c", text: "2/4" }, { id: "d", text: "6/8" }], correctChoiceId: "a", concept: "Simplifying fractions" },
      { id: "pc4", prompt: "0.1 as a fraction is?", choices: [{ id: "a", text: "1/10" }, { id: "b", text: "1/100" }, { id: "c", text: "10/1" }, { id: "d", text: "1/1" }], correctChoiceId: "a", concept: "Decimal to fraction" },
    ],
    examQuestions: [
      { id: "e1", prompt: "1/2 × 1/3 = ?", choices: [{ id: "a", text: "2/5" }, { id: "b", text: "1/6" }, { id: "c", text: "1/5" }, { id: "d", text: "2/6" }], correctChoiceId: "b", concept: "Multiplying fractions" },
      { id: "e2", prompt: "0.6 × 0.2 = ?", choices: [{ id: "a", text: "0.12" }, { id: "b", text: "1.2" }, { id: "c", text: "0.8" }, { id: "d", text: "0.012" }], correctChoiceId: "a", concept: "Multiplying decimals" },
      { id: "e3", prompt: "5/8 + 1/8 = ?", choices: [{ id: "a", text: "6/8" }, { id: "b", text: "6/16" }, { id: "c", text: "5/64" }, { id: "d", text: "4/8" }], correctChoiceId: "a", concept: "Adding fractions" },
      { id: "e4", prompt: "Reciprocal of 4/5 is?", choices: [{ id: "a", text: "5/4" }, { id: "b", text: "4/5" }, { id: "c", text: "−4/5" }, { id: "d", text: "20" }], correctChoiceId: "a", concept: "Reciprocals" },
      { id: "e5", prompt: "2/3 ÷ 4/9 = ?", choices: [{ id: "a", text: "8/27" }, { id: "b", text: "3/2" }, { id: "c", text: "1/2" }, { id: "d", text: "6/12" }], correctChoiceId: "b", concept: "Dividing fractions" },
    ],
  },

  // Class 8 Math
  {
    chapterId: "c8-math-rational-numbers",
    grade: "Class 8",
    subject: "Mathematics",
    chapter: "Rational Numbers",
    description: "Rational numbers, their properties, and operations.",
    prerequisites: ["Fraction basics", "Integer operations", "Number line"],
    prerequisiteLessons: {
      "Fraction basics": "Numerator over denominator; equivalent fractions and lowest form.",
      "Integer operations": "Sign rules: like signs add, unlike subtract; products of like signs are positive.",
      "Number line": "Locate fractions between integers by dividing each unit segment.",
    },
    precheckQuestions: [
      { id: "pc1", prompt: "−3/4 + 1/4 = ?", choices: [{ id: "a", text: "−2/4" }, { id: "b", text: "−1/2" }, { id: "c", text: "1" }, { id: "d", text: "−4/4" }], correctChoiceId: "b", concept: "Adding rationals" },
      { id: "pc2", prompt: "Which is between 1/2 and 1?", choices: [{ id: "a", text: "1/3" }, { id: "b", text: "3/4" }, { id: "c", text: "2" }, { id: "d", text: "0" }], correctChoiceId: "b", concept: "Number line" },
      { id: "pc3", prompt: "(−5) × (−3) = ?", choices: [{ id: "a", text: "15" }, { id: "b", text: "−15" }, { id: "c", text: "−2" }, { id: "d", text: "8" }], correctChoiceId: "a", concept: "Integer multiplication" },
      { id: "pc4", prompt: "Lowest form of 12/18 is?", choices: [{ id: "a", text: "2/3" }, { id: "b", text: "3/4" }, { id: "c", text: "6/9" }, { id: "d", text: "4/6" }], correctChoiceId: "a", concept: "Simplifying fractions" },
    ],
    examQuestions: [
      { id: "e1", prompt: "Additive inverse of 7/9 is?", choices: [{ id: "a", text: "9/7" }, { id: "b", text: "−7/9" }, { id: "c", text: "7/9" }, { id: "d", text: "−9/7" }], correctChoiceId: "b", concept: "Additive inverse" },
      { id: "e2", prompt: "Multiplicative inverse of −3/5 is?", choices: [{ id: "a", text: "5/3" }, { id: "b", text: "−5/3" }, { id: "c", text: "3/5" }, { id: "d", text: "−3/5" }], correctChoiceId: "b", concept: "Multiplicative inverse" },
      { id: "e3", prompt: "Is the set of rationals closed under division (excluding ÷0)?", choices: [{ id: "a", text: "Yes" }, { id: "b", text: "No" }, { id: "c", text: "Only positives" }, { id: "d", text: "Only integers" }], correctChoiceId: "a", concept: "Closure" },
      { id: "e4", prompt: "1/2 + 2/3 = ?", choices: [{ id: "a", text: "3/5" }, { id: "b", text: "7/6" }, { id: "c", text: "5/6" }, { id: "d", text: "3/6" }], correctChoiceId: "b", concept: "Adding rationals" },
      { id: "e5", prompt: "A rational lying between 1/3 and 1/2 is?", choices: [{ id: "a", text: "5/12" }, { id: "b", text: "1/4" }, { id: "c", text: "1" }, { id: "d", text: "0" }], correctChoiceId: "a", concept: "Rationals between two numbers" },
    ],
  },
  {
    chapterId: "c8-math-linear-equations",
    grade: "Class 8",
    subject: "Mathematics",
    chapter: "Linear Equations in One Variable",
    description: "Solving linear equations in one variable.",
    prerequisites: ["Variables", "Integer operations", "Fraction basics"],
    prerequisiteLessons: {
      Variables: "A letter standing for an unknown number we want to find.",
      "Integer operations": "Sign rules for +, −, ×, ÷.",
      "Fraction basics": "Numerator, denominator, equivalent forms.",
    },
    precheckQuestions: [
      { id: "pc1", prompt: "If x + 5 = 12, x = ?", choices: [{ id: "a", text: "7" }, { id: "b", text: "17" }, { id: "c", text: "5" }, { id: "d", text: "12" }], correctChoiceId: "a", concept: "Solving simple equations" },
      { id: "pc2", prompt: "3x = 15. x = ?", choices: [{ id: "a", text: "3" }, { id: "b", text: "5" }, { id: "c", text: "45" }, { id: "d", text: "15" }], correctChoiceId: "b", concept: "Solving by division" },
      { id: "pc3", prompt: "What is the inverse of −7?", choices: [{ id: "a", text: "7" }, { id: "b", text: "−7" }, { id: "c", text: "1/7" }, { id: "d", text: "0" }], correctChoiceId: "a", concept: "Additive inverse" },
      { id: "pc4", prompt: "Half of 8 written as a fraction times 8 is?", choices: [{ id: "a", text: "1/2 × 8" }, { id: "b", text: "2 × 8" }, { id: "c", text: "8/0" }, { id: "d", text: "8 + 1/2" }], correctChoiceId: "a", concept: "Fraction basics" },
    ],
    examQuestions: [
      { id: "e1", prompt: "Solve 2x − 3 = 7.", choices: [{ id: "a", text: "5" }, { id: "b", text: "−5" }, { id: "c", text: "2" }, { id: "d", text: "10" }], correctChoiceId: "a", concept: "Two-step equations" },
      { id: "e2", prompt: "Solve x/4 = 6.", choices: [{ id: "a", text: "24" }, { id: "b", text: "10" }, { id: "c", text: "2" }, { id: "d", text: "3/2" }], correctChoiceId: "a", concept: "Equations with fractions" },
      { id: "e3", prompt: "Solve 3(x + 2) = 18.", choices: [{ id: "a", text: "4" }, { id: "b", text: "6" }, { id: "c", text: "5" }, { id: "d", text: "8" }], correctChoiceId: "a", concept: "Equations with brackets" },
      { id: "e4", prompt: "Solve 5x + 2 = 3x + 10.", choices: [{ id: "a", text: "4" }, { id: "b", text: "−4" }, { id: "c", text: "6" }, { id: "d", text: "2" }], correctChoiceId: "a", concept: "Variables on both sides" },
      { id: "e5", prompt: "If 7x = 0, then x = ?", choices: [{ id: "a", text: "0" }, { id: "b", text: "7" }, { id: "c", text: "−7" }, { id: "d", text: "1" }], correctChoiceId: "a", concept: "Zero product" },
    ],
  },

  // Class 9 Math
  {
    chapterId: "c9-math-polynomials",
    grade: "Class 9",
    subject: "Mathematics",
    chapter: "Polynomials",
    description: "Polynomials, degrees, factor theorem basics.",
    prerequisites: ["Algebra Foundation", "Exponents", "Multiplication"],
    prerequisiteLessons: {
      "Algebra Foundation": "Expressions with variables and operations; like terms combine.",
      Exponents: "a^n means a multiplied n times; product rule a^m × a^n = a^(m+n).",
      Multiplication: "Distributive rule: a(b + c) = ab + ac.",
    },
    precheckQuestions: [
      { id: "pc1", prompt: "Combine: 3x + 5x.", choices: [{ id: "a", text: "8x" }, { id: "b", text: "15x" }, { id: "c", text: "8x²" }, { id: "d", text: "3x + 5" }], correctChoiceId: "a", concept: "Like terms" },
      { id: "pc2", prompt: "x² × x³ = ?", choices: [{ id: "a", text: "x⁵" }, { id: "b", text: "x⁶" }, { id: "c", text: "2x⁵" }, { id: "d", text: "x" }], correctChoiceId: "a", concept: "Exponents" },
      { id: "pc3", prompt: "Expand 2(x + 4).", choices: [{ id: "a", text: "2x + 4" }, { id: "b", text: "2x + 8" }, { id: "c", text: "x + 8" }, { id: "d", text: "2x − 8" }], correctChoiceId: "b", concept: "Distributive" },
      { id: "pc4", prompt: "Simplify x + x + x.", choices: [{ id: "a", text: "3x" }, { id: "b", text: "x³" }, { id: "c", text: "x + 2" }, { id: "d", text: "0" }], correctChoiceId: "a", concept: "Like terms" },
    ],
    examQuestions: [
      { id: "e1", prompt: "Degree of 4x³ + 2x − 7.", choices: [{ id: "a", text: "1" }, { id: "b", text: "2" }, { id: "c", text: "3" }, { id: "d", text: "7" }], correctChoiceId: "c", concept: "Degree" },
      { id: "e2", prompt: "Is 5 a polynomial?", choices: [{ id: "a", text: "Yes (constant)" }, { id: "b", text: "No" }, { id: "c", text: "Only if x is present" }, { id: "d", text: "Not defined" }], correctChoiceId: "a", concept: "Polynomial definition" },
      { id: "e3", prompt: "Value of p(x) = x² − 3x + 2 at x = 1.", choices: [{ id: "a", text: "0" }, { id: "b", text: "2" }, { id: "c", text: "−2" }, { id: "d", text: "1" }], correctChoiceId: "a", concept: "Evaluating polynomials" },
      { id: "e4", prompt: "Factorise x² − 9.", choices: [{ id: "a", text: "(x − 3)(x + 3)" }, { id: "b", text: "(x − 9)(x + 1)" }, { id: "c", text: "(x − 3)²" }, { id: "d", text: "x(x − 9)" }], correctChoiceId: "a", concept: "Difference of squares" },
      { id: "e5", prompt: "If p(2) = 0 for p(x), then (x − 2) is a?", choices: [{ id: "a", text: "Root" }, { id: "b", text: "Factor of p(x)" }, { id: "c", text: "Coefficient" }, { id: "d", text: "Constant" }], correctChoiceId: "b", concept: "Factor theorem" },
    ],
  },

  // Class 10 Math
  {
    chapterId: "c10-math-quadratic",
    grade: "Class 10",
    subject: "Mathematics",
    chapter: "Quadratic Equations",
    description: "Solving quadratic equations by factorisation and formula.",
    prerequisites: ["Polynomials", "Factorisation", "Square roots"],
    prerequisiteLessons: {
      Polynomials: "Sum of terms with non-negative integer powers of x.",
      Factorisation: "Express as product of factors; e.g., x² − 9 = (x−3)(x+3).",
      "Square roots": "If x² = a (a ≥ 0), then x = ±√a.",
    },
    precheckQuestions: [
      { id: "pc1", prompt: "Factorise x² + 5x + 6.", choices: [{ id: "a", text: "(x+2)(x+3)" }, { id: "b", text: "(x+1)(x+6)" }, { id: "c", text: "(x−2)(x−3)" }, { id: "d", text: "(x+6)²" }], correctChoiceId: "a", concept: "Factorisation" },
      { id: "pc2", prompt: "√81 = ?", choices: [{ id: "a", text: "9" }, { id: "b", text: "8" }, { id: "c", text: "±9" }, { id: "d", text: "81" }], correctChoiceId: "c", concept: "Square roots" },
      { id: "pc3", prompt: "Degree of x² − 4x + 4.", choices: [{ id: "a", text: "1" }, { id: "b", text: "2" }, { id: "c", text: "3" }, { id: "d", text: "4" }], correctChoiceId: "b", concept: "Polynomials" },
      { id: "pc4", prompt: "(x − 3)(x + 3) = ?", choices: [{ id: "a", text: "x² − 9" }, { id: "b", text: "x² + 9" }, { id: "c", text: "x² − 6x + 9" }, { id: "d", text: "x² − 3x" }], correctChoiceId: "a", concept: "Identities" },
    ],
    examQuestions: [
      { id: "e1", prompt: "Roots of x² − 5x + 6 = 0.", choices: [{ id: "a", text: "2, 3" }, { id: "b", text: "−2, −3" }, { id: "c", text: "1, 6" }, { id: "d", text: "−1, −6" }], correctChoiceId: "a", concept: "Factorisation roots" },
      { id: "e2", prompt: "Discriminant of ax² + bx + c is?", choices: [{ id: "a", text: "b² − 4ac" }, { id: "b", text: "b² + 4ac" }, { id: "c", text: "−b/2a" }, { id: "d", text: "4ac − b²" }], correctChoiceId: "a", concept: "Discriminant" },
      { id: "e3", prompt: "Nature of roots when b² − 4ac < 0.", choices: [{ id: "a", text: "Real and equal" }, { id: "b", text: "Real and distinct" }, { id: "c", text: "No real roots" }, { id: "d", text: "Always zero" }], correctChoiceId: "c", concept: "Nature of roots" },
      { id: "e4", prompt: "Solve x² = 49.", choices: [{ id: "a", text: "7" }, { id: "b", text: "−7" }, { id: "c", text: "±7" }, { id: "d", text: "49" }], correctChoiceId: "c", concept: "Square roots" },
      { id: "e5", prompt: "If one root of x² − 7x + k = 0 is 3, k = ?", choices: [{ id: "a", text: "12" }, { id: "b", text: "10" }, { id: "c", text: "4" }, { id: "d", text: "21" }], correctChoiceId: "a", concept: "Sum/product of roots" },
    ],
  },
];

// --- API ---------------------------------------------------------------------

export function listChaptersForGradeSubject(grade: string, subject: string): ChapterPack[] {
  return CHAPTERS.filter((c) => c.grade === grade && c.subject === subject);
}

export function listAllChaptersForGrade(grade: string): ChapterPack[] {
  return CHAPTERS.filter((c) => c.grade === grade);
}

export function getChapterPack(chapterId: string): ChapterPack | undefined {
  return CHAPTERS.find((c) => c.chapterId === chapterId);
}

export function scorePrecheck(pack: ChapterPack, answers: ChapterAnswer[]): PrecheckScore {
  const total = pack.precheckQuestions.length;
  const conceptWrong = new Map<string, number>();
  const conceptTotal = new Map<string, number>();
  let score = 0;
  for (const q of pack.precheckQuestions) {
    conceptTotal.set(q.concept, (conceptTotal.get(q.concept) ?? 0) + 1);
    const answer = answers.find((a) => a.questionId === q.id);
    if (answer?.choiceId === q.correctChoiceId) {
      score += 1;
    } else {
      conceptWrong.set(q.concept, (conceptWrong.get(q.concept) ?? 0) + 1);
    }
  }
  const percentage = total === 0 ? 0 : Math.round((score / total) * 1000) / 10;
  const weakPrerequisites: string[] = [];
  for (const [concept, wrong] of conceptWrong.entries()) {
    const t = conceptTotal.get(concept) ?? 1;
    if (wrong / t >= 0.5) weakPrerequisites.push(concept);
  }
  const recommendedPrerequisiteLessons = weakPrerequisites.map((concept) => ({
    concept,
    summary: pack.prerequisiteLessons[concept] || `Review the basics of ${concept}.`,
  }));
  const status: PrecheckScore["status"] = percentage >= PRECHECK_PASS_PERCENT && weakPrerequisites.length === 0 ? "ready" : "needs-prerequisites";
  return { score, total, percentage, status, weakPrerequisites, recommendedPrerequisiteLessons };
}

export function scoreExam(pack: ChapterPack, answers: ChapterAnswer[]): ExamScore {
  const total = pack.examQuestions.length;
  const conceptWrong = new Map<string, number>();
  const conceptTotal = new Map<string, number>();
  let score = 0;
  for (const q of pack.examQuestions) {
    conceptTotal.set(q.concept, (conceptTotal.get(q.concept) ?? 0) + 1);
    const answer = answers.find((a) => a.questionId === q.id);
    if (answer?.choiceId === q.correctChoiceId) {
      score += 1;
    } else {
      conceptWrong.set(q.concept, (conceptWrong.get(q.concept) ?? 0) + 1);
    }
  }
  const percentage = total === 0 ? 0 : Math.round((score / total) * 1000) / 10;
  const weakConcepts: string[] = [];
  for (const [concept, wrong] of conceptWrong.entries()) {
    if (wrong > 0) weakConcepts.push(concept);
  }
  const mastered = percentage >= MASTERY_PASS_PERCENT;
  return { score, total, percentage, mastered, weakConcepts };
}

// Helper for client: strip correctChoiceId before sending to the browser.
export function publicPack(pack: ChapterPack, kind: "precheck" | "exam") {
  const questions = (kind === "precheck" ? pack.precheckQuestions : pack.examQuestions).map((q) => ({
    id: q.id,
    prompt: q.prompt,
    choices: q.choices,
    concept: q.concept,
  }));
  return {
    chapterId: pack.chapterId,
    grade: pack.grade,
    subject: pack.subject,
    chapter: pack.chapter,
    description: pack.description,
    prerequisites: pack.prerequisites,
    questions,
  };
}
