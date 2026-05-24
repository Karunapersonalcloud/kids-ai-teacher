import type { ChildId, MaterialType } from "./types";

export type RequiredNcertBook = {
  id: string;
  childId: ChildId;
  grade: string;
  classNumber: number;
  subject: string;
  bookTitle: string;
  targetFolder: string;
  languageRole?: "R1" | "R2" | "R3";
  enabled: boolean;
  source: "NCERT";
  materialType: MaterialType;
  ncertBookCode: string;
  chapterStart: number;
  chapterEnd: number;
};

export const requiredNcertBooks: RequiredNcertBook[] = [
  {
    id: "class9-english-kaveri",
    childId: "jayadeep",
    grade: "Class 9",
    classNumber: 9,
    subject: "English",
    bookTitle: "Kaveri",
    targetFolder: "English",
    languageRole: "R1",
    enabled: true,
    source: "NCERT",
    materialType: "Textbook",
    ncertBookCode: "iebe1",
    chapterStart: 1,
    chapterEnd: 8,
  },
  {
    id: "class9-mathematics-ganita-manjari",
    childId: "jayadeep",
    grade: "Class 9",
    classNumber: 9,
    subject: "Mathematics",
    bookTitle: "Ganita Manjari",
    targetFolder: "Mathematics",
    enabled: true,
    source: "NCERT",
    materialType: "Textbook",
    ncertBookCode: "iemh1",
    chapterStart: 1,
    chapterEnd: 8,
  },
  {
    id: "class9-science-exploration",
    childId: "jayadeep",
    grade: "Class 9",
    classNumber: 9,
    subject: "Science",
    bookTitle: "Exploration",
    targetFolder: "Science",
    enabled: true,
    source: "NCERT",
    materialType: "Textbook",
    ncertBookCode: "iesc1",
    chapterStart: 1,
    chapterEnd: 13,
  },
  {
    id: "class9-hindi-ganga",
    childId: "jayadeep",
    grade: "Class 9",
    classNumber: 9,
    subject: "Hindi",
    bookTitle: "Ganga",
    targetFolder: "Hindi",
    languageRole: "R2",
    enabled: true,
    source: "NCERT",
    materialType: "Textbook",
    ncertBookCode: "ihga1",
    chapterStart: 1,
    chapterEnd: 12,
  },
];

export function getRequiredNcertBook(bookId: string) {
  return requiredNcertBooks.find((book) => book.id === bookId);
}
