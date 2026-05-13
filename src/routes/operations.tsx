import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/operations")({
  component: () => <Navigate to="/app" replace />,
});
