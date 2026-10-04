/**
 * All page copy in one place, so the salon's real details can be dropped in
 * without touching components.
 *
 * PLACEHOLDERS: the name "Velour", every price, the address, hours, phone and
 * email are sample values. Replace them with the client's before launch.
 */

export const SALON = {
  name: "Velour",
  address: ["14 Linden Row", "London W2 4JH"],
  phone: "+44 20 7946 0183",
  email: "hello@velour.studio",
  instagram: "https://instagram.com/",
  hours: [
    { days: "Tue to Fri", time: "10:00 - 20:00" },
    { days: "Saturday", time: "09:00 - 18:00" },
    { days: "Sun, Mon", time: "Closed" },
  ],
};

export const MANIFESTO =
  "We cut for the way your hair lives on a Tuesday, not for the five minutes after you leave the chair. Every appointment starts with a conversation and ends with hair you know how to wear.";

export type Service = {
  name: string;
  detail: string;
  price: string;
  image: string;
  /** soft light behind the card when it stands at the front of the services fan */
  tone: readonly [number, number, number];
};

export const SERVICES: Service[] = [
  {
    name: "Cut and finish",
    detail: "Consultation, wash, precision cut and a finish you can repeat at home.",
    price: "from £85",
    image: "img/bob.webp",
    tone: [226, 224, 220],
  },
  {
    name: "Lived-in colour",
    detail: "Hand-painted balayage and soft root melts that grow out without a line.",
    price: "from £190",
    image: "img/golden.webp",
    tone: [238, 212, 184],
  },
  {
    name: "Curl cut",
    detail: "Cut dry, curl by curl, so the shape works with your pattern.",
    price: "from £110",
    image: "img/curls.webp",
    tone: [232, 208, 186],
  },
  {
    name: "Gloss and tone",
    detail: "A thirty-minute shine refresh between colour appointments.",
    price: "from £55",
    image: "img/shades.webp",
    tone: [228, 216, 204],
  },
  {
    name: "Treatments",
    detail: "Bond repair and scalp care, matched to what your hair has been through.",
    price: "from £45",
    image: "img/portrait.webp",
    tone: [212, 218, 228],
  },
  {
    name: "Occasion hair",
    detail: "Weddings and events, with a trial first so the day holds no surprises.",
    price: "from £150",
    image: "img/cloud-bw.webp",
    tone: [222, 224, 228],
  },
];

export type Look = { title: string; note: string; image: string };

export const LOOKS: Look[] = [
  { title: "The soft bob", note: "Chin length, blunt at the back, broken at the front.", image: "img/bob.webp" },
  { title: "Copper curl", note: "Curl cut with a warm gloss to lift the copper.", image: "img/curls.webp" },
  { title: "Windswept", note: "Long layers cut to move, finished with air.", image: "img/cloud-bw.webp" },
  { title: "Golden hour", note: "Painted brunette that catches light at the ends.", image: "img/golden.webp" },
  { title: "Glass black", note: "One-tone gloss, cut sharp, worn straight.", image: "img/portrait.webp" },
  { title: "City crop", note: "Short, textured and easy before nine.", image: "img/shades.webp" },
  { title: "Lived-in bob", note: "Grown-out bob reshaped to look intentional.", image: "img/street.webp" },
];

export type Step = { title: string; body: string; image: string };

export const VISIT: Step[] = [
  {
    title: "Talk first",
    body: "Fifteen minutes on how you wear your hair, what you want to stop fighting and how much time you give it each morning.",
    image: "img/street.webp",
  },
  {
    title: "Cut to the hair you have",
    body: "We read growth patterns, density and how it falls when it dries, then shape around that instead of against it.",
    image: "img/curls.webp",
  },
  {
    title: "Colour by hand",
    body: "Painted, not foiled by default, so tone sits softly and grows out on your schedule.",
    image: "img/golden.webp",
  },
  {
    title: "Leave knowing how",
    body: "We finish with you holding the dryer, so the hair you leave with is hair you can do again.",
    image: "img/field.webp",
  },
];
