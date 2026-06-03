import { GoogleAdsTag } from "@/components/analytics/google-ads";
import { MicrosoftClarityTag } from "@/components/analytics/microsoft-clarity";
import { AuthProvider } from "@/components/auth/auth-provider";
import { QueryProvider } from "@/components/app/query-provider";
import { getServerSession } from "@/lib/auth/server";
import { inter } from "@/lib/fonts";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MarkleTravelBooking | Compare Car Rentals Worldwide",
    template: "%s | MarkleTravelBooking",
  },
  applicationName: "MarkleTravelBooking",
  description:
    "Compare 800+ car rental suppliers across 30,000+ locations. Best price guarantee, secure booking, and 24/7 support.",
  icons: {
    icon: "/brand/travel.png",
    apple: "/brand/travel.png",
  },
  openGraph: {
    title: "MarkleTravelBooking | Compare Car Rentals Worldwide",
    description:
      "Compare 800+ rental suppliers in 190+ countries. Best price, free cancellation, no hidden fees.",
    type: "website",
    images: [{ url: "/brand/travel.png", alt: "MarkleTravelBooking — Explore. Book. Discover." }],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerSession();

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <GoogleAdsTag />
        <MicrosoftClarityTag />
      </head>
      <body
        className="font-[family-name:var(--font-general-sans)] antialiased"
        suppressHydrationWarning
      >
        <QueryProvider>
          <AuthProvider initialUser={user}>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
