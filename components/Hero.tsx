"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { HeroSwatches } from "./HeroSwatches";
import { MagneticButton } from "./MagneticButton";
import { SilkWordmark } from "./SilkWordmark";

/**
 * The photo and its cut-out come from the Maison Velle build. Set this to null
 * to fall back to the silk-hair shader inside the letters.
 */
const HERO_PHOTO = {
  photo: "hero/field.webp",
  cutout: "hero/field-cutout.webp",
  focus: [0.47, 0.32] as const,
};

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // The poster sinks slower than the page and the copy lifts away: two planes.
  const stageY = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]);
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", "-16%"]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={ref}
      aria-labelledby="hero-title"
      className="relative isolate px-4 pb-8 pt-[88px] md:px-8 md:pt-[96px]"
    >
      <div className="mx-auto grid w-full max-w-[1400px] gap-8 md:min-h-[calc(100dvh-120px)] md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:items-stretch md:gap-12">
        {/* Poster: the reference's magazine page. Right on desktop, first on phones. */}
        <motion.div
          style={{ y: reduce ? 0 : stageY }}
          className="relative md:order-2"
        >
          <SilkWordmark
            word="Velour"
            photo={HERO_PHOTO?.photo}
            cutout={HERO_PHOTO?.cutout}
            focus={HERO_PHOTO?.focus}
            scroll={scrollYProgress}
            className="aspect-[10/11] w-full md:aspect-auto md:h-full md:min-h-[560px]"
          />
        </motion.div>

        <motion.div
          style={reduce ? undefined : { y: copyY, opacity: copyOpacity }}
          className="flex flex-col justify-end gap-8 md:order-1 md:justify-between md:pb-6 md:pt-2"
        >
          <motion.div
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.2, ease: EASE }}
              className="flex items-center justify-between gap-6 border-b border-line pb-4 text-[12px] font-medium uppercase tracking-[0.32em] text-ink-soft"
            >
              <span>Velour hair atelier</span>
              <span className="hidden tracking-[0.2em] lg:inline">London W2, by appointment</span>
            </motion.div>
          {/* Fills the space above the headline on tall desktop screens; phones open on the poster instead. */}
          <div className="hidden md:block [@media(max-height:759px)]:hidden">
            <HeroSwatches />
          </div>
          <div className="flex flex-col gap-8">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 28, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.1, delay: 1.3, ease: EASE }}
            className="flex flex-col gap-5"
          >
            <h1
              id="hero-title"
              className="font-display text-[44px] font-normal leading-[1.04] tracking-[-0.025em] text-ink [text-wrap:balance] sm:text-[56px] lg:text-[72px]"
            >
              Hair that <em className="italic">moves</em> the way you do.
            </h1>
            <p className="max-w-[36ch] text-[17px] leading-[1.55] text-ink-soft md:text-[18px]">
              Precision cuts, lived-in colour and slow, careful care, in a quiet studio built around
              your chair.
            </p>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.55, ease: EASE }}
            className="flex flex-wrap items-center gap-3"
          >
            <MagneticButton href="#book">Book a chair</MagneticButton>
            <MagneticButton href="#services" variant="ghost">
              View services
            </MagneticButton>
          </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
