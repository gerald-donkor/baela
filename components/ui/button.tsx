import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
export const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-control text-sm font-medium transition-[background-color,border-color,box-shadow] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary",
  {
    variants: {
      variant: {
        default:
          "border border-primary/50 bg-linear-to-b from-primary/80 to-primary text-primary-foreground shadow-[0_2px_12px_#658ce820,inset_0_1px_0_#ffffff45] hover:not-disabled:shadow-[0_2px_22px_#658ce840]",
        secondary:
          "bg-secondary text-secondary-foreground hover:not-disabled:bg-secondary/80",
        outline:
          "border border-border bg-card/40 hover:not-disabled:border-primary/40 hover:not-disabled:bg-secondary",
        ghost: "hover:not-disabled:bg-secondary",
        destructive: "bg-destructive text-white hover:not-disabled:bg-destructive/90",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4",
        lg: "h-12 px-6 text-sm",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
