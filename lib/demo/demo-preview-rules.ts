export type DemoPreviewMode = "chapter_25_percent" | "topic_50_percent" | "full_access";

export type DemoPreviewRules = {
  previewMode: DemoPreviewMode;
  previewLabel: string;
  previewPercent: number;
  maxSlides: number;
  maxPracticeQuestions: number;
  showQuiz: boolean | "locked";
  showChapterExam: boolean;
};

export function getDemoPreviewRules(input: { hasTopic: boolean; isRegistered?: boolean }): DemoPreviewRules {
  if (input.isRegistered) {
    return {
      previewMode: "full_access",
      previewLabel: "Full lesson access",
      previewPercent: 100,
      maxSlides: 99,
      maxPracticeQuestions: 99,
      showQuiz: true,
      showChapterExam: true,
    };
  }

  if (input.hasTopic) {
    return {
      previewMode: "topic_50_percent",
      previewLabel: "50% topic preview",
      previewPercent: 50,
      maxSlides: 5,
      maxPracticeQuestions: 1,
      showQuiz: "locked",
      showChapterExam: false,
    };
  }

  return {
    previewMode: "chapter_25_percent",
    previewLabel: "25% chapter preview",
    previewPercent: 25,
    maxSlides: 3,
    maxPracticeQuestions: 2,
    showQuiz: false,
    showChapterExam: false,
  };
}
