"use client";

import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import type { PointerEvent } from "react";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
};

/** Pill CTA that leans toward the pointer; the arrow sits in its own island. */
export function MagneticButton({ href, children, variant = "primary" }: Props) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 220, damping: 18, mass: 0.6 });
  const y = useSpring(my, { stiffness: 220, damping: 18, mass: 0.6 });

  const onMove = (e: PointerEvent<HTMLAnchorElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - (r.left + r.width / 2)) * 0.22);
    my.set((e.clientY - (r.top + r.height / 2)) * 0.3);
  };
  const reset = () => {
    mx.set(0);
    my.set(0);
  };

  const primary = variant === "primary";

  return (
    <motion.a
      href={href}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ x, y }}
      whileTap={{ scale: 0.97 }}
      className={`group inline-flex h-14 items-center gap-3 whitespace-nowrap rounded-full text-[15px] font-medium tracking-[-0.005em] transition-colors duration-500 ease-[var(--ease-out)] ${
        primary
          ? "bg-accent pl-6 pr-2 text-accent-ink shadow-[0_14px_34px_-14px_rgb(160_40_30/0.6),inset_0_1px_0_rgb(255_255_255/0.22)]"
          : "border border-line px-6 text-ink hover:bg-ink/5"
      }`}
    >
      <span>{children}</span>
      {primary && (
        <span className="grid size-10 place-items-center rounded-full bg-white/15 transition-transform duration-500 ease-[var(--ease-spring)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105">
          <ArrowUpRight size={18} weight="light" aria-hidden />
        </span>
      )}
    </motion.a>
  );
}
