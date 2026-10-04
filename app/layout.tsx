import type { Metadata, Viewport } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import "./globals.css";

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Display face. The 900 cut is the wordmark (a fat Didone suits a fashion-led
// salon, and its heavy stems give the columns something to grow out of); the
// 400 roman and italic set the headline.
const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Velour | Hair Atelier",
  description:
    "Precision cuts, lived-in colour and slow, careful care. Book a chair at Velour hair atelier.",
};

export const viewport: Viewport = {
  themeColor: "#f1f1ee",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
