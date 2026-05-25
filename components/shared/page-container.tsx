export function PageContainer({
  children,
  variant = "app",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "app" | "public";
  className?: string;
}) {
  const base =
    variant === "public"
      ? "w-full max-w-[1600px] px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-20"
      : "w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12";

  return <div className={`${base} ${className}`}>{children}</div>;
}
