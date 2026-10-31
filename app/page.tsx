import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Navbar } from "@/components/landing/Navbar";
import { RoleCards } from "@/components/landing/RoleCards";

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-ink-900">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <RoleCards />
      </main>
      <Footer />
    </div>
  );
}
