"use client";

import { motion, useReducedMotion } from "motion/react";
import { SALON } from "@/lib/content";

/** The page closes on the name, set as large as the hero opened, rising letter by letter. */
export function Footer() {
  const reduce = useReducedMotion();
  const letters = SALON.name.toUpperCase().split("");

  return (
    <footer className="overflow-hidden px-4 pb-8 pt-16 md:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 border-t border-line pt-10 text-[15px] md:grid-cols-4">
          <div className="flex flex-col gap-2">
            <span className="text-ink-soft">Visit</span>
            {SALON.address.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-ink-soft">Contact</span>
            <span className="select-all tabular-nums">{SALON.phone}</span>
            <span className="select-all">{SALON.email}</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-ink-soft">Explore</span>
            <a href="#services" className="hover:underline">Services</a>
            <a href="#work" className="hover:underline">The work</a>
            <a href="#book" className="hover:underline">Book a chair</a>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-ink-soft">Follow</span>
            <a href={SALON.instagram} className="hover:underline" rel="noreferrer" target="_blank">
              Instagram
            </a>
          </div>
        </div>

        {/* The trigger sits on the row: each letter starts clipped out of its own
            mask, so observing the letters themselves would never fire. */}
        <motion.p
          aria-label={SALON.name}
          initial={reduce ? false : "hidden"}
          whileInView="shown"
          viewport={{ once: true, amount: 0.3 }}
          className="mt-16 flex justify-between font-display text-[clamp(72px,19.5vw,300px)] font-black leading-[0.8] tracking-[-0.02em] text-ink"
        >
          {letters.map((ch, i) => (
            <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.04em]">
              <motion.span
                className="inline-block"
                variants={{ hidden: { y: "105%" }, shown: { y: "0%" } }}
                transition={{ duration: 1.2, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              >
                {ch}
              </motion.span>
            </span>
          ))}
        </motion.p>

        <div className="mt-6 flex flex-wrap justify-between gap-4 text-[13px] text-ink-soft">
          <span>© {new Date().getFullYear()} {SALON.name} Hair Atelier</span>
          <span>Cuts, colour and care by appointment</span>
        </div>
      </div>
    </footer>
  );
}
