import type { LucideIcon } from "lucide-react";

export type ChildId = "jayadeep" | "harini";

export type ChildProfile = {
  id: ChildId;
  name: string;
  role: string;
  grade: string;
  level: number;
  avatar: string;
  languages: string[];
  focus: string;
  color: string;
};

export type Subject = {
  slug: string;
  name: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
  description: string;
  childIds: ChildId[];
  chapters: string[];
};

export type MaterialType =
  | "Textbook"
  | "Academic Diary"
  | "Homework"
  | "Worksheet"
  | "Question Paper"
  | "Notes"
  | "School Diary"
  | "School PPT"
  | "Activities"
  | "Activity File"
  | "Images"
  | "Assessment File"
  | "Project Work"
  | "Exam Schedule"
  | "Other";

export type UploadRecord = {
  id: string;
  fileName: string;
  childId: ChildId;
  grade: string;
  subject: string;
  materialType: MaterialType;
  chapter: string;
  notes: string;
  status: "Uploaded" | "Ready for AI indexing" | "Indexed" | "Needs Review";
  source?: "Local Upload" | "Google Drive Import" | "Local Textbook Folder" | "NCERT Official Download";
  driveFileId?: string;
  driveWebViewLink?: string;
  localFolderKey?: string;
  languageRole?: "R1" | "R2" | "R3";
  originalSourceUrl?: string;
  bookTitle?: string;
  chapterNumber?: number;
  mimeType?: string;
  indexStatus?: "Uploaded" | "Parsing" | "OCR Pending" | "OCR Complete" | "Indexed" | "Failed";
  indexError?: string;
  sizeLabel: string;
  uploadedAt: string;
  storagePath?: string;
};

export type ContentChunk = {
  id: string;
  fileId: string;
  fileName: string;
  childId: ChildId;
  grade: string;
  subject: string;
  materialType: MaterialType;
  chapter: string;
  source?: UploadRecord["source"];
  originalSourceUrl?: string;
  bookTitle?: string;
  chunkIndex: number;
  text: string;
  keywords: string[];
};

export type ProgressRecord = {
  childId: ChildId;
  lessonsCompleted: string[];
  topicsRevised: string[];
  quizzesAttempted: number;
  quizScoreHistory: { subject: string; score: number; total: number; date: string; weakConcepts: string[] }[];
  weakConcepts: string[];
  starsEarned: number;
  streakCount: number;
  lastActiveDate: string;
};

export type VisualType =
  | "two-column-card"
  | "formula-card"
  | "comparison-table"
  | "number-line"
  | "quiz-card"
  | "example-card"
  | "mistake-card"
  | "summary-card";

export type VisualLessonSlide = {
  slideType: string;
  title: string;
  teacherScript: string;
  visualType: VisualType;
  visualData: Record<string, unknown>;
  keyPoints: string[];
  studentQuestion?: string;
  answer?: string;
};

export type VisualSceneType =
  | "fraction-circle"
  | "fraction-bar"
  | "number-line"
  | "comparison-board"
  | "formula-board"
  | "table-board"
  | "particle-motion-board"
  | "states-of-matter-board"
  | "heating-curve-board"
  | "evaporation-board"
  | "force-arrows"
  | "motion-track"
  | "diagram-label"
  | "quiz-visual";

export type VisualLessonStep = {
  action: string;
  narration: string;
  visual: Record<string, unknown>;
};

export type VisualLessonStudentQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
};

export type VisualLessonScene = {
  sceneType: VisualSceneType;
  title: string;
  teacherScript: string;
  steps: VisualLessonStep[];
  studentQuestion?: VisualLessonStudentQuestion;
};

export type VisualLessonChapterConcept = {
  conceptNo: number;
  conceptTitle: string;
  scenes: VisualLessonScene[];
};

export type VisualLesson = {
  title: string;
  lessonTitle?: string;
  gradeLevel: string;
  lessonScope?: "topic" | "chapter" | string;
  chapterTitle?: string;
  chapterConcepts?: VisualLessonChapterConcept[];
  mode?: "animated-visual-teacher" | string;
  scenes?: VisualLessonScene[];
  slides: VisualLessonSlide[];
  simpleExplanation?: string;
  visualSteps?: { title: string; icon: string; description: string }[];
  realLifeExample?: string;
  vocabulary?: { word: string; meaning: string }[];
  memoryTrick?: string;
  quiz?: { question: string; options: string[]; answer: string; explanation?: string }[];
};

export type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

export type QuizResult = {
  title: string;
  questions: QuizQuestion[];
};
