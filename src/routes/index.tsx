import { createFileRoute } from "@tanstack/react-router";

import { FleetNexusHomePage } from "@/components/marketing/home-page";

export const Route = createFileRoute("/")({
  component: FleetNexusHomePage,
});
