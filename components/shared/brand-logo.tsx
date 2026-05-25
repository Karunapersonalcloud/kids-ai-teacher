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
        <Image src="/brand/conceptkid-logo-wide-v3.png" alt="ConceptKid Kids AI Teacher" width={820} height={230} priority className="h-14 w-auto object-contain md:h-16" />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Image
        src="/brand/conceptkid-logo-v3.png"
        alt="ConceptKid logo"
        width={44}
        height={44}
        priority
        className={`${variant === "icon" ? "h-9 w-9" : "h-11 w-11"} shrink-0 object-contain`}
      />
      {variant !== "icon" && showText && (
        <span className="leading-tight">
          <span className="block text-xl font-black text-slate-950">ConceptKid</span>
          <span className="block text-xs font-bold text-slate-500">Kids AI Teacher</span>
        </span>
      )}
    </span>
  );
}
