import { Booking } from "@/components/Booking";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Lookbook } from "@/components/Lookbook";
import { Manifesto } from "@/components/Manifesto";
import { Nav } from "@/components/Nav";
import { Services } from "@/components/Services";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Visit } from "@/components/Visit";

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <div className="grain" aria-hidden />
      <Nav />
      <main>
        <Hero />
        <Manifesto />
        <Services />
        <Lookbook />
        <Visit />
        <Booking />
      </main>
      <Footer />
    </>
  );
}
