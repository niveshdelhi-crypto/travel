import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMarketplaceCountries,
  useMarketplaceSuppliers,
  useTrendingDestinations,
} from "@/hooks/use-marketplace";

export function MegaFooter() {
  const suppliersQuery = useMarketplaceSuppliers();
  const countriesQuery = useMarketplaceCountries();
  const trendingQuery = useTrendingDestinations(14);

  return (
    <footer className="border-t border-white/10 bg-[#050b14]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr_0.95fr_0.98fr_1.02fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#F5B301]/80">
              Marketplace
            </p>
            <p className="mt-4 text-base font-semibold text-[#F8FAFC]">Book my Carz</p>
            <p className="mt-3 text-sm leading-relaxed text-[#94A3B8]">
              Premium rental orchestration spanning verified suppliers, concierge assignment, and
              operations-grade visibility.
            </p>
          </div>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F8FAFC]/55">
              Countries
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              {countriesQuery.isLoading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <li key={`csk-${i}`}>
                    <Skeleton className="h-4 w-28 rounded bg-white/12" />
                  </li>
                ))
              ) : Array.isArray(countriesQuery.data) && countriesQuery.data.length > 0 ? (
                countriesQuery.data.map((c) => (
                  <li key={c.id}>
                    <Link to="/countries/$countrySlug" params={{ countrySlug: c.slug }}>
                      <motion.span whileHover={{ x: 2 }} className="text-[#94A3B8] hover:text-[#F8FAFC]">
                        {c.name}
                      </motion.span>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-xs text-[#64748b]">
                  Geography loading from operations database… connect API to hydrate this column.
                </li>
              )}
            </ul>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F8FAFC]/55">
              Airports · Cities
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              {trendingQuery.isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <li key={`tsk-${i}`}>
                    <Skeleton className="h-4 w-36 rounded bg-white/12" />
                  </li>
                ))
              ) : Array.isArray(trendingQuery.data) && trendingQuery.data.length > 0 ? (
                trendingQuery.data.map((d) => (
                  <li key={d.id}>
                    <Link
                      to={
                        d.kind === "AIRPORT"
                          ? "/car-rental/airport/$slug"
                          : "/car-rental/city/$slug"
                      }
                      params={{ slug: d.slug }}
                    >
                      <motion.span whileHover={{ x: 2 }} className="text-[#94A3B8] hover:text-[#F8FAFC]">
                        {d.kind === "AIRPORT" ? `${d.iata_code ?? "●"} · ` : ""}
                        {d.name}
                      </motion.span>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="text-xs text-[#64748b]">Trending corridors sync after catalog seed.</li>
              )}
            </ul>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F8FAFC]/55">
              Suppliers · Support
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              {suppliersQuery.isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <li key={`ssk-${i}`}>
                    <Skeleton className="h-4 w-28 rounded bg-white/12" />
                  </li>
                ))
              ) : Array.isArray(suppliersQuery.data) && suppliersQuery.data.length > 0 ? (
                suppliersQuery.data.map((s) => (
                  <li key={s.id}>
                    <a className="text-[#94A3B8] hover:text-[#F8FAFC]" href={`#suppliers-${s.slug}`}>
                      {s.name}
                    </a>
                  </li>
                ))
              ) : (
                <li className="text-xs text-[#64748b]">Partners registered in Postgres catalog.</li>
              )}
            </ul>
            <ul className="mt-5 space-y-2 text-xs text-[#94A3B8]">
              <li>
                <a href="mailto:ops@bookmycarz.com" className="hover:text-[#60A5FA]">
                  ops@bookmycarz.com
                </a>
              </li>
              <li>Phone routing via assigned advisor after intake.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F8FAFC]/55">
              Legal · Help
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link className="text-[#94A3B8] hover:text-[#60A5FA]" to="/help-center">
                  Help center
                </Link>
              </li>
              <li>
                <Link className="text-[#94A3B8] hover:text-[#60A5FA]" to="/conditions">
                  Rental conditions
                </Link>
              </li>
              <li>
                <Link className="text-[#94A3B8] hover:text-[#60A5FA]" to="/privacy-policy">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link className="text-[#94A3B8] hover:text-[#60A5FA]" to="/terms-and-conditions">
                  Terms &amp; conditions
                </Link>
              </li>
              <li>
                <Link className="text-[#94A3B8] hover:text-[#60A5FA]" to="/login">
                  Advisor login
                </Link>
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 text-[11px] text-[#64748b] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-balance leading-relaxed">
            © {new Date().getFullYear()} Book my Carz Mobility · Catalog data served from Postgres via{" "}
            <span className="text-[#94A3B8]">GET /marketplace/*</span> routes.
          </p>
          <p className="text-balance text-[#475569]">
            Maps autocomplete requires Google Places JavaScript SDK configuration in deployment.
          </p>
        </div>
      </div>
    </footer>
  );
}
