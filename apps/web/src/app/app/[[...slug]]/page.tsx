import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/server";

type AppCompatPageProps = {
  params: Promise<{
    slug?: string[];
  }>;
};

function legacyAppPathToNextPath(parts: string[] | undefined, role: string): string {
  const [section] = parts ?? [];
  const roleHome = role === "sales_agent" ? "/sales" : "/leads";

  switch (section) {
    case undefined:
    case "":
    case "dashboard":
      return roleHome;
    case "leads":
      return "/leads";
    case "calls":
      return "/calls";
    case "bookings":
      return "/bookings";
    case "payments":
      return "/payments";
    case "team":
      return "/team";
    case "admin":
      return "/admin";
    case "workspace":
    case "sales":
      return "/sales";
    default:
      return roleHome;
  }
}

export default async function LegacyAppCompatPage({ params }: AppCompatPageProps) {
  const user = await requireAuth();
  const { slug } = await params;
  redirect(legacyAppPathToNextPath(slug, user.role) as never);
}
