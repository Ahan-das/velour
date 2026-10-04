"use client";

import { Check, Copy } from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { SALON, SERVICES } from "@/lib/content";
import { Reveal } from "./Reveal";

type Status = "idle" | "sending" | "sent";
type Errors = Partial<Record<"name" | "phone" | "service", string>>;

const field =
  "h-14 w-full rounded-2xl border border-line bg-paper px-4 text-[16px] text-ink outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-ink-soft/70 focus:border-ink focus:shadow-[0_0_0_4px_rgb(21_20_19/0.06)] aria-[invalid=true]:border-accent";

/**
 * Booking request. There is no booking backend yet, so the form validates,
 * shows a sending state and a confirmation, and logs the request. Wire
 * `submitRequest` to the salon's booking tool or an email service at launch.
 */
async function submitRequest(data: Record<string, string>) {
  await new Promise((r) => setTimeout(r, 900));
  console.info("Booking request", data);
}

export function Booking() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [copied, setCopied] = useState(false);
  const serviceRef = useRef<HTMLSelectElement>(null);

  // "Book this" in the services fan preselects that service here.
  useEffect(() => {
    const onPick = (e: Event) => {
      const name = (e as CustomEvent<string>).detail;
      setStatus("idle");
      setErrors((x) => ({ ...x, service: undefined }));
      requestAnimationFrame(() => {
        if (serviceRef.current) serviceRef.current.value = name;
      });
    };
    window.addEventListener("velour:service", onPick);
    return () => window.removeEventListener("velour:service", onPick);
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const next: Errors = {};
    if (!data.name?.trim()) next.name = "Add your name so we know who to ask for.";
    if (!/^[+\d][\d\s()-]{6,}$/.test(data.phone ?? "")) next.phone = "Add a phone number we can call to confirm.";
    if (!data.service) next.service = "Pick a service, or choose \"Not sure yet\".";
    setErrors(next);
    if (Object.keys(next).length) return;
    setStatus("sending");
    await submitRequest(data);
    setStatus("sent");
  };

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(SALON.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard refused: the number is selectable text, so nothing is lost.
    }
  };

  return (
    <section id="book" aria-labelledby="book-title" className="px-4 pb-12 pt-24 md:px-8 md:pb-16 md:pt-36">
      <div className="mx-auto grid max-w-[1400px] gap-12 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-16">
        {/* Outer tray + inner plate: the form sits in the page like an object. */}
        <Reveal className="rounded-[2rem] bg-ink/[0.035] p-2 ring-1 ring-line">
          <div className="rounded-[calc(2rem-0.5rem)] bg-paper p-6 shadow-[inset_0_1px_0_rgb(255_255_255/0.8),0_24px_60px_-40px_rgb(30_24_20/0.35)] md:p-12">
            <h2
              id="book-title"
              className="font-display text-[clamp(40px,5.6vw,84px)] font-normal leading-[0.98] tracking-[-0.03em]"
            >
              Book a <em className="italic">chair</em>
            </h2>
            <p className="mt-4 max-w-[44ch] text-[17px] leading-[1.6] text-ink-soft">
              Tell us what you have in mind. We call within a day to find a time and match you with
              the right stylist.
            </p>

            <AnimatePresence mode="wait" initial={false}>
              {status === "sent" ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-10 flex flex-col items-start gap-4 rounded-2xl bg-paper-2 p-8"
                  role="status"
                >
                  <span className="grid size-12 place-items-center rounded-full bg-accent text-accent-ink">
                    <Check size={22} weight="light" aria-hidden />
                  </span>
                  <p className="font-display text-[28px] leading-[1.15]">Request received.</p>
                  <p className="max-w-[40ch] text-[16px] leading-[1.6] text-ink-soft">
                    We will call you to confirm a time. If it is sooner than tomorrow, ring the studio
                    directly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStatus("idle")}
                    className="text-[15px] font-medium underline decoration-line underline-offset-4 hover:decoration-ink"
                  >
                    Send another request
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  noValidate
                  onSubmit={onSubmit}
                  exit={{ opacity: 0, y: -12, transition: { duration: 0.3 } }}
                  className="mt-10 grid gap-5 md:grid-cols-2"
                >
                  <Field id="book-name" label="Name" error={errors.name}>
                    <input id="book-name" name="name" autoComplete="name" className={field} aria-invalid={!!errors.name} aria-describedby="book-name-error" />
                  </Field>
                  <Field id="book-phone" label="Phone" error={errors.phone}>
                    <input id="book-phone" name="phone" type="tel" autoComplete="tel" className={field} aria-invalid={!!errors.phone} aria-describedby="book-phone-error" />
                  </Field>
                  <Field id="book-service" label="Service" error={errors.service}>
                    <select ref={serviceRef} id="book-service" name="service" defaultValue="" className={`${field} appearance-none`} aria-invalid={!!errors.service} aria-describedby="book-service-error">
                      <option value="" disabled>
                        Choose one
                      </option>
                      {SERVICES.map((s) => (
                        <option key={s.name}>{s.name}</option>
                      ))}
                      <option>Not sure yet</option>
                    </select>
                  </Field>
                  <Field id="book-day" label="Preferred day" hint="Optional">
                    <input id="book-day" name="day" type="date" className={field} />
                  </Field>
                  <div className="md:col-span-2">
                    <Field id="book-notes" label="Anything we should know?" hint="Optional">
                      <textarea
                        id="book-notes"
                        name="notes"
                        rows={3}
                        className={`${field} h-auto resize-none py-4`}
                        placeholder="Last colour, a photo you love, how much time you have in the mornings"
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className="group inline-flex h-14 items-center gap-3 rounded-full bg-accent pl-7 pr-2 text-[15px] font-medium text-accent-ink shadow-[0_14px_34px_-14px_rgb(160_40_30/0.6)] transition-transform duration-300 ease-[var(--ease-spring)] active:scale-[0.98] disabled:opacity-80"
                    >
                      {status === "sending" ? "Sending request" : "Request a time"}
                      <span className="grid size-10 place-items-center rounded-full bg-white/15">
                        {status === "sending" ? (
                          <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        ) : (
                          <Check size={18} weight="light" aria-hidden />
                        )}
                      </span>
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="flex flex-col gap-10 md:pt-12">
          <img src="img/golden.webp" alt="Golden-hour light on painted brunette hair" className="aspect-[4/3] w-full rounded-3xl object-cover" />
          <dl className="grid gap-8 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
            <div className="flex flex-col gap-2">
              <dt className="text-[13px] font-medium text-ink-soft">Studio</dt>
              <dd className="text-[17px] leading-[1.55]">
                {SALON.address.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </dd>
            </div>
            <div className="flex flex-col gap-2">
              <dt className="text-[13px] font-medium text-ink-soft">Hours</dt>
              <dd className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[16px] tabular-nums">
                {SALON.hours.map((h) => (
                  <span key={h.days} className="contents">
                    <span>{h.days}</span>
                    <span className="text-ink-soft">{h.time}</span>
                  </span>
                ))}
              </dd>
            </div>
            <div className="flex flex-col gap-2">
              <dt className="text-[13px] font-medium text-ink-soft">Call the studio</dt>
              <dd className="flex items-center gap-3 text-[17px] tabular-nums">
                <a href={`tel:${SALON.phone.replace(/\s/g, "")}`} className="select-all hover:underline">
                  {SALON.phone}
                </a>
                <button
                  type="button"
                  onClick={copyPhone}
                  aria-label="Copy phone number"
                  className="grid size-9 place-items-center rounded-full border border-line transition-colors hover:border-ink"
                >
                  {copied ? <Check size={15} weight="light" /> : <Copy size={15} weight="light" />}
                </button>
              </dd>
            </div>
            <div className="flex flex-col gap-2">
              <dt className="text-[13px] font-medium text-ink-soft">Email</dt>
              <dd className="select-all text-[17px]">{SALON.email}</dd>
            </div>
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="flex items-baseline justify-between text-[14px] font-medium">
        {label}
        {hint && <span className="text-[13px] font-normal text-ink-soft">{hint}</span>}
      </label>
      {children}
      <p id={`${id}-error`} className="min-h-[1.2em] text-[13px] text-accent" aria-live="polite">
        {error}
      </p>
    </div>
  );
}
