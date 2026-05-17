import { AuthProvider } from "@/components/auth/auth-provider";
import { QueryProvider } from "@/components/app/query-provider";
import { getServerSession } from "@/lib/auth/server";
import { inter } from "@/lib/fonts";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FleetNexus | Compare Car Rentals Worldwide",
  description:
    "Compare 800+ car rental suppliers across 30,000+ locations. Best price guarantee, secure booking, and 24/7 support.",
  openGraph: {
    title: "FleetNexus | Compare Car Rentals Worldwide",
    description:
      "Compare 800+ rental suppliers in 190+ countries. Best price, free cancellation, no hidden fees.",
    type: "website",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerSession();

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&f[]=general-sans@400,500,600,700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          :root {
            --font-satoshi: "Satoshi", var(--font-inter), ui-sans-serif, system-ui, sans-serif;
            --font-general-sans: "General Sans", var(--font-inter), ui-sans-serif, system-ui, sans-serif;
          }
        `}</style>
      </head>
      <body className="font-[family-name:var(--font-general-sans)] antialiased">
        <QueryProvider>
          <AuthProvider initialUser={user}>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
