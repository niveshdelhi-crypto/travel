import { redirect } from "next/navigation";

type AppCompatPageProps = {
  params: Promise<{
    slug?: string[];
  }>;
};

function legacyAppPathToNextPath(parts: string[] | undefined): string {
  const [section] = parts ?? [];

  switch (section) {
    case undefined:
    case "":
    case "dashboard":
      return "/dashboard";
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
      return "/dashboard";
  }
}

export default async function LegacyAppCompatPage({ params }: AppCompatPageProps) {
  const { slug } = await params;
  redirect(legacyAppPathToNextPath(slug) as never);
}
