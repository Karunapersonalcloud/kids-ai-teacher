export type BoardType = "CBSE" | "State" | "ICSE" | "Other";

export const gradeOptions = Array.from({ length: 12 }, (_, index) => `Class ${index + 1}`);

export const gradeSubjectCatalog: Record<string, string[]> = {
  "Class 1": ["English", "Maths", "EVS", "Reading", "Writing", "Hindi", "Kannada"],
  "Class 2": ["English", "Maths", "EVS", "Reading", "Writing", "Hindi", "Kannada"],
  "Class 3": ["English", "Maths", "EVS", "Hindi", "Kannada", "Computer", "Art"],
  "Class 4": ["English", "Maths", "EVS", "Hindi", "Kannada", "Computer", "Art"],
  "Class 5": ["English", "Maths", "EVS", "Hindi", "Kannada", "Computer", "Art"],
  "Class 6": ["English", "Maths", "Science", "Social Science", "Hindi", "Third Language", "Computer", "Art", "Physical Education"],
  "Class 7": ["English", "Maths", "Science", "Social Science", "Hindi", "Third Language", "Computer", "Art", "Physical Education"],
  "Class 8": ["English", "Maths", "Science", "Social Science", "Hindi", "Third Language", "Computer", "Art", "Physical Education"],
  "Class 9": ["English", "Hindi", "Kannada", "Mathematics", "Science", "Social Science", "CT / AI", "Skill Education", "Arts", "Physical Education and Well-being"],
  "Class 10": ["English", "Hindi", "Kannada", "Mathematics", "Science", "Social Science", "CT / AI", "Skill Education", "Arts", "Physical Education and Well-being"],
  "Class 11": ["Science", "Commerce", "Humanities"],
  "Class 12": ["Science", "Commerce", "Humanities"],
};

export function getSubjectsForGrade(grade: string) {
  return gradeSubjectCatalog[grade] || [];
}

export function getClassNumberFromGrade(grade: string) {
  const match = grade.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export function getSubjectsForStudent(grade: string, languages?: { r1Language?: string; r2Language?: string; r3Language?: string }) {
  const classNumber = getClassNumberFromGrade(grade);
  const languageSubjects = [
    languages?.r1Language ? `R1 ${languages.r1Language}` : "",
    languages?.r2Language ? `R2 ${languages.r2Language}` : "",
    languages?.r3Language ? `R3 ${languages.r3Language}` : "",
  ].filter(Boolean);

  if (classNumber >= 9 && classNumber <= 10) {
    return [
      ...languageSubjects,
      "Mathematics",
      "Science",
      "Social Science",
      "CT / AI",
      "Skill Education",
      "Arts",
      "Physical Education and Well-being",
    ];
  }

  if (classNumber >= 6 && classNumber <= 8) {
    return [...languageSubjects, "Maths", "Science", "Social Science", "Computer", "Art", "Physical Education"];
  }

  if (classNumber >= 1 && classNumber <= 5) {
    return [
      languages?.r1Language || "English",
      languages?.r2Language || "School Language 2",
      "Maths",
      classNumber <= 2 ? "EVS" : "EVS",
      "Reading",
      "Writing",
    ].filter(Boolean);
  }

  return getSubjectsForGrade(grade);
}
