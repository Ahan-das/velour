"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { LOOKS, type Look } from "@/lib/content";

/**
 * The work, shown as a contact strip that slides sideways while the page
 * scrolls down. Lateral travel reads as "browse", which is what a lookbook is
 * for. On phones and with reduced motion it becomes a native swipe row.
 */
export function Lookbook() {
  const [pinned, setPinned] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const update = () => setPinned(mq.matches && !reduce);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [reduce]);

  return pinned ? <PinnedStrip /> : <SwipeStrip />;
}

function Heading() {
  return (
    <div className="flex w-[min(420px,80vw)] shrink-0 flex-col justify-end gap-5 self-stretch pb-2">
      <h2
        id="work-title"
        className="font-display text-[clamp(44px,7vw,112px)] font-normal leading-[0.95] tracking-[-0.03em]"
      >
        The <em className="italic">work</em>
      </h2>
      <p className="max-w-[34ch] text-[17px] leading-[1.6] text-ink-soft">
        Recent chairs, photographed as they left. No filters on the colour, only on the light.
      </p>
    </div>
  );
}

function PinnedStrip() {
  const wrap = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);

  useEffect(() => {
    const measure = () => {
      if (!track.current) return;
      setDistance(Math.max(0, track.current.scrollWidth - window.innerWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <section
      id="work"
      ref={wrap}
      aria-labelledby="work-title"
      // Scroll length equals the sideways travel, so one wheel notch moves the
      // strip about as far as it would move the page.
      style={{ height: `calc(100dvh + ${distance}px)` }}
      className="relative"
    >
      <div className="sticky top-0 flex h-[100dvh] items-center overflow-hidden">
        <motion.div ref={track} style={{ x }} className="flex items-end gap-6 px-8 pr-[12vw]">
          <Heading />
          {LOOKS.map((look, i) => (
            <Frame key={look.title} look={look} index={i} progress={scrollYProgress} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Frame({ look, index, progress }: { look: Look; index: number; progress: MotionValue<number> }) {
  // Alternate tall and short frames so the strip has a rhythm, not a grid.
  const tall = index % 2 === 0;
  // The photo drifts inside its frame a little against the strip's travel.
  const inner = useTransform(progress, [0, 1], ["6%", "-6%"]);
  return (
    <figure className={`shrink-0 ${tall ? "w-[clamp(260px,26vw,400px)]" : "w-[clamp(220px,21vw,330px)]"}`}>
      <div
        className={`overflow-hidden rounded-3xl bg-paper-2 ${tall ? "aspect-[3/4]" : "aspect-[4/5]"}`}
      >
        <motion.img
          src={look.image}
          alt={`${look.title}: ${look.note}`}
          loading="lazy"
          style={{ x: inner, scale: 1.16 }}
          className="size-full object-cover"
        />
      </div>
      <figcaption className="mt-4 flex flex-col gap-1">
        <span className="font-display text-[22px] tracking-[-0.01em]">{look.title}</span>
        <span className="text-[14px] leading-[1.5] text-ink-soft">{look.note}</span>
      </figcaption>
    </figure>
  );
}

function SwipeStrip() {
  return (
    <section id="work" aria-labelledby="work-title" className="py-20">
      <div className="px-4 pb-10 md:px-8">
        <Heading />
      </div>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] md:px-8">
        {LOOKS.map((look) => (
          <figure key={look.title} className="w-[72vw] max-w-[320px] shrink-0 snap-start">
            <div className="aspect-[3/4] overflow-hidden rounded-3xl bg-paper-2">
              <img
                src={look.image}
                alt={`${look.title}: ${look.note}`}
                loading="lazy"
                className="size-full object-cover"
              />
            </div>
            <figcaption className="mt-3 flex flex-col gap-1">
              <span className="font-display text-[20px]">{look.title}</span>
              <span className="text-[14px] leading-[1.5] text-ink-soft">{look.note}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
