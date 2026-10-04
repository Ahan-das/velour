"use client";

import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { motion, useReducedMotion } from "motion/react";
import { SERVICES } from "@/lib/content";

const EASE = [0.16, 1, 0.3, 1] as const;
const PICKS = [0, 1, 2] as const;
const FAN = [-13, 0, 13];
const FAN_OPEN = [-19, 0, 19];

/**
 * A small preview of the services ring for the hero's empty upper half: three
 * swatch cards that fan out on load and open wider on hover, with a line that
 * leads down to the full menu. It sets up the move the Services section makes.
 */
export function HeroSwatches() {
  const reduce = useReducedMotion();
  const from = SERVICES.reduce((m, s) => Math.min(m, Number(s.price.replace(/\D/g, ""))), Infinity);

  return (
    <motion.a
      href="#services"
      initial="hidden"
      animate="shown"
      whileHover="open"
      whileFocus="open"
      className="group flex items-center gap-10 rounded-[28px] pl-7 outline-offset-8"
      aria-label={`See all ${SERVICES.length} services`}
    >
      <span className="relative block h-[176px] w-[190px] shrink-0" aria-hidden>
        {PICKS.map((p, i) => (
          <motion.span
            key={p}
            variants={{
              hidden: { rotate: 0, y: 24, opacity: 0 },
              shown: {
                rotate: FAN[i],
                y: 0,
                opacity: 1,
                transition: { duration: reduce ? 0 : 1.1, delay: reduce ? 0 : 1.5 + i * 0.08, ease: EASE },
              },
              open: { rotate: FAN_OPEN[i], y: i === 1 ? -8 : 0, transition: { duration: 0.6, ease: EASE } },
            }}
            style={{ zIndex: i === 1 ? 3 : 2 - Math.abs(i - 1) }}
            className="absolute bottom-0 left-1/2 -ml-[54px] flex h-[150px] w-[108px] origin-[50%_190%] flex-col gap-1.5 rounded-[18px] bg-[#fbfbf9] p-1.5 pb-0 shadow-[inset_0_1px_0_rgb(255_255_255/0.9),0_1px_2px_rgb(30_24_20/0.06),0_22px_40px_-22px_rgb(30_24_20/0.45)]"
          >
            <img src={SERVICES[p].image} alt="" className="min-h-0 w-full flex-1 rounded-[13px] object-cover" />
            <span className="grid h-5 grid-cols-[1fr_auto_1fr] items-center px-1 pb-1 text-[9px] font-medium tabular-nums text-ink-soft">
              <span>{String(p + 1).padStart(2, "0")}</span>
              <span className="size-[7px] rounded-full bg-paper-2 shadow-[inset_0_1px_1px_rgb(30_24_20/0.25)]" />
              <span className="text-right">{SERVICES[p].price.replace("from ", "")}</span>
            </span>
          </motion.span>
        ))}
      </span>

      <motion.span
        variants={{
          hidden: { opacity: 0, x: -12 },
          shown: { opacity: 1, x: 0, transition: { duration: reduce ? 0 : 1, delay: reduce ? 0 : 1.75, ease: EASE } },
        }}
        className="flex flex-col gap-3"
      >
        <span className="text-[13px] font-medium tabular-nums text-ink-soft">
          {String(SERVICES.length).padStart(2, "0")} services, from £{from}
        </span>
        <span className="max-w-[13em] font-display text-[26px] leading-[1.15] tracking-[-0.015em] text-ink [text-wrap:balance] lg:text-[30px]">
          Cut, colour and care, <em className="whitespace-nowrap italic">by the swatch.</em>
        </span>
        <span className="inline-flex items-center gap-2 text-[14px] font-medium text-ink">
          <span className="relative">
            Turn the ring
            <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-[0.35] bg-ink transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-x-100" />
          </span>
          <ArrowRight size={14} weight="light" className="transition-transform duration-500 ease-[var(--ease-out)] group-hover:translate-x-1" />
        </span>
      </motion.span>
    </motion.a>
  );
}
