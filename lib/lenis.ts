import type Lenis from "lenis";

/**
 * The page's Lenis instance, when smooth scrolling is on. Sections that drive
 * the scroll themselves (the services fan) go through it, so their programmatic
 * scrolls and the visitor's wheel never pull against each other.
 */
let instance: Lenis | null = null;
export const setLenis = (l: Lenis | null) => {
  instance = l;
};
export const getLenis = () => instance;
