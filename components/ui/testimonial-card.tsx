import Image from "next/image";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./testimonial-card.module.css";

export type Testimonial = {
  name: string;
  role: string;
  image: string;
  quote: string;
  subject: string;
  highlight: string;
};

export function ReviewStars({ className }: { className?: string }) {
  return (
    <span
      className={cn(styles.stars, className)}
      aria-label="Sample five-star rating"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={12}
          fill="currentColor"
          strokeWidth={0}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export function ReviewAuthor({
  review,
  className,
}: {
  review: Testimonial;
  className?: string;
}) {
  return (
    <div className={cn(styles.author, className)}>
      <Image
        src={review.image}
        alt=""
        width={44}
        height={44}
        sizes="44px"
        className={styles.avatar}
      />
      <div>
        <p className={styles.name}>{review.name}</p>
        <p className={styles.role}>{review.role}</p>
      </div>
    </div>
  );
}

export function TestimonialCard({
  review,
  className,
}: {
  review: Testimonial;
  className?: string;
}) {
  return (
    <figure className={cn(styles.card, className)}>
      <div className={styles.topline}>
        <ReviewStars />
        <span>{review.subject}</span>
      </div>
      <blockquote className={styles.quote}>“{review.quote}”</blockquote>
      <figcaption>
        <ReviewAuthor review={review} />
      </figcaption>
    </figure>
  );
}
