import { cn } from "@/lib/utils";

export function LearningProgress({
  value,
  label = "Your progress",
  className,
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  const percentage = Number.isFinite(value)
    ? Math.min(100, Math.max(0, Math.round(value)))
    : 0;
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between gap-3 text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="text-primary">{percentage}%</span>
      </div>
      <progress
        aria-label={label}
        className="block h-1.5 w-full"
        value={percentage}
        max={100}
      />
    </div>
  );
}
