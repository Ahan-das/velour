"use client";

import { ArrowLeft, ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { SERVICES } from "@/lib/content";
import { startFan, type FanHandle } from "@/lib/serviceFan";
import "./services.css";

const EASE = [0.16, 1, 0.3, 1] as const;
const pad = (n: number) => String(n).padStart(2, "0");

/* Name swap: each word rises in from under its baseline and leaves upward. */
const words = {
  enter: { transition: { staggerChildren: 0.06 } },
  exit: { transition: { staggerChildren: 0.03 } },
};
const word = {
  initial: { y: "110%" },
  enter: { y: "0%", transition: { duration: 0.8, ease: EASE } },
  exit: { y: "-110%", transition: { duration: 0.36, ease: [0.7, 0, 0.84, 0] as const } },
};
const detail = {
  initial: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE, delay: 0.12 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

/** Tell the booking form which service was picked. */
const pickService = (name: string) => window.dispatchEvent(new CustomEvent("velour:service", { detail: name }));

/**
 * Services as a colour-swatch ring: one card per service, fanned from a pivot
 * below the stage. On a computer the section pins and each scroll turns the
 * ring by one card; on a phone you drag the ring sideways. The engine is in
 * lib/serviceFan.ts; this component is the markup and the words.
 */
export function Services() {
  const root = useRef<HTMLElement>(null);
  const fan = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const veils = useRef<(HTMLDivElement | null)[]>([]);
  const handle = useRef<FanHandle | null>(null);
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const s = SERVICES[active];

  useEffect(() => {
    if (!root.current || !fan.current) return;
    const h = startFan(
      {
        root: root.current,
        fan: fan.current,
        cards: cards.current.filter((el): el is HTMLDivElement => !!el),
        veils: veils.current.filter((el): el is HTMLDivElement => !!el),
      },
      { tones: SERVICES.map((x) => x.tone), reduced: !!reduced, onIndex: setActive },
    );
    handle.current = h;
    return () => h.destroy();
  }, [reduced]);

  return (
    <section
      ref={root}
      id="services"
      aria-labelledby="services-title"
      className="svc"
      style={{ ["--n" as string]: SERVICES.length }}
    >
      <div className="svc__stage">
        <div ref={fan} className="svc__fan" aria-hidden="true">
          <div className="svc__glow" />
          {SERVICES.map((x, n) => (
            <div
              key={x.name}
              ref={(el) => {
                cards.current[n] = el;
              }}
              className="svc__card"
            >
              <img src={x.image} alt="" draggable={false} decoding="async" />
              <div className="svc__tag">
                <span>{pad(n + 1)}</span>
                <span className="svc__hole" />
                <span>{x.price.replace("from ", "")}</span>
              </div>
              <div
                ref={(el) => {
                  veils.current[n] = el;
                }}
                className="svc__veil"
              />
            </div>
          ))}
        </div>

        <div className="svc__copy">
          <header className="svc__head">
            <h2 id="services-title">Services</h2>
            <p>
              Every service starts with a consultation. Prices depend on length and density, and
              we confirm yours before we begin.
            </p>
          </header>

          <div className="svc__now" aria-live="polite">
            <span className="svc__count">
              {pad(active + 1)} <i>/ {pad(SERVICES.length)}</i>
            </span>
            <h3 className="svc__name">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={s.name} className="svc__name-in" variants={words} initial="initial" animate="enter" exit="exit">
                  {s.name.split(" ").map((w, i) => (
                    <span key={i}>
                      {i > 0 && " "}
                      <span className="svc__word">
                        <motion.span variants={word}>{w}</motion.span>
                      </span>
                    </span>
                  ))}
                </motion.span>
              </AnimatePresence>
            </h3>
            <div className="svc__detail">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div key={s.name} variants={detail} initial="initial" animate="enter" exit="exit">
                  <p>{s.detail}</p>
                  <div className="svc__buy">
                    <span className="svc__price">{s.price}</span>
                    <a href="#book" className="svc__book" onClick={() => pickService(s.name)}>
                      Book this
                      <span>
                        <ArrowUpRight size={16} weight="light" aria-hidden />
                      </span>
                    </a>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Phones: arrows and a hint that the ring turns by hand. */}
          <div className="svc__pager">
            <button type="button" aria-label="Previous service" onClick={() => handle.current?.step(-1)} disabled={active === 0}>
              <ArrowLeft size={18} weight="light" />
            </button>
            <span className="svc__hint">Drag the cards</span>
            <button
              type="button"
              aria-label="Next service"
              onClick={() => handle.current?.step(1)}
              disabled={active === SERVICES.length - 1}
            >
              <ArrowRight size={18} weight="light" />
            </button>
          </div>
        </div>

        {/* Computers: the whole menu along the bottom, and a way to jump. */}
        <ol className="svc__rail" aria-label="Choose a service">
          {SERVICES.map((x, n) => (
            <li key={x.name}>
              <button type="button" aria-pressed={n === active} onClick={() => handle.current?.goTo(n)}>
                {n === active && (
                  <motion.span layoutId="svc-active" className="svc__rail-mark" transition={{ type: "spring", stiffness: 420, damping: 36 }} />
                )}
                <span className="svc__rail-n">{pad(n + 1)}</span>
                {x.name}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
