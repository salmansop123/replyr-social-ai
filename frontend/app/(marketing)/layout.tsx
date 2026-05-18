import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mesh-page mesh-animated noise-overlay min-h-screen bg-background text-foreground antialiased">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
