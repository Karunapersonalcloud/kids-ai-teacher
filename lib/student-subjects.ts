import { getSubjectsForStudent } from "./grade-catalog";

export type SubjectType = "Language" | "Core Subject" | "Skill Subject" | "Arts" | "Physical Education" | "Other";
export type LanguageRole = "R1" | "R2" | "R3" | "Not Applicable";
export type PublisherSource = "NCERT" | "CBSE" | "State Board" | "School Provided" | "Private Publisher" | "Other";
export type SubjectMedium = "English" | "Hindi" | "Regional Language" | "Other";
export type SourceStatus = "pending" | "matched" | "downloaded" | "imported" | "indexed" | "needsUpload" | "unavailable";

export type SubmittedSubject = {
  id?: string;
  subjectName: string;
  subjectType: SubjectType;
  languageRole: LanguageRole;
  language: string;
  publisher: PublisherSource;
  bookTitle: string;
  medium: SubjectMedium;
  autoDownloadAllowed: boolean;
  sourceStatus: SourceStatus;
};

export const subjectNameOptions = [
  "English",
  "Hindi",
  "Kannada",
  "Telugu",
  "Tamil",
  "Malayalam",
  "Mathematics",
  "Science",
  "Social Science",
  "EVS",
  "Computer",
  "CT / AI",
  "Skill Education",
  "Arts",
  "Physical Education and Well-being",
  "Reading",
  "Writing",
  "Environmental Studies",
  "Sanskrit",
  "Urdu",
  "Other",
];

export const subjectTypeOptions: SubjectType[] = ["Language", "Core Subject", "Skill Subject", "Arts", "Physical Education", "Other"];
export const languageRoleOptions: LanguageRole[] = ["R1", "R2", "R3", "Not Applicable"];
export const publisherOptions: PublisherSource[] = ["NCERT", "CBSE", "State Board", "School Provided", "Private Publisher", "Other"];
export const mediumOptions: SubjectMedium[] = ["English", "Hindi", "Regional Language", "Other"];

export const ncertBookTitleSuggestions = [
  "Kaveri",
  "Ganita Manjari",
  "Exploration",
  "Ganga",
  "Rimjhim",
  "Marigold",
  "Math-Magic",
  "Looking Around",
];

export function createSubjectDraft(overrides: Partial<SubmittedSubject> = {}): SubmittedSubject {
  const publisher = overrides.publisher || "School Provided";
  return {
    subjectName: overrides.subjectName || "",
    subjectType: overrides.subjectType || "Core Subject",
    languageRole: overrides.languageRole || "Not Applicable",
    language: overrides.language || "",
    publisher,
    bookTitle: overrides.bookTitle || "",
    medium: overrides.medium || "English",
    autoDownloadAllowed: overrides.autoDownloadAllowed ?? publisher === "NCERT",
    sourceStatus: overrides.sourceStatus || (publisher === "NCERT" ? "pending" : "needsUpload"),
  };
}

export function getSuggestedSubmittedSubjects(input: { grade: string; r1Language?: string; r2Language?: string; r3Language?: string }) {
  return getSubjectsForStudent(input.grade, input).map((subject) => {
    const match = subject.match(/^(R[123])\s+(.+)$/);
    if (match) {
      return createSubjectDraft({
        subjectName: match[2],
        subjectType: "Language",
        languageRole: match[1] as LanguageRole,
        language: match[2],
        publisher: "School Provided",
        medium: match[2] === "Hindi" ? "Hindi" : match[2] === "English" ? "English" : "Regional Language",
      });
    }

    return createSubjectDraft({
      subjectName: subject,
      subjectType: typeForSubject(subject),
      publisher: ["Mathematics", "Science", "English", "Hindi"].includes(subject) ? "NCERT" : "School Provided",
      medium: "English",
    });
  });
}

export function normalizeSubmittedSubjects(value: unknown): SubmittedSubject[] {
  const parsed = typeof value === "string" ? safeParse(value) : value;
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => (typeof item === "object" && item ? createSubjectDraft(item as Partial<SubmittedSubject>) : undefined))
    .filter((item): item is SubmittedSubject => Boolean(item?.subjectName));
}

export function subjectStatusForPublisher(publisher: string, autoDownloadAllowed: boolean): SourceStatus {
  if (publisher !== "NCERT") return "needsUpload";
  return autoDownloadAllowed ? "pending" : "needsUpload";
}

function typeForSubject(subject: string): SubjectType {
  if (["English", "Hindi", "Kannada", "Telugu", "Tamil", "Malayalam", "Sanskrit", "Urdu"].includes(subject)) return "Language";
  if (subject === "Skill Education" || subject === "CT / AI") return "Skill Subject";
  if (subject === "Arts") return "Arts";
  if (subject === "Physical Education and Well-being") return "Physical Education";
  return "Core Subject";
}

function safeParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}
