import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <div className="shell py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="text-4xl font-medium mt-4">This chapter is missing.</h1>
      <p className="text-muted-foreground my-6">
        The page may have moved or is no longer available.
      </p>
      <Button asChild>
        <Link href="/">Back to Baela</Link>
      </Button>
    </div>
  );
}
