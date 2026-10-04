"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

const LINKS = [
  { label: "Services", href: "#services" },
  { label: "The work", href: "#work" },
  { label: "Your visit", href: "#visit" },
];

const EASE = [0.16, 1, 0.3, 1] as const;

export function Nav() {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex justify-center px-4 pt-4 md:pt-5">
      <motion.nav
        aria-label="Primary"
        initial={reduce ? false : { y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, delay: 1.1, ease: EASE }}
        className="flex h-14 w-full max-w-[1400px] items-center justify-between gap-6 rounded-full border border-line bg-[var(--glass)] pl-5 pr-2 backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_10px_40px_-12px_rgb(40_24_16/0.18)]"
      >
        <a href="#" className="flex items-center gap-2.5 text-ink" aria-label="Velour home">
          <span className="grid size-7 place-items-center rounded-full bg-ink font-display text-[15px] leading-none text-paper">
            V
          </span>
          <span className="text-[15px] font-medium tracking-[-0.01em]">Velour</span>
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="group relative text-[14px] text-ink-soft transition-colors duration-500 ease-[var(--ease-out)] hover:text-ink"
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 h-px w-full origin-right scale-x-0 bg-ink transition-transform duration-500 ease-[var(--ease-out)] group-hover:origin-left group-hover:scale-x-100" />
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href="#book"
            className="hidden h-10 items-center rounded-full bg-ink px-5 text-[14px] font-medium text-paper transition-transform duration-300 ease-[var(--ease-spring)] hover:scale-[1.03] active:scale-[0.97] sm:inline-flex"
          >
            Book a chair
          </a>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="relative grid size-10 place-items-center rounded-full border border-line md:hidden"
          >
            <span
              className={`absolute h-px w-4 bg-ink transition-transform duration-500 ease-[var(--ease-spring)] ${open ? "rotate-45" : "-translate-y-[3px]"}`}
            />
            <span
              className={`absolute h-px w-4 bg-ink transition-transform duration-500 ease-[var(--ease-spring)] ${open ? "-rotate-45" : "translate-y-[3px]"}`}
            />
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="fixed inset-0 -z-10 bg-[var(--glass)] px-6 pt-28 backdrop-blur-3xl md:hidden"
          >
            <ul className="flex flex-col gap-2">
              {[...LINKS, { label: "Book a chair", href: "#book" }].map((l, i) => (
                <li key={l.href} className="overflow-hidden">
                  <motion.a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    initial={reduce ? false : { y: "110%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "110%" }}
                    transition={{ duration: 0.7, delay: 0.05 + i * 0.05, ease: EASE }}
                    className="block font-display text-[44px] leading-[1.15] tracking-[-0.02em] text-ink"
                  >
                    {l.label}
                  </motion.a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
