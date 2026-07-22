import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <ThemeToggle />
      <HeroSection />
      <FeaturesSection />
    </main>
  );
}
