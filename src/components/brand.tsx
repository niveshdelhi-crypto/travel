import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";

export function Brand({ to = "/" }: { to?: string }) {
  return <BrandLogo to={to} size="nav" />;
}
