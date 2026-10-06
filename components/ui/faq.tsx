import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./faq.module.css";

export type FaqItem = { question: string; answer: React.ReactNode };

export function Faq({
  items,
  className,
}: {
  items: FaqItem[];
  className?: string;
}) {
  return (
    <div className={cn(styles.list, className)}>
      {items.map(({ question, answer }) => (
        <details key={question} className={styles.item}>
          <summary>
            <span>{question}</span>
            <Plus size={17} aria-hidden="true" />
          </summary>
          <div className={styles.answer}>{answer}</div>
        </details>
      ))}
    </div>
  );
}
