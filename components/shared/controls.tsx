import type { ChildId } from "@/lib/types";
import { children, getChild, getSubjectsForChild, materialTypes } from "@/lib/mock-data";
import { getSubjectsForGrade } from "@/lib/grade-catalog";

export function ChildSelect({
  value,
  onChange,
  className = "",
}: {
  value: ChildId;
  onChange: (value: ChildId) => void;
  className?: string;
}) {
  return (
    <select className={`rounded-xl border border-purple-100 bg-white px-4 py-3 font-bold shadow-sm ${className}`} value={value} onChange={(event) => onChange(event.target.value as ChildId)}>
      {children.map((child) => (
        <option key={child.id} value={child.id}>
          {child.name} - {child.grade}
        </option>
      ))}
    </select>
  );
}

export function SubjectSelect({
  childId,
  value,
  onChange,
  className = "",
}: {
  childId: ChildId;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const catalogSubjects = getSubjectsForGrade(getChild(childId).grade);
  const subjectNames = Array.from(new Set([...getSubjectsForChild(childId).map((subject) => subject.name), ...catalogSubjects]));
  return (
    <select className={`rounded-xl border border-purple-100 bg-white px-4 py-3 font-bold shadow-sm ${className}`} value={value} onChange={(event) => onChange(event.target.value)}>
      {subjectNames.map((subject) => (
        <option key={subject} value={subject}>
          {subject}
        </option>
      ))}
    </select>
  );
}

export function MaterialTypeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select className="rounded-xl border border-purple-100 bg-white px-4 py-3 font-bold shadow-sm" value={value} onChange={(event) => onChange(event.target.value)}>
      {materialTypes.map((type) => (
        <option key={type} value={type}>
          {type}
        </option>
      ))}
    </select>
  );
}

export function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}
