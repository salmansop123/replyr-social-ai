import type { Metadata } from "next";
import { AnimatedChart } from "@/components/marketing/AnimatedChart";
import { CTA } from "@/components/marketing/CTA";
import { FAQ } from "@/components/marketing/FAQ";
import { Features } from "@/components/marketing/Features";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { LiveDemo } from "@/components/marketing/LiveDemo";
import { PricingSection } from "@/components/marketing/PricingSection";
import { Stats } from "@/components/marketing/Stats";
import { Testimonials } from "@/components/marketing/Testimonials";

export const metadata: Metadata = {
  title: "Replyr AI — Human-grade Reply Management",
  description:
    "Replyr AI reads your posts, understands your products, and replies in your tone 24/7 across WhatsApp and Facebook — with human takeover when you need it.",

  icons: {
    icon: "../marketing/favicon.ico",
  },
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Stats />
      <AnimatedChart />
      <HowItWorks />
      <LiveDemo />
      <Features />
      <PricingSection />
      <Testimonials />
      <FAQ />
      <CTA />
    </>
  );
}
