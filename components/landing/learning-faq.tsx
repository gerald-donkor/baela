import Link from "next/link";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Faq, type FaqItem } from "@/components/ui/faq";
import styles from "./learning-faq.module.css";

const questions: FaqItem[] = [
  {
    question: "Can I learn around a full-time job?",
    answer:
      "Absolutely. Lessons are available on your schedule. Pause whenever you need to, revisit an explanation, and continue from your saved place when you have a little room in your day.",
  },
  {
    question: "Do I need to be an experienced developer?",
    answer:
      "Every course has its own starting point. Check the description and curriculum to see what is covered, and try any available preview lessons before choosing a course.",
  },
  {
    question: "How does course access work?",
    answer:
      "Choose one course for ongoing access to that course, a monthly plan for the collection while your subscription is active, or lifetime access to every current and future course. You can compare all three options in the pricing section.",
  },
  {
    question: "Can I try the learning experience first?",
    answer: (
      <>
        Yes. The <Link href="#demo">workspace preview</Link> gives you a look
        inside. You can also explore all six sample courses and their lessons
        without an account. The sample progress shows how your learning space
        will look.
      </>
    ),
  },
  {
    question: "What happens if I cancel my monthly plan?",
    answer:
      "You can cancel renewal from your account. Your access continues until the end of the paid period, and your learning progress stays saved. Courses purchased individually remain yours.",
  },
  {
    question: "When can I enroll?",
    answer:
      "Enrollment opens when courses are published and their checkout is ready. Until then, you can explore the demo. Available courses will appear in the collection above.",
  },
];

export function LearningFaq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className={styles.section}>
      <div className={styles.intro}>
        <span className={styles.icon}>
          <MessageCircle size={21} strokeWidth={1.5} />
        </span>
        <h2 id="faq-title">
          A little clarity,
          <br />
          before you begin.
        </h2>
        <p>
          A few things you might be wondering.
          <br />
          Your curiosity is in good company.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-6">
          <Link href="/support">
            Let’s talk <ArrowUpRight size={14} />
          </Link>
        </Button>
      </div>
      <Faq items={questions} />
    </section>
  );
}
