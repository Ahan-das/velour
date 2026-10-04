"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { MANIFESTO } from "@/lib/content";

/**
 * The statement reads itself in as you scroll: each word brightens from a
 * ghost to full ink in reading order. One idea per screen, so pacing matters
 * more than effects here.
 */
export function Manifesto() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.55"] });
  const words = MANIFESTO.split(" ");
  // A small round photo sits inline after the first sentence, like a drop-in plate.
  const plateAfter = words.findIndex((w) => w.endsWith("chair."));

  return (
    <section ref={ref} aria-label="Our approach" className="px-4 py-28 md:px-8 md:py-44">
      <p className="mx-auto max-w-[1180px] font-display text-[clamp(30px,4.3vw,64px)] font-normal leading-[1.16] tracking-[-0.02em] text-ink">
        {words.map((word, i) => (
          <span key={i}>
            <Word progress={scrollYProgress} index={i} total={words.length} reduce={!!reduce}>
              {word}
            </Word>
            {i === plateAfter && (
              <span
                aria-hidden
                className="mx-[0.25em] inline-block h-[0.82em] w-[1.9em] translate-y-[0.08em] overflow-hidden rounded-full align-baseline"
              >
                <img src="img/curls.webp" alt="" className="size-full object-cover object-[50%_30%]" />
              </span>
            )}{" "}
          </span>
        ))}
      </p>
    </section>
  );
}

function Word({
  children,
  progress,
  index,
  total,
  reduce,
}: {
  children: string;
  progress: MotionValue<number>;
  index: number;
  total: number;
  reduce: boolean;
}) {
  const start = (index / total) * 0.85;
  const opacity = useTransform(progress, [start, start + 0.15], [0.14, 1]);
  return <motion.span style={{ opacity: reduce ? 1 : opacity }}>{children}</motion.span>;
}
