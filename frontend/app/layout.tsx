import type { Metadata } from "next";
import localFont from "next/font/local";
import { Space_Grotesk } from "next/font/google";
import { AuthAndClerkProvider } from "@/components/auth/AuthAndClerkProvider";
import { Providers } from "./providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Replyr AI — WhatsApp & Facebook messaging",
  description:
    "Replyr AI unifies WhatsApp Business and Facebook Pages: human-grade AI replies, smart delays, and operator takeover across channels.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} min-h-screen antialiased`}
      >
        <AuthAndClerkProvider>
          <Providers>{children}</Providers>
        </AuthAndClerkProvider>
      </body>
    </html>
  );
}
