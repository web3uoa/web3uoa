import { Hero } from "@/components/hero";
import { About } from "@/components/about";
import { Events } from "@/components/events";
import { Sponsors } from "@/components/sponsors";

export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <Events />
      <Sponsors />
    </main>
  );
}
