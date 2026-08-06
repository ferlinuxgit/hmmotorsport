import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  children,
  align = "left"
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
      <h2 className="mt-4 text-4xl font-semibold uppercase leading-[0.95] tracking-[-0.035em] text-balance sm:text-5xl lg:text-6xl">
        {title}
      </h2>
      {children ? <div className="mt-5 max-w-[62ch] text-base leading-7 text-muted-foreground sm:text-lg">{children}</div> : null}
    </div>
  );
}
