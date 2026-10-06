"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Code2, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TestimonialCard,
  ReviewAuthor,
  ReviewStars,
} from "@/components/ui/testimonial-card";
import { sampleReviews } from "./reviews-data";
import styles from "./developer-reviews.module.css";

const featuredReviews = [sampleReviews[0], sampleReviews[2], sampleReviews[4]];

export function DeveloperReviews() {
  const [active, setActive] = useState(0);
  const featured = featuredReviews[active];
  function move(direction: number) {
    setActive(
      (previous) =>
        (previous + direction + featuredReviews.length) %
        featuredReviews.length,
    );
  }
  return (
    <section
      id="reviews"
      aria-labelledby="reviews-title"
      className={styles.section}
    >
      <div className="shell">
        <div className={styles.heading}>
          <div>
            <span className={styles.label}>
              <Code2 size={14} /> The developer perspective
            </span>
            <h2 id="reviews-title">
              Different paths.
              <br />
              Same spark.
            </h2>
          </div>
          <div className={styles.intro}>
            <div className={styles.avatarStack} aria-hidden="true">
              {sampleReviews.slice(0, 5).map((review) => (
                <Image
                  key={review.name}
                  src={review.image}
                  alt=""
                  width={36}
                  height={36}
                  sizes="36px"
                />
              ))}
              <span>↗</span>
            </div>
            <p>
              For the late-night tinkerers. The career changers.
              <br className="hidden sm:block" /> The developers who never stop
              asking why.
            </p>
            <span className={styles.sampleLabel}>
              <span /> Sample reviews · fictional profiles
            </span>
          </div>
        </div>
        <div className={styles.columns}>
          <div className={styles.column}>
            <figure
              className={styles.featured}
              aria-label="Featured sample review"
            >
              <div className={styles.featuredTop}>
                <span>
                  <span /> A moment of clarity
                </span>
                <Quote size={25} strokeWidth={1.25} aria-hidden="true" />
              </div>
              <div key={featured.name} className={styles.featuredStory}>
                <ReviewStars />
                <p className={styles.highlight}>{featured.highlight}</p>
                <blockquote>“{featured.quote}”</blockquote>
              </div>
              <p className="sr-only" role="status" aria-atomic="true">
                {featured.name}: {featured.quote}
              </p>
              <figcaption className={styles.featuredAuthor}>
                <ReviewAuthor review={featured} />
                <div className={styles.controls}>
                  <div className={styles.dots}>
                    {featuredReviews.map((review, index) => (
                      <button
                        key={review.name}
                        aria-label={`Read ${review.name}’s sample review`}
                        aria-pressed={active === index}
                        onClick={() => setActive(index)}
                      >
                        <span />
                      </button>
                    ))}
                  </div>
                  <div className={styles.arrows}>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Previous sample review"
                      onClick={() => move(-1)}
                    >
                      <ArrowLeft size={15} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Next sample review"
                      onClick={() => move(1)}
                    >
                      <ArrowRight size={15} />
                    </Button>
                  </div>
                </div>
              </figcaption>
            </figure>
            <TestimonialCard review={sampleReviews[3]} />
          </div>
          <div className={styles.column}>
            <TestimonialCard review={sampleReviews[1]} />
            <TestimonialCard review={sampleReviews[4]} />
            <TestimonialCard review={sampleReviews[6]} />
          </div>
          <div className={styles.column}>
            <TestimonialCard review={sampleReviews[2]} />
            <TestimonialCard review={sampleReviews[5]} />
            <TestimonialCard review={sampleReviews[7]} />
          </div>
        </div>
        <div className={styles.footnote}>
          <span className={styles.line} />
          <span>A good explanation can change the way you build.</span>
          <span className={styles.line} />
        </div>
      </div>
    </section>
  );
}
