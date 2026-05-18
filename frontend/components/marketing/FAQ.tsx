"use client";

import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs: { q: string; a: string }[] = [
  {
    q: "Will customers know they're talking to an AI?",
    a: "No. Replyr AI is specifically trained to write short, natural, conversational replies the same way a real employee would. Replies are 1–3 sentences, match your brand tone, and never use robotic phrases.",
  },
  {
    q: "What happens if the AI doesn't know the answer?",
    a: "The AI is trained to gracefully say it will follow up personally, rather than guessing or making things up. You can also set escalation keywords that pause AI replies for human review.",
  },
  {
    q: "Is WhatsApp Business API hard to set up?",
    a: "We guide you through the entire setup. You'll need a Meta Business account and a WhatsApp Business number. Most users complete this in under 15 minutes with our step-by-step guide.",
  },
  {
    q: "Can I reply manually if needed?",
    a: "Yes. The Human Takeover feature lets you pause the AI on any conversation and type directly. The AI resumes when you're ready.",
  },
  {
    q: "What languages does it support?",
    a: "40+ languages including Arabic, Urdu, English, Spanish, French, Turkish, Hindi, and more. Auto-detect mode replies in whatever language the customer writes in.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All messages are encrypted in transit and at rest. We never use your business data to train AI for other customers. Your data stays isolated to your account only.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. Cancel from the billing dashboard with one click. Your account stays active until the end of the billing period.",
  },
  {
    q: "Do you offer a free trial?",
    a: "Yes — 14 days free, no credit card required. Full access to all Professional plan features during the trial.",
  },
];

export function FAQ() {
  return (
    <section className="relative section-tint-blue py-20 sm:py-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <ScrollReveal>
          <h2 className="font-heading text-center text-3xl font-bold text-slate-900 sm:text-4xl">Common questions</h2>
        </ScrollReveal>
        <ScrollReveal delayMs={80} className="mt-10 rounded-2xl glass-card-glow p-2 sm:p-4">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((item, i) => (
              <AccordionItem key={item.q} value={`item-${i}`}>
                <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollReveal>
      </div>
    </section>
  );
}
