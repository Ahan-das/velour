"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { VISIT } from "@/lib/content";

/**
 * "Your visit": the photo holds still on the left while the steps scroll past
 * on the right. Each new step wipes its photo up over the last one, so the
 * picture changes exactly when the reader's attention does.
 */
export function Visit() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();

  return (
    <section id="visit" aria-labelledby="visit-title" className="px-4 py-24 md:px-8 md:py-36">
      <div className="mx-auto grid max-w-[1400px] gap-12 md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] md:gap-20">
        {/* Pinned photo stack (desktop). */}
        <div className="hidden md:block">
          <div className="sticky top-[12vh] h-[76vh] overflow-hidden rounded-3xl bg-paper-2">
            {VISIT.map((step, i) => (
              <img
                key={step.title}
                src={step.image}
                alt=""
                aria-hidden
                style={{
                  clipPath: i <= active ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)",
                  transform: i === active ? "scale(1)" : "scale(1.06)",
                  zIndex: i,
                }}
                className="absolute inset-0 size-full object-cover transition-[clip-path,transform] duration-[1100ms] ease-[cubic-bezier(0.76,0,0.24,1)]"
              />
            ))}
          </div>
        </div>

        <div>
          <h2
            id="visit-title"
            className="font-display text-[clamp(44px,7vw,112px)] font-normal leading-[0.95] tracking-[-0.03em]"
          >
            Your visit
          </h2>
          <ol className="mt-10 md:mt-0">
            {VISIT.map((step, i) => (
              <motion.li
                key={step.title}
                onViewportEnter={() => setActive(i)}
                viewport={{ amount: 0.6 }}
                className="flex flex-col justify-center gap-4 py-10 md:min-h-[64vh] md:py-0"
              >
                <img
                  src={step.image}
                  alt=""
                  aria-hidden
                  className="mb-2 aspect-[4/3] w-full rounded-3xl object-cover md:hidden"
                />
                <h3
                  className={`font-display text-[30px] leading-[1.1] tracking-[-0.02em] transition-opacity duration-700 md:text-[44px] ${
                    reduce || active === i ? "opacity-100" : "md:opacity-25"
                  }`}
                >
                  {step.title}
                </h3>
                <p
                  className={`max-w-[40ch] text-[17px] leading-[1.6] text-ink-soft transition-opacity duration-700 ${
                    reduce || active === i ? "opacity-100" : "md:opacity-25"
                  }`}
                >
                  {step.body}
                </p>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
