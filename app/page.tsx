import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { RoleCards } from "@/components/landing/RoleCards";

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-ink-900">
      <main>
        <Hero />
        <HowItWorks />
        <RoleCards />
      </main>
      <Footer />
    </div>
  );
}
