import { redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth.store";

export function requireAdminRoute() {
  const user = useAuthStore.getState().user;
  if (!user) {
    throw redirect({ to: "/login", search: { redirect: window.location.pathname } });
  }
  if (user.role !== "admin") {
    throw redirect({ to: "/app/workspace" });
  }
}

export function requirePaymentConsoleRoute() {
  const user = useAuthStore.getState().user;
  if (!user) {
    throw redirect({ to: "/login", search: { redirect: window.location.pathname } });
  }
  if (user.role !== "admin" && user.role !== "finance_admin") {
    throw redirect({ to: "/app/workspace" });
  }
}

export function requireBookingOperationsRoute() {
  const user = useAuthStore.getState().user;
  if (!user) {
    throw redirect({ to: "/login", search: { redirect: window.location.pathname } });
  }
  if (
    user.role !== "admin" &&
    user.role !== "finance_admin" &&
    user.role !== "operations_manager"
  ) {
    throw redirect({ to: "/app/workspace" });
  }
}

export function requireAgentRoute() {
  const user = useAuthStore.getState().user;
  if (!user) {
    throw redirect({ to: "/login", search: { redirect: window.location.pathname } });
  }
}
