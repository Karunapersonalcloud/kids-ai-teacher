export type PlanName = "demo" | "trial" | "basic" | "premium" | "family";

export type BillingPlan = {
  planName: PlanName;
  label: string;
  priceMonthly: number;
  priceYearly: number;
  aiLimitDaily: number;
  uploadLimitMonthly: number;
  ocrLimitMonthly: number;
  visualLessonLimitDaily: number;
  quizGenerationLimitDaily: number;
  maxChildren: number;
  status: "available" | "coming-soon";
};

export const billingPlans: BillingPlan[] = [
  { planName: "demo", label: "Demo", priceMonthly: 0, priceYearly: 0, aiLimitDaily: 3, uploadLimitMonthly: 0, ocrLimitMonthly: 0, visualLessonLimitDaily: 2, quizGenerationLimitDaily: 1, maxChildren: 1, status: "available" },
  { planName: "trial", label: "Trial", priceMonthly: 0, priceYearly: 0, aiLimitDaily: 20, uploadLimitMonthly: 10, ocrLimitMonthly: 5, visualLessonLimitDaily: 5, quizGenerationLimitDaily: 5, maxChildren: 2, status: "available" },
  { planName: "basic", label: "Basic", priceMonthly: 499, priceYearly: 4999, aiLimitDaily: 100, uploadLimitMonthly: 50, ocrLimitMonthly: 20, visualLessonLimitDaily: 20, quizGenerationLimitDaily: 20, maxChildren: 2, status: "coming-soon" },
  { planName: "premium", label: "Premium", priceMonthly: 999, priceYearly: 9999, aiLimitDaily: 300, uploadLimitMonthly: 200, ocrLimitMonthly: 80, visualLessonLimitDaily: 60, quizGenerationLimitDaily: 60, maxChildren: 4, status: "coming-soon" },
  { planName: "family", label: "Family", priceMonthly: 1499, priceYearly: 14999, aiLimitDaily: 500, uploadLimitMonthly: 500, ocrLimitMonthly: 150, visualLessonLimitDaily: 100, quizGenerationLimitDaily: 100, maxChildren: 6, status: "coming-soon" },
];

export function getPlan(planName: PlanName) {
  return billingPlans.find((plan) => plan.planName === planName) || billingPlans[0];
}
