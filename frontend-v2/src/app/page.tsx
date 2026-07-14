import { HeroSection } from "@/components/landing/HeroSection";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <HeroSection />
      {/* Scrollable sections will go below */}
      <div className="h-[200vh] w-full bg-background relative z-10">
        <div className="container mx-auto px-6 py-32 text-center">
          <h2 className="text-4xl font-semibold mb-6">Scroll to reveal More...</h2>
          <p className="text-muted-foreground text-lg">
            This space is reserved for the GSAP/Framer Motion scroll experience as detailed in the design goals.
          </p>
        </div>
      </div>
    </main>
  );
}
