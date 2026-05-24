export type CbseLanguageType = "Indian" | "Foreign" | "Classical" | "Other";
export type CbseLanguageRole = "R1" | "R2" | "R3";
export type TextbookAvailability = "NCERT" | "CBSE syllabus only" | "School provided" | "Unknown";

export type CbseLanguage = {
  code: string;
  name: string;
  type: CbseLanguageType;
  cbseSubjectLabel: string;
  possibleRoles: CbseLanguageRole[];
  aliases: string[];
  textbookAvailability: TextbookAvailability;
};

const allRoles: CbseLanguageRole[] = ["R1", "R2", "R3"];

export const cbseLanguages: CbseLanguage[] = [
  language("english", "English", "Indian", "English", ["English Language"], "NCERT"),
  language("hindi", "Hindi", "Indian", "Hindi", ["हिन्दी"], "NCERT"),
  language("sanskrit", "Sanskrit", "Classical", "Sanskrit", ["संस्कृत"], "NCERT"),
  language("urdu", "Urdu", "Indian", "Urdu", ["اردو"], "NCERT"),
  language("kannada", "Kannada", "Indian", "Kannada", ["ಕನ್ನಡ"], "School provided"),
  language("telugu", "Telugu", "Indian", "Telugu", ["తెలుగు"], "CBSE syllabus only"),
  language("tamil", "Tamil", "Indian", "Tamil", ["தமிழ்"], "CBSE syllabus only"),
  language("malayalam", "Malayalam", "Indian", "Malayalam", ["മലയാളം"], "CBSE syllabus only"),
  language("marathi", "Marathi", "Indian", "Marathi", ["मराठी"], "CBSE syllabus only"),
  language("gujarati", "Gujarati", "Indian", "Gujarati", ["ગુજરાતી"], "CBSE syllabus only"),
  language("bengali", "Bengali", "Indian", "Bengali", ["Bangla", "বাংলা"], "CBSE syllabus only"),
  language("odia", "Odia", "Indian", "Odia", ["Oriya", "ଓଡ଼ିଆ"], "CBSE syllabus only"),
  language("punjabi", "Punjabi", "Indian", "Punjabi", ["ਪੰਜਾਬੀ"], "CBSE syllabus only"),
  language("assamese", "Assamese", "Indian", "Assamese", ["অসমীয়া"], "CBSE syllabus only"),
  language("manipuri", "Manipuri", "Indian", "Manipuri", ["Meitei", "Meiteilon"], "CBSE syllabus only"),
  language("nepali", "Nepali", "Indian", "Nepali", ["नेपाली"], "CBSE syllabus only"),
  language("bodo", "Bodo", "Indian", "Bodo", ["Boro"], "CBSE syllabus only"),
  language("dogri", "Dogri", "Indian", "Dogri", [], "CBSE syllabus only"),
  language("kashmiri", "Kashmiri", "Indian", "Kashmiri", ["Koshur"], "CBSE syllabus only"),
  language("maithili", "Maithili", "Indian", "Maithili", [], "CBSE syllabus only"),
  language("santali", "Santali", "Indian", "Santali", ["Santhali"], "CBSE syllabus only"),
  language("sindhi", "Sindhi", "Indian", "Sindhi", [], "CBSE syllabus only"),
  language("konkani", "Konkani", "Indian", "Konkani", [], "CBSE syllabus only"),
  language("tulu", "Tulu", "Indian", "Tulu", [], "School provided"),
  language("bhojpuri", "Bhojpuri", "Indian", "Bhojpuri", [], "School provided"),
  language("french", "French", "Foreign", "French", ["Français"], "CBSE syllabus only"),
  language("german", "German", "Foreign", "German", ["Deutsch"], "CBSE syllabus only"),
  language("spanish", "Spanish", "Foreign", "Spanish", ["Español"], "CBSE syllabus only"),
  language("japanese", "Japanese", "Foreign", "Japanese", ["日本語"], "CBSE syllabus only"),
  language("arabic", "Arabic", "Foreign", "Arabic", ["العربية"], "CBSE syllabus only"),
  language("persian", "Persian", "Foreign", "Persian", ["Farsi"], "CBSE syllabus only"),
  language("tibetan", "Tibetan", "Foreign", "Tibetan", [], "CBSE syllabus only"),
  language("other", "Other", "Other", "Other school-approved language", [], "Unknown"),
];

export const cbseLanguageNames = cbseLanguages.map((item) => item.name);

export type CbseLanguageValidation = {
  status: "Valid" | "Needs school confirmation" | "Invalid combination";
  message: string;
};

export function getLanguageByName(name: string) {
  const normalized = normalize(name);
  return cbseLanguages.find((item) => normalize(item.name) === normalized || item.aliases.some((alias) => normalize(alias) === normalized));
}

export function validateCbseLanguageSelection(input: {
  board: string;
  grade: string;
  r1Language?: string;
  r2Language?: string;
  r3Language?: string;
}): CbseLanguageValidation {
  const classNumber = Number(input.grade.match(/\d+/)?.[0] || 0);
  const selected = [input.r1Language, input.r2Language, input.r3Language].filter(Boolean) as string[];
  const board = input.board.toLowerCase();

  if (board !== "cbse") {
    return {
      status: "Needs school confirmation",
      message: "Please confirm language subjects with your school.",
    };
  }

  if (classNumber < 9 || classNumber > 10) {
    return {
      status: "Needs school confirmation",
      message: "Please confirm language subjects with your school.",
    };
  }

  if (selected.length < 3) {
    return {
      status: "Invalid combination",
      message: "CBSE Class IX/X language setup needs R1, R2, and R3 to be selected.",
    };
  }

  const indianCount = selected.filter((item) => {
    const language = getLanguageByName(item);
    return language?.type === "Indian" || language?.type === "Classical";
  }).length;

  const r3 = getLanguageByName(input.r3Language || "");
  const r1 = getLanguageByName(input.r1Language || "");
  const r2 = getLanguageByName(input.r2Language || "");

  if (indianCount < 2) {
    return {
      status: "Needs school confirmation",
      message: "CBSE requires at least two Indian languages. Please confirm your school-approved combination.",
    };
  }

  if (r3?.type === "Foreign" && (r1?.type === "Foreign" || r2?.type === "Foreign")) {
    return {
      status: "Needs school confirmation",
      message: "Foreign language as R3 generally requires R1 and R2 to be Indian languages. Please confirm your school-approved combination.",
    };
  }

  return {
    status: "Valid",
    message: "Selected combination appears aligned with the CBSE language rule. Please still confirm with your school.",
  };
}

export function buildSelectedLanguageMetadata(input: {
  r1Language?: string;
  r2Language?: string;
  r3Language?: string;
}) {
  return [
    { role: "R1", language: input.r1Language || "", subjectLabel: subjectLabelFor("R1", input.r1Language) },
    { role: "R2", language: input.r2Language || "", subjectLabel: subjectLabelFor("R2", input.r2Language) },
    { role: "R3", language: input.r3Language || "", subjectLabel: subjectLabelFor("R3", input.r3Language) },
  ];
}

export function subjectLabelFor(role: CbseLanguageRole, languageName?: string) {
  return languageName ? `${role} ${languageName}` : role;
}

function language(
  code: string,
  name: string,
  type: CbseLanguageType,
  cbseSubjectLabel: string,
  aliases: string[],
  textbookAvailability: TextbookAvailability
): CbseLanguage {
  return {
    code,
    name,
    type,
    cbseSubjectLabel,
    possibleRoles: allRoles,
    aliases,
    textbookAvailability,
  };
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}
