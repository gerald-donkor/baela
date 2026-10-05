import { cn } from "@/lib/utils";

export function Brand({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 text-2xl font-semibold tracking-[-.055em]",
        className,
      )}
    >
      <svg
        width="25"
        height="29"
        viewBox="0 0 25 29"
        fill="none"
        aria-hidden="true"
        className="text-primary"
      >
        <path
          d="M12.5 0L16.1 10.9L25 14.5L16.1 18.1L12.5 29L8.9 18.1L0 14.5L8.9 10.9L12.5 0Z"
          fill="currentColor"
        />
        <path
          d="M12.5 6L14.6 12.4L20 14.5L14.6 16.6L12.5 23L10.4 16.6L5 14.5L10.4 12.4L12.5 6Z"
          fill="currentColor"
          opacity=".5"
        />
      </svg>
      baela<span className="sr-only"> home</span>
    </span>
  );
}
