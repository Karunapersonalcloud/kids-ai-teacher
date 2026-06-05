export type LearningChapter = {
  number: number;
  name: string;
  concepts: string[];
};

export type LearningSubjectCatalog = Record<string, LearningChapter[]>;

const fallbackConcepts = ["Introduction", "Key concept", "Real-life example", "Practice questions", "Common mistakes", "Summary"];

const fallbackChapters: LearningChapter[] = [
  { number: 1, name: "Basics", concepts: fallbackConcepts },
  { number: 2, name: "Core Concepts", concepts: fallbackConcepts },
  { number: 3, name: "Practice and Revision", concepts: fallbackConcepts },
  { number: 4, name: "Application-Based Questions", concepts: fallbackConcepts },
  { number: 5, name: "Exam Preparation", concepts: fallbackConcepts },
];

const languageChapters: LearningChapter[] = [
  { number: 1, name: "Reading Basics", concepts: ["Letters and sounds", "Vocabulary", "Reading aloud", "Meaning of words"] },
  { number: 2, name: "Grammar Basics", concepts: ["Nouns", "Pronouns", "Verbs", "Simple sentences"] },
  { number: 3, name: "Writing Practice", concepts: ["Word writing", "Sentence writing", "Picture writing", "Common mistakes"] },
  { number: 4, name: "Comprehension", concepts: ["Read and answer", "Main idea", "New words", "Retelling"] },
  { number: 5, name: "Revision", concepts: ["Vocabulary revision", "Grammar revision", "Reading practice", "Writing practice"] },
];

const computerPrimaryChapters: LearningChapter[] = [
  { number: 1, name: "Computer Basics", concepts: ["Parts of a computer", "Uses of a computer", "Keyboard", "Mouse"] },
  { number: 2, name: "Digital Safety", concepts: ["Safe screen time", "Ask an adult", "Passwords", "Kind online behavior"] },
  { number: 3, name: "Creative Computer Work", concepts: ["Typing", "Drawing tools", "Simple documents", "Practice activity"] },
];

const lowerSubjects = ["English", "Maths", "EVS", "Hindi", "Kannada", "Telugu", "Computer"];
const middlePrimarySubjects = ["English", "Maths", "EVS", "Hindi", "Kannada", "Telugu", "Computer", "General Knowledge"];
const upperSubjects = ["English", "Maths", "Science", "Social Science", "Hindi", "Kannada", "Telugu", "Computer"];
const highSubjects = ["English", "Maths", "Science", "Social Science", "Hindi", "Kannada", "Telugu", "Computer / AI"];

const catalog: Record<number, LearningSubjectCatalog> = {
  1: {
    Maths: [
      { number: 1, name: "Numbers", concepts: ["Counting numbers", "Number names", "Before and after numbers", "Comparing numbers"] },
      { number: 2, name: "Addition", concepts: ["Adding with objects", "Adding on fingers", "Number line addition", "Simple sums"] },
      { number: 3, name: "Shapes", concepts: ["Circle", "Square", "Triangle", "Rectangle"] },
    ],
    English: [
      { number: 1, name: "Letters and Sounds", concepts: ["Alphabet", "Vowels and consonants", "Simple words"] },
      { number: 2, name: "Words and Sentences", concepts: ["Picture words", "Rhyming words", "Small sentences", "Reading aloud"] },
    ],
    EVS: [
      { number: 1, name: "About Me", concepts: ["My body", "My family", "My school"] },
      { number: 2, name: "Good Habits", concepts: ["Clean hands", "Healthy food", "Sleep", "Sharing"] },
    ],
  },
  2: {
    Maths: [
      { number: 1, name: "Numbers", concepts: ["Place value", "Number names", "Before and after", "Comparing numbers"] },
      { number: 2, name: "Addition", concepts: ["Addition facts", "Carry over", "Word problems", "Mental maths"] },
      { number: 3, name: "Subtraction", concepts: ["Subtraction facts", "Borrowing", "Difference", "Word problems"] },
      { number: 4, name: "Shapes", concepts: ["Flat shapes", "Solid shapes", "Sides and corners", "Patterns"] },
      { number: 5, name: "Measurement", concepts: ["Length", "Weight", "Capacity", "Time"] },
    ],
    EVS: [
      { number: 1, name: "About Me", concepts: ["My body", "My likes", "My school", "Good habits"] },
      { number: 2, name: "My Family", concepts: ["Family members", "Helping at home", "Family tree", "Respect"] },
      { number: 3, name: "Animals Around Us", concepts: ["Animal homes", "Farm animals", "Wild animals", "Animal sounds"] },
      { number: 4, name: "Plants Around Us", concepts: ["Parts of a plant", "Uses of plants", "Plant care", "Seeds"] },
      { number: 5, name: "Food We Eat", concepts: ["Healthy food", "Meals", "Food sources", "Good eating habits"] },
    ],
    English: [
      { number: 1, name: "Reading Words", concepts: ["Sight words", "Phonics", "Word meaning", "Reading aloud"] },
      { number: 2, name: "Simple Sentences", concepts: ["Capital letters", "Full stop", "Sentence order", "Picture sentences"] },
      { number: 3, name: "Nouns", concepts: ["Naming words", "People", "Places", "Things"] },
      { number: 4, name: "Verbs", concepts: ["Action words", "Daily actions", "Verb in sentence", "Simple practice"] },
      { number: 5, name: "Picture Reading", concepts: ["Observe picture", "Name objects", "Make sentences", "Answer questions"] },
    ],
  },
  3: {
    Maths: [
      { number: 1, name: "Numbers", concepts: ["Place value", "Expanded form", "Comparing numbers", "Number patterns"] },
      { number: 2, name: "Addition and Subtraction", concepts: ["Carry addition", "Borrow subtraction", "Checking answers", "Word problems"] },
      { number: 3, name: "Multiplication", concepts: ["Tables", "Repeated addition", "Multiplication facts", "Word problems"] },
      { number: 4, name: "Division", concepts: ["Equal sharing", "Remainder", "Division facts", "Word problems"] },
      { number: 5, name: "Fractions", concepts: ["Part of a whole", "Half", "Quarter", "Comparing simple fractions"] },
    ],
    EVS: [
      { number: 1, name: "Family and Friends", concepts: ["Family roles", "Helping others", "Community", "Relationships"] },
      { number: 2, name: "Plants", concepts: ["Parts of plants", "Needs of plants", "Uses of plants", "Plant care"] },
      { number: 3, name: "Animals", concepts: ["Animal homes", "Food habits", "Movement", "Care for animals"] },
      { number: 4, name: "Food and Water", concepts: ["Food sources", "Clean water", "Balanced food", "Saving water"] },
      { number: 5, name: "Shelter", concepts: ["Types of houses", "Materials", "Clean home", "Safety"] },
    ],
    English: [
      { number: 1, name: "Reading Comprehension", concepts: ["Main idea", "New words", "Answer questions", "Retell story"] },
      { number: 2, name: "Nouns", concepts: ["Common nouns", "Proper nouns", "Singular and plural", "Examples"] },
      { number: 3, name: "Pronouns", concepts: ["He", "She", "It", "They"] },
      { number: 4, name: "Verbs", concepts: ["Action words", "Helping verbs", "Tense basics", "Sentence practice"] },
      { number: 5, name: "Story Writing", concepts: ["Beginning", "Middle", "End", "Picture story"] },
    ],
  },
  4: {
    Maths: namedChapters(["Numbers", "Addition and Subtraction", "Multiplication and Division", "Fractions", "Measurement", "Geometry"]),
    EVS: namedChapters(["Plants", "Animals", "Food", "Water", "Transport", "Our Environment"]),
  },
  5: {
    Maths: namedChapters(["Large Numbers", "Operations", "Factors and Multiples", "Fractions", "Decimals", "Geometry", "Measurement"]),
    EVS: namedChapters(["Plants and Animals", "Food and Health", "Water", "Shelter", "Travel", "Environment"]),
  },
  6: {
    Maths: namedChapters(["Knowing Our Numbers", "Whole Numbers", "Playing with Numbers", "Basic Geometrical Ideas", "Integers", "Fractions", "Decimals", "Algebra"]),
    Science: namedChapters(["Food", "Components of Food", "Fibre to Fabric", "Sorting Materials", "Separation of Substances", "Changes Around Us", "Plants", "Body Movements"]),
    "Social Science": namedChapters(["History: What, Where, How and When", "Geography: The Earth", "Civics: Diversity"]),
  },
  7: {
    Maths: namedChapters(["Integers", "Fractions and Decimals", "Data Handling", "Simple Equations", "Lines and Angles", "Triangle and Its Properties", "Comparing Quantities", "Algebraic Expressions"]),
    Science: namedChapters(["Nutrition in Plants", "Nutrition in Animals", "Heat", "Acids, Bases and Salts", "Physical and Chemical Changes", "Respiration", "Transportation", "Reproduction in Plants"]),
  },
  8: {
    Maths: namedChapters(["Rational Numbers", "Linear Equations", "Understanding Quadrilaterals", "Data Handling", "Squares and Square Roots", "Cubes and Cube Roots", "Comparing Quantities", "Algebraic Expressions"]),
    Science: namedChapters(["Crop Production", "Microorganisms", "Coal and Petroleum", "Combustion and Flame", "Conservation of Plants and Animals", "Reproduction", "Force and Pressure", "Sound"]),
  },
  9: {
    Maths: [
      {
        number: 1,
        name: "Number Systems",
        concepts: [
          "Natural numbers",
          "Whole numbers",
          "Integers",
          "Rational numbers",
          "Irrational numbers",
          "Real numbers",
          "Number line representation",
          "Decimal expansion",
          "Laws of exponents",
        ],
      },
      { number: 2, name: "Polynomials", concepts: ["Introduction to Polynomials", "Degree of a Polynomial", "Types of Polynomials", "Zeroes of a Polynomial", "Remainder Theorem", "Factor Theorem", "Algebraic Identities"] },
      { number: 3, name: "Coordinate Geometry", concepts: ["Cartesian Plane", "Coordinates of a Point", "Quadrants", "Plotting Points"] },
      { number: 4, name: "Linear Equations in Two Variables", concepts: ["Linear equation form", "Solutions of a linear equation", "Graph of a linear equation", "Applications"] },
      { number: 5, name: "Introduction to Euclid's Geometry", concepts: ["Definitions", "Axioms", "Postulates", "Theorems"] },
      { number: 6, name: "Lines and Angles", concepts: ["Pairs of angles", "Parallel lines", "Transversal", "Angle sum property"] },
      { number: 7, name: "Triangles", concepts: ["Congruence", "Criteria", "Properties", "Inequalities"] },
    ],
    Science: namedChapters(["Matter in Our Surroundings", "Is Matter Around Us Pure", "Atoms and Molecules", "Structure of the Atom", "Motion", "Force and Laws of Motion", "Gravitation", "Work and Energy"]),
  },
  10: {
    Maths: namedChapters(["Real Numbers", "Polynomials", "Pair of Linear Equations", "Quadratic Equations", "Arithmetic Progressions", "Triangles", "Coordinate Geometry", "Trigonometry", "Circles", "Statistics"]),
    Science: namedChapters(["Chemical Reactions and Equations", "Acids, Bases and Salts", "Metals and Non-metals", "Carbon and Its Compounds", "Life Processes", "Control and Coordination", "Electricity", "Light", "Our Environment"]),
  },
};

export function getClassNumber(grade: string) {
  const match = grade.match(/\d+/);
  const classNumber = match ? Number(match[0]) : 1;
  return Number.isFinite(classNumber) ? Math.min(Math.max(classNumber, 1), 10) : 1;
}

export function getDefaultVisualSubjectsForGrade(grade: string) {
  const classNumber = getClassNumber(grade);
  if (classNumber <= 2) return lowerSubjects;
  if (classNumber <= 5) return middlePrimarySubjects;
  if (classNumber <= 8) return upperSubjects;
  return highSubjects;
}

export function getChaptersForGradeSubject(grade: string, subject: string): LearningChapter[] {
  const classNumber = getClassNumber(grade);
  const normalizedSubject = normalizeSubject(subject);
  const gradeCatalog = catalog[classNumber] ?? {};
  const direct = gradeCatalog[normalizedSubject];
  if (direct?.length) return direct;

  if (isLanguageSubject(normalizedSubject)) return languageChapters;
  if (normalizedSubject.includes("Computer")) return computerPrimaryChapters;
  return fallbackChapters;
}

export function getChapterByNumber(grade: string, subject: string, chapterNumber: number) {
  const chapters = getChaptersForGradeSubject(grade, subject);
  return chapters.find((chapter) => chapter.number === chapterNumber) ?? chapters[0];
}

export function normalizeSubject(subject: string) {
  const cleaned = subject.trim();
  const lower = cleaned.toLowerCase();
  if (["math", "maths", "mathematics"].includes(lower)) return "Maths";
  if (["evs", "environmental studies"].includes(lower)) return "EVS";
  if (["social", "social studies", "social science"].includes(lower)) return "Social Science";
  if (["computer", "computers", "computer / ai", "ct / ai", "ai"].includes(lower)) return "Computer / AI";
  return cleaned;
}

function namedChapters(names: string[]): LearningChapter[] {
  return names.map((name, index) => ({
    number: index + 1,
    name,
    concepts: conceptsForChapter(name),
  }));
}

function conceptsForChapter(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("matter in our surroundings")) {
    return [
      "Meaning of matter",
      "Matter is made of particles",
      "Particles have space between them",
      "Particles are continuously moving",
      "Particles attract each other",
      "States of matter",
      "Change of state",
      "Melting, boiling, evaporation",
      "Latent heat",
      "Sublimation",
      "Factors affecting evaporation",
    ];
  }
  if (lower.includes("number systems")) {
    return [
      "Natural numbers",
      "Whole numbers",
      "Integers",
      "Rational numbers",
      "Irrational numbers",
      "Real numbers",
      "Number line representation",
      "Decimal expansion",
      "Laws of exponents",
    ];
  }
  if (lower.includes("fraction")) return ["Part of a whole", "Equivalent fractions", "Simplification", "Word problems"];
  if (lower.includes("motion")) return ["Rest and motion", "Distance and displacement", "Speed", "Velocity", "Acceleration"];
  if (lower.includes("chemical reaction")) return ["Reactants and products", "Balanced equations", "Types of reactions", "Daily-life examples"];
  if (lower.includes("number")) return ["Place value", "Comparing numbers", "Number patterns", "Application problems"];
  if (lower.includes("plant")) return ["Parts", "Needs", "Uses", "Life cycle"];
  if (lower.includes("animal")) return ["Animal homes", "Food habits", "Movement", "Adaptations"];
  if (lower.includes("algebra")) return ["Variables", "Expressions", "Like terms", "Simple equations"];
  if (lower.includes("geometry")) return ["Points and lines", "Shapes", "Angles", "Drawing practice"];
  if (lower.includes("data")) return ["Collecting data", "Tables", "Bar graphs", "Interpretation"];
  if (lower.includes("light")) return ["Reflection", "Refraction", "Mirrors", "Ray diagrams"];
  return ["Introduction", "Key terms", "Real-life example", "Worked example", "Common mistakes"];
}

function isLanguageSubject(subject: string) {
  return ["English", "Hindi", "Kannada", "Telugu", "Tamil", "Malayalam", "Sanskrit", "Urdu"].includes(subject);
}
