import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Navigate, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { authService } from "@/services";
import { onSocketEvent } from "@/services/socket";
import { useAuthStore } from "@/store/auth.store";

export const Route = createFileRoute("/app")({
  component: ProtectedAppLayout,
});

function ProtectedAppLayout() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const storedUser = useAuthStore((state) => state.user);

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authService.me,
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (meQuery.data && meQuery.data.id !== storedUser?.id) {
      setUser(meQuery.data);
    }
  }, [meQuery.data, setUser, storedUser?.id]);

  useEffect(() => {
    if (meQuery.isError) setUser(null);
  }, [meQuery.isError, setUser]);

  useEffect(() => {
    if (!meQuery.data) return undefined;

    const invalidateLeads = () => {
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
    };
    const disposers = [
      onSocketEvent("lead.created", invalidateLeads),
      onSocketEvent("lead.assigned", invalidateLeads),
      onSocketEvent("lead.updated", invalidateLeads),
      onSocketEvent("lead.deleted", invalidateLeads),
      onSocketEvent("lead.note.created", invalidateLeads),
      onSocketEvent("metrics.changed", invalidateLeads),
    ];

    return () => disposers.forEach((dispose) => dispose());
  }, [meQuery.data, queryClient]);

  if (meQuery.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Restoring secure session
        </div>
      </div>
    );
  }

  if (meQuery.isError || !meQuery.data) {
    return <Navigate to="/login" search={{ redirect: location.href }} replace />;
  }

  return <Outlet />;
}
