import Image from "next/image";

type BrandLogoProps = {
  variant?: "icon" | "wide" | "compact";
  showText?: boolean;
  className?: string;
};

export function BrandLogo({ variant = "compact", showText = true, className = "" }: BrandLogoProps) {
  if (variant === "wide") {
    return (
      <span className={`inline-flex items-center ${className}`}>
        <Image src="/brand/conceptkid-logo-wide.png" alt="ConceptKid Kids AI Teacher" width={260} height={75} priority className="h-auto w-[210px] md:w-[240px]" />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Image src="/brand/conceptkid-logo.png" alt="ConceptKid logo" width={44} height={44} priority className="h-11 w-11 rounded-2xl" />
      {showText && (
        <span className="leading-tight">
          <span className="block text-xl font-black text-slate-950">ConceptKid</span>
          {variant !== "icon" && <span className="block text-xs font-bold text-slate-500">Kids AI Teacher</span>}
        </span>
      )}
    </span>
  );
}
