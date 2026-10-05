import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
  className,
  id,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <div
      className={cn(
        "mb-10",
        centered && "mx-auto max-w-xl text-center",
        className,
      )}
    >
      <p className="eyebrow">{eyebrow}</p>
      <h2
        id={id}
        className="mt-3 text-3xl font-medium tracking-[-.045em] sm:text-4xl"
      >
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}
