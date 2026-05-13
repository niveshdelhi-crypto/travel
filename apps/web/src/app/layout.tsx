import { AuthProvider } from "@/components/auth/auth-provider";
import { QueryProvider } from "@/components/app/query-provider";
import { getServerSession } from "@/lib/auth/server";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FleetNexus | Premium Vehicle Rentals Backed by Real Experts",
  description:
    "Concierge-assisted vehicle rentals with fast response, verified partners, and nationwide operations support.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerSession();

  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <AuthProvider initialUser={user}>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
