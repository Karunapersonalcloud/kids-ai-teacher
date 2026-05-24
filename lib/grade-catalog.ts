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
