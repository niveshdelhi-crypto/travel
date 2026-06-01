import { redirect } from "next/navigation";
import { getLegacyCrmUrl } from "@/lib/crm-url";

type AppCompatPageProps = {
  params: Promise<{
    slug?: string[];
  }>;
};

export default async function LegacyAppCompatPage({ params }: AppCompatPageProps) {
  const { slug } = await params;
  const section = slug?.length ? slug.join("/") : "";
  const legacyPath = section ? `/app/${section}` : "/app";
  redirect(getLegacyCrmUrl(legacyPath) as never);
}
