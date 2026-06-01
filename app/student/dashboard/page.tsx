import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function StudentDashboardPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get("kids_access_role")?.value;
  if (role !== "student") {
    redirect("/login");
  }

  const studentName = decodeURIComponent(cookieStore.get("kids_student_name")?.value || "Student");
  const studentGrade = decodeURIComponent(cookieStore.get("kids_student_grade")?.value || "");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 p-6">
      <h1 className="text-3xl font-black text-purple-800">Student Learning Dashboard</h1>
      <p className="text-sm font-semibold text-slate-600">Welcome {studentName}{studentGrade ? ` (${studentGrade})` : ""}.</p>
      <div className="rounded-2xl bg-purple-50 p-4 text-sm font-semibold text-purple-800">
        You are signed in as a student. Parent and admin sections are restricted.
      </div>
    </main>
  );
}
