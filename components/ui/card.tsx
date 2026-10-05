import { cn } from "@/lib/utils";
export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-2xl border border-border bg-card text-card-foreground shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
export function CardContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("p-6", className)} {...props} />;
}
