import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app/app-shell";
import { Badge, EmptyState, Panel } from "@/components/app/primitives";
import { Building2, Trash2, Plus, Pencil } from "lucide-react";
import {
  marketplaceAdminService,
  marketplaceService,
} from "@/services";
import type { MarketplaceSupplier } from "@/types/marketplace";
import { marketplaceQueryKeys } from "@/lib/marketing/query-keys";
import { useAuthStore } from "@/store/auth.store";

export const Route = createFileRoute("/app/providers")({
  component: ProvidersPage,
});

function ProvidersPage() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();

  const suppliersQuery = useQuery({
    queryKey: marketplaceQueryKeys.suppliers(),
    queryFn: () => marketplaceService.suppliers(),
  });

  const [editing, setEditing] = useState<MarketplaceSupplier | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [website, setWebsite] = useState("");
  const [logo, setLogo] = useState("");
  const [sortOrder, setSortOrder] = useState("100");

  const resetForm = () => {
    setEditing(null);
    setName("");
    setSlug("");
    setWebsite("");
    setLogo("");
    setSortOrder("100");
  };

  const createMutation = useMutation({
    mutationFn: () =>
      marketplaceAdminService.createSupplier({
        name: name.trim(),
        slug: slug.trim() || undefined,
        website_url: website.trim() || undefined,
        logo_url: logo.trim() || undefined,
        sort_order: Number.parseInt(sortOrder, 10) || 100,
      }),
    onSuccess: async () => {
      resetForm();
      await queryClient.invalidateQueries({ queryKey: marketplaceQueryKeys.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error("No supplier selected");
      return marketplaceAdminService.updateSupplier(editing.id, {
        name: name.trim(),
        slug: slug.trim(),
        website_url: website.trim() || null,
        logo_url: logo.trim() || null,
        sort_order: Number.parseInt(sortOrder, 10) || 0,
      });
    },
    onSuccess: async () => {
      resetForm();
      await queryClient.invalidateQueries({ queryKey: marketplaceQueryKeys.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => marketplaceAdminService.deleteSupplier(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: marketplaceQueryKeys.all });
    },
  });

  const startEdit = (s: MarketplaceSupplier) => {
    setEditing(s);
    setName(s.name);
    setSlug(s.slug);
    setWebsite(s.website_url ?? "");
    setLogo(s.logo_url ?? "");
    setSortOrder(String(s.sort_order ?? 100));
  };

  const submit = () => {
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  };

  const busy = createMutation.isPending || updateMutation.isPending;

  return (
    <AppShell title="Providers">
      <div className="space-y-8 p-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Partner marketplace</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Suppliers listed here power the public logo rail on the home page. Changes apply immediately after
            save (TanStack cache + Postgres).
          </p>
          {!isAdmin ? (
            <p className="mt-2 text-sm text-amber-200/90">
              Only administrators can create or edit partners. You can still review the live catalog below.
            </p>
          ) : null}
        </div>

        {isAdmin ? (
          <Panel className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground">
                {editing ? "Edit partner" : "Add partner"}
              </h3>
              {editing ? (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={resetForm}
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-medium text-muted-foreground">
                Display name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 flex h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground shadow-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. National Car Rental"
                />
              </label>
              <label className="block text-xs font-medium text-muted-foreground">
                Slug (optional — auto-generated from name)
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="mt-1.5 flex h-11 w-full rounded-lg border border-border bg-surface px-3 font-mono text-sm text-foreground shadow-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="national"
                />
              </label>
              <label className="block text-xs font-medium text-muted-foreground">
                Website URL
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="mt-1.5 flex h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground shadow-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="https://www.example.com"
                />
              </label>
              <label className="block text-xs font-medium text-muted-foreground">
                Logo URL (hosted path or full URL)
                <input
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="mt-1.5 flex h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground shadow-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="/suppliers/national.svg"
                />
              </label>
              <label className="block text-xs font-medium text-muted-foreground sm:col-span-2">
                Sort order (lower appears first in API lists)
                <input
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="mt-1.5 flex h-11 w-full max-w-xs rounded-lg border border-border bg-surface px-3 text-sm text-foreground shadow-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || !name.trim()}
                onClick={() => submit()}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {editing ? "Save changes" : "Add partner"}
              </button>
            </div>
          </Panel>
        ) : null}

        <Panel className="overflow-hidden p-0">
          <div className="border-b border-border px-6 py-4">
            <h3 className="text-sm font-semibold">
              Catalog ({Array.isArray(suppliersQuery.data) ? suppliersQuery.data.length : "…"})
            </h3>
          </div>
          {suppliersQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading suppliers…</div>
          ) : suppliersQuery.isError ? (
            <div className="p-6">
              <EmptyState
                icon={Building2}
                title="Could not load suppliers"
                description="Confirm the API is running and you are authenticated."
              />
            </div>
          ) : !Array.isArray(suppliersQuery.data) || suppliersQuery.data.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Building2}
                title="No suppliers yet"
                description="Seed the catalog or add partners above (admin)."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-border bg-surface-2/60 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Partner</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Site</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliersQuery.data.map((s) => (
                    <tr key={s.id} className="border-b border-border/60 hover:bg-surface-2/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {s.logo_url ? (
                            <img
                              src={s.logo_url}
                              alt=""
                              className="h-9 w-[100px] object-contain"
                            />
                          ) : (
                            <Badge tone="neutral">{s.name.slice(0, 2).toUpperCase()}</Badge>
                          )}
                          <span className="font-medium text-foreground">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.slug}</td>
                      <td className="px-4 py-3">{s.sort_order}</td>
                      <td className="px-4 py-3">
                        {s.website_url ? (
                          <a
                            href={s.website_url}
                            className="text-primary hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isAdmin ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-2"
                              onClick={() => startEdit(s)}
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
                              disabled={deleteMutation.isPending}
                              onClick={() => {
                                if (window.confirm(`Delete ${s.name} from the catalog?`)) {
                                  deleteMutation.mutate(s.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">View only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <p className="text-center text-xs text-muted-foreground">
          Public site:{" "}
          <Link to="/" className="text-primary hover:underline">
            Home page partner strip
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
