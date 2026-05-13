import type { Metadata } from "next";
import localFont from "next/font/local";
import { AuthAndClerkProvider } from "@/components/auth/AuthAndClerkProvider";
import { Providers } from "./providers";
import "./globals.css";

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
  title: "Replyr AI — WhatsApp automation",
  description:
    "Replyr AI is a premium WhatsApp Business automation platform: human-grade AI replies, smart delays, and operator takeover.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}>
        <AuthAndClerkProvider>
          <Providers>{children}</Providers>
        </AuthAndClerkProvider>
      </body>
    </html>
  );
}
