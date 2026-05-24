import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormEvent, useEffect, useState } from "react";
import { Loader2, LockKeyhole, LogIn } from "lucide-react";
import { authService } from "@/services";
import { useAuthStore } from "@/store/auth.store";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/app",
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState("admin@bookmycarz.com");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState<string | null>(null);
  const { redirect } = Route.useSearch();

  const sessionQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authService.me,
    retry: false,
    staleTime: 60_000,
  });

  const loginMutation = useMutation({
    mutationFn: () => authService.signIn(email, password),
    onSuccess: async (user) => {
      setUser(user);
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      const home = user.role === "admin" ? "/app" : "/app/workspace";
      const target = redirect.startsWith("/") ? redirect : home;
      const safeTarget =
        user.role === "sales_agent" &&
        (target.startsWith("/app/leads") ||
          target.startsWith("/app/bookings") ||
          target.startsWith("/app/payments") ||
          target.startsWith("/app/analytics") ||
          target.startsWith("/app/admin"))
          ? home
          : target;
      await navigate({ to: safeTarget, replace: true });
    },
    onError: (unknownError) => {
      const apiError = unknownError as { message?: string };
      setError(apiError.message ?? "Unable to sign in. Check your credentials and try again.");
    },
  });

  useEffect(() => {
    if (sessionQuery.data) setUser(sessionQuery.data);
  }, [sessionQuery.data, setUser]);

  if (sessionQuery.data) return <Navigate to={redirect.startsWith("/") ? redirect : "/app"} replace />;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    loginMutation.mutate();
  };

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[#070b12] px-4 py-8 text-white sm:px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-xl border border-white/12 bg-[#0b1220] p-5 shadow-2xl shadow-black/45 sm:p-6"
      >
        <div className="grid h-12 w-12 place-items-center rounded-md bg-[#f4d587] text-[#070b12]">
          <LockKeyhole className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Book my Carz sign in</h1>
        <p className="mt-2 text-sm leading-6 text-white/60">
          Use your operations account to access the CRM dashboard.
        </p>
        <p className="mt-1 text-xs text-white/45">
          Demo admin: <span className="text-white/65">admin@bookmycarz.com</span> / Admin@123
        </p>

        <label className="mt-6 block text-sm font-medium text-white/74">
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-white/10 bg-white/[0.06] px-3 text-sm text-white outline-none transition focus:border-[#f4d587]/70 focus:ring-2 focus:ring-[#f4d587]/15"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-white/74">
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-white/10 bg-white/[0.06] px-3 text-sm text-white outline-none transition focus:border-[#f4d587]/70 focus:ring-2 focus:ring-[#f4d587]/15"
          />
        </label>

        {error ? (
          <div className="mt-4 rounded-md border border-red-300/25 bg-red-500/10 px-3 py-2 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#f4d587] px-4 text-sm font-bold text-[#070b12] transition hover:bg-[#ffe6a3] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loginMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          Sign in
        </button>
      </form>
    </main>
  );
}
