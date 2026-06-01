import { getServerMarketplaceSuppliers } from "@/lib/marketplace/server";
import { LandingPage } from "@/modules/landing/page";

export default async function Home() {
  const suppliers = await getServerMarketplaceSuppliers();
  return <LandingPage suppliers={suppliers} />;
}
