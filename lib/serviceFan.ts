/**
 * The services fan: every service is a card on a colour-swatch ring, pinned
 * at a pivot below the stage. Turning the ring brings the next card upright.
 *
 * Two ways to turn it, chosen by the device (PIN_QUERY, also used in CSS):
 *
 * - Mouse and trackpad: the section pins and the page scroll turns the ring
 *   one service per gesture. Inertia can't skip a card, a flick arriving from
 *   the section above is absorbed, and at either end the page scrolls on.
 * - Touch (and reduced motion): an ordinary section that scrolls past like any
 *   other. The ring turns only by dragging it sideways, 1:1 under the finger,
 *   or with the arrows. Vertical swipes always belong to the page.
 */
import { getLenis } from "./lenis";

export const PIN_QUERY = "(min-width: 900px) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

export type FanRefs = {
  root: HTMLElement;
  fan: HTMLElement;
  cards: HTMLElement[];
  veils: HTMLElement[];
};

export type FanHandle = { destroy: () => void; goTo: (i: number) => void; step: (dir: number) => void };

type RGB = readonly [number, number, number];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

export function startFan(
  refs: FanRefs,
  opts: { tones: RGB[]; reduced: boolean; onIndex: (i: number) => void },
): FanHandle {
  const { root, fan, cards, veils } = refs;
  const N = cards.length;
  const reduced = opts.reduced;
  const pinMode = window.matchMedia(PIN_QUERY).matches;

  let raf = 0, disposed = false, visible = false, last = performance.now();
  const t0 = last;
  let prog = 0, progTarget = 0, current = -1;
  const ptr = { tx: 0, x: 0 };
  // touch: the first time the ring is reached it gives a small turn, so it reads as something to drag
  let nudgeAt = !pinMode && !reduced ? -1 : Infinity;

  // ---- geometry ----
  let fw = 1, fh = 1, px = 0, py = 0, rad = 1, cw = 1, ch = 1, stepDeg = 11;
  const measure = () => {
    const r = fan.getBoundingClientRect();
    fw = r.width;
    fh = r.height;
    if (pinMode) {
      ch = Math.min(fh * 0.6, fw * 0.62);
      cw = ch * 0.74;
      px = fw * 0.5;
      py = fh * 1.3;
      rad = py - fh * 0.5;
      stepDeg = 10.5;
    } else {
      ch = Math.min(fh - 64, (Math.min(fw * 0.64, 340)) / 0.74);
      cw = ch * 0.74;
      px = fw * 0.5;
      py = fh * 1.6;
      rad = py - (fh - 64) * 0.5 - 6;
      stepDeg = 15;
    }
    cards.forEach((el) => {
      el.style.width = `${cw.toFixed(1)}px`;
      el.style.height = `${ch.toFixed(1)}px`;
    });
  };

  // ---- pinned mode: scroll position <-> card ----
  const geo = () => {
    const r = root.getBoundingClientRect();
    const travel = Math.max(1, r.height - window.innerHeight);
    return { top: window.scrollY + r.top, travel, pinned: r.top <= 1 && r.bottom >= window.innerHeight - 1 };
  };
  const fIndex = () => {
    const g = geo();
    return clamp((window.scrollY - g.top) / g.travel) * (N - 1);
  };
  const restY = (i: number) => {
    const g = geo();
    return g.top + (g.travel * i) / (N - 1);
  };
  const readScroll = () => {
    if (!pinMode) return;
    const r = root.getBoundingClientRect();
    progTarget = clamp(-r.top / Math.max(1, r.height - window.innerHeight));
  };
  // a soft rest at every card, so the ring parks while the scroll settles
  const toPos = (p: number) => {
    const f = p * (N - 1);
    const i = Math.min(N - 2, Math.floor(f));
    return i + smooth(0.06, 0.94, f - i);
  };

  // ---- render ----
  const tone = (pos: number) => {
    const i = Math.min(N - 2, Math.max(0, Math.floor(pos)));
    const t = clamp(pos - i);
    const a = opts.tones[i], b = opts.tones[i + 1];
    return `rgb(${lerp(a[0], b[0], t).toFixed(0)} ${lerp(a[1], b[1], t).toFixed(0)} ${lerp(a[2], b[2], t).toFixed(0)})`;
  };

  const frame = (now: number) => {
    raf = 0;
    if (disposed) return;
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    const t = (now - t0) / 1000;
    const k = (rate: number) => (reduced ? 1 : 1 - Math.exp(-rate * dt));
    prog = lerp(prog, progTarget, k(pinMode ? 14 : 10));
    ptr.x = lerp(ptr.x, ptr.tx, k(5));
    const pos = pinMode ? toPos(prog) : prog * (N - 1);

    const idx = Math.round(pos);
    if (idx !== current) {
      current = idx;
      opts.onIndex(idx);
    }
    root.style.setProperty("--svc-tone", tone(pos));

    if (nudgeAt === -1) {
      const top = root.getBoundingClientRect().top;
      if (top < window.innerHeight * 0.3 && top > -window.innerHeight * 0.4) nudgeAt = t;
    }
    const nt = t - nudgeAt;
    const nudge = nt > 0 && nt < 2 ? Math.sin(nt * Math.PI * 1.5) * Math.exp(-nt * 2.2) * 0.22 : 0;
    const turn = pos + nudge;
    const lean = pinMode && !reduced ? ptr.x * 1.4 : 0;

    for (let i = 0; i < N; i++) {
      const d = i - turn;
      const ad = Math.abs(d);
      const a = d * stepDeg + lean;
      const s = 1 - 0.09 * Math.min(ad, 3);
      const op = pinMode
        ? d < 0
          ? smooth(-1.9, -0.35, d)
          : 1 - smooth(2.3, 3.3, d)
        : 1 - smooth(1.5, 2.5, ad);
      const el = cards[i];
      el.style.transform =
        `translate3d(${(px - cw / 2).toFixed(1)}px, ${(py - ch / 2).toFixed(1)}px, 0) rotate(${a.toFixed(3)}deg) translateY(${(-rad).toFixed(1)}px) scale(${s.toFixed(4)})`;
      el.style.opacity = op.toFixed(3);
      el.style.zIndex = String(100 - Math.round(ad * 10));
      el.style.visibility = op < 0.01 ? "hidden" : "visible";
      veils[i].style.opacity = (Math.min(1, ad) * 0.45).toFixed(3);
    }
    if (!("ready" in root.dataset)) root.dataset.ready = "";

    const moving =
      Math.abs(prog - progTarget) > 0.0004 || Math.abs(ptr.x - ptr.tx) > 0.002 || (nt > 0 && nt < 2) || nudgeAt === -1;
    if (visible && !reduced && moving) raf = requestAnimationFrame(frame);
  };
  function kick() {
    if (raf || disposed) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  // ---- pinned mode: programmatic scroll, through Lenis when it is running ----
  let animating = false;
  let animIdx: number | null = null;
  let anim = 0;
  const scrollTo = (y: number, dur: number) => {
    cancelAnimationFrame(anim);
    const lenis = getLenis();
    if (reduced || Math.abs(y - window.scrollY) < 2) {
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
      animating = false;
      animIdx = null;
      return;
    }
    animating = true;
    const done = () => {
      animating = false;
      animIdx = null;
    };
    if (lenis) {
      lenis.scrollTo(y, { duration: dur / 1000, easing: easeInOut, force: true, lock: true, onComplete: done });
      return;
    }
    const from = window.scrollY;
    const start = performance.now();
    const tick = (now: number) => {
      const x = clamp((now - start) / dur);
      window.scrollTo(0, from + (y - from) * easeInOut(x));
      if (x < 1) anim = requestAnimationFrame(tick);
      else done();
    };
    anim = requestAnimationFrame(tick);
  };
  const baseF = () => (animating && animIdx !== null ? animIdx : fIndex());
  const canStep = (dir: number) => (dir > 0 ? baseF() < N - 1 - 0.02 : baseF() > 0.02);
  const go = (i: number, dur = 820) => {
    scrollTo(restY(i), dur);
    if (animating) animIdx = i;
  };
  const snapStep = (dir: number) => {
    if (!canStep(dir)) return false;
    const f = baseF();
    const target = dir > 0 ? Math.floor(f + 0.02) + 1 : Math.ceil(f - 0.02) - 1;
    go(Math.max(0, Math.min(N - 1, target)));
    return true;
  };

  // wheel: one gesture = one card; a gesture ends after a short silence, so inertia can't skip cards.
  // Registered in the capture phase so Lenis never sees a wheel the ring has taken.
  let gesture = false, gestureTimer = 0, accum = 0, lastWheel = 0, wasPinned = false;
  const endGestureSoon = () => {
    window.clearTimeout(gestureTimer);
    gestureTimer = window.setTimeout(() => {
      gesture = false;
      accum = 0;
    }, 200);
  };
  const take = (e: Event) => {
    e.preventDefault();
    e.stopImmediatePropagation();
  };
  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const now = performance.now();
    const pinned = geo().pinned;
    const dir = Math.sign(e.deltaY);
    if (pinned && !wasPinned && now - lastWheel < 160) {
      // arriving mid-flick from the section above or below: settle on the first or last card
      gesture = true;
      go(dir > 0 ? 0 : N - 1, 520);
    }
    wasPinned = pinned;
    lastWheel = now;
    if (!pinned || !dir) return;
    if (gesture || animating) {
      take(e);
      endGestureSoon();
      return;
    }
    if (!canStep(dir)) return; // let the page scroll on
    take(e);
    accum += e.deltaY;
    endGestureSoon();
    if (Math.abs(accum) < 8) return;
    gesture = true;
    snapStep(dir);
  };
  const onKey = (e: KeyboardEvent) => {
    if (!geo().pinned || e.altKey || e.metaKey || e.ctrlKey) return;
    const tg = e.target as HTMLElement | null;
    if (tg && /input|textarea|select/i.test(tg.tagName)) return;
    const dir = e.key === "ArrowDown" || e.key === "PageDown" ? 1 : e.key === "ArrowUp" || e.key === "PageUp" ? -1 : 0;
    if (dir && snapStep(dir)) take(e);
  };
  // anything else (scrollbar, a glide that stopped between cards): settle on the nearest card
  let settleTimer = 0, lastY = window.scrollY, lastDir = 0;
  const settle = () => {
    if (animating || gesture || !geo().pinned) return;
    const f = fIndex();
    if (Math.abs(f - Math.round(f)) < 0.01) return;
    const target = lastDir > 0 ? Math.ceil(f - 0.25) : lastDir < 0 ? Math.floor(f + 0.25) : Math.round(f);
    go(Math.max(0, Math.min(N - 1, target)), 600);
  };
  const onScroll = () => {
    const y = window.scrollY;
    if (y !== lastY) lastDir = Math.sign(y - lastY);
    lastY = y;
    readScroll();
    kick();
    if (pinMode && !animating) {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, 160);
    }
  };

  // ---- touch mode: drag the ring round under the finger ----
  const goManual = (i: number) => {
    progTarget = clamp(Math.max(0, Math.min(N - 1, i)) / (N - 1));
    kick();
  };
  const posNow = () => progTarget * (N - 1);
  const dragUnit = () => Math.min(300, Math.max(150, fw * 0.5)); // px of drag per card
  let drag: { x: number; y: number; id: number; pos: number; t: number } | null = null;
  let dragMode: "turn" | "none" | null = null;
  let vel = { x: 0, t: 0, v: 0 };
  const onDown = (e: PointerEvent) => {
    if ((e.pointerType === "mouse" && e.button !== 0) || (e.target as HTMLElement).closest("a, button")) return;
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId, pos: posNow(), t: performance.now() };
    dragMode = null;
    vel = { x: e.clientX, t: performance.now(), v: 0 };
    nudgeAt = Infinity; // they found it
  };
  const onMove = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (dragMode === null) {
      if (Math.hypot(dx, dy) < 7) return;
      dragMode = Math.abs(dx) > Math.abs(dy) * 1.1 ? "turn" : "none";
      if (dragMode === "none") {
        drag = null;
        return;
      }
      fan.dataset.dragging = "";
      try { fan.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
    }
    // a little resistance past either end
    let p = drag.pos - dx / dragUnit();
    if (p < 0) p *= 0.3;
    if (p > N - 1) p = N - 1 + (p - (N - 1)) * 0.3;
    progTarget = p / (N - 1);
    const now = performance.now();
    vel = { x: e.clientX, t: now, v: ((e.clientX - vel.x) / Math.max(1, now - vel.t)) * 0.6 + vel.v * 0.4 };
    kick();
  };
  const onUp = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const turned = dragMode === "turn";
    const from = Math.round(drag.pos);
    const quick = performance.now() - drag.t < 260 && Math.abs(e.clientX - drag.x) > 24;
    drag = null;
    dragMode = null;
    if (!turned) return;
    delete fan.dataset.dragging;
    // land on the nearest card; a quarter of a card or a quick flick carries one further
    const delta = posNow() - from;
    let target = from + Math.sign(delta) * Math.ceil(Math.abs(delta) - 0.25);
    if ((quick || Math.abs(vel.v) > 0.35) && target === from) target = from + Math.sign(delta || -vel.v);
    goManual(target);
  };

  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const r = fan.getBoundingClientRect();
    ptr.tx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
    kick();
  };
  const onLeave = () => {
    ptr.tx = 0;
    kick();
  };

  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) kick();
  });
  io.observe(root);
  const ro = new ResizeObserver(() => {
    measure();
    readScroll();
    kick();
  });
  ro.observe(fan);
  window.addEventListener("scroll", onScroll, { passive: true });
  if (pinMode) {
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("keydown", onKey, { capture: true });
    root.addEventListener("pointermove", onPointer, { passive: true });
    root.addEventListener("pointerleave", onLeave);
  } else {
    fan.addEventListener("pointerdown", onDown, { passive: true });
    fan.addEventListener("pointermove", onMove, { passive: true });
    fan.addEventListener("pointerup", onUp, { passive: true });
    fan.addEventListener("pointercancel", onUp, { passive: true });
  }

  measure();
  readScroll();
  prog = progTarget;
  kick();

  return {
    destroy() {
      disposed = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(anim);
      window.clearTimeout(gestureTimer);
      window.clearTimeout(settleTimer);
      delete root.dataset.ready;
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("keydown", onKey, { capture: true });
      root.removeEventListener("pointermove", onPointer);
      root.removeEventListener("pointerleave", onLeave);
      fan.removeEventListener("pointerdown", onDown);
      fan.removeEventListener("pointermove", onMove);
      fan.removeEventListener("pointerup", onUp);
      fan.removeEventListener("pointercancel", onUp);
    },
    goTo: (i) => (pinMode ? go(Math.max(0, Math.min(N - 1, i))) : goManual(i)),
    step: (dir) => {
      if (pinMode) snapStep(dir);
      else goManual(Math.round(posNow()) + dir);
    },
  };
}
