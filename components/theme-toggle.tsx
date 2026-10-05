"use client";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "./ui/button";
export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle light and dark appearance"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="size-4 hidden dark:block" />
      <Moon className="size-4 dark:hidden" />
    </Button>
  );
}
