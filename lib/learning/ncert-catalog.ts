import { getChaptersForGradeSubject, getClassNumber, normalizeSubject, type LearningChapter } from "./chapter-catalog";

const ncertSubjects = new Set(["Maths", "Science", "EVS", "Social Science", "English", "Hindi"]);

export type NcertBookCandidate = {
  classNumber: number;
  subject: string;
  language?: string;
  status: "official_source_available" | "catalog_only" | "not_available";
  note: string;
};

export function getNcertChapters(grade: string, subject: string): LearningChapter[] {
  const normalizedSubject = normalizeSubject(subject);
  if (!ncertSubjects.has(normalizedSubject)) return [];
  return getChaptersForGradeSubject(grade, normalizedSubject);
}

export function getNcertBookCandidates({
  grade,
  subject,
  language,
}: {
  grade: string;
  subject: string;
  language?: string;
}): NcertBookCandidate[] {
  const normalizedSubject = normalizeSubject(subject);
  const classNumber = getClassNumber(grade);
  if (!ncertSubjects.has(normalizedSubject)) {
    return [
      {
        classNumber,
        subject: normalizedSubject,
        language,
        status: "not_available",
        note: "No NCERT catalog match is configured for this subject yet.",
      },
    ];
  }

  return [
    {
      classNumber,
      subject: normalizedSubject,
      language,
      status: "catalog_only",
      note: "NCERT chapter structure is available. Official download/import can be attempted separately where configured.",
    },
  ];
}
