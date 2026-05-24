import { createFileRoute } from "@tanstack/react-router";
import { LegalDoc } from "@/components/site/LegalDoc";

export const Route = createFileRoute("/legal/cookies")({
  head: () => ({ meta: [{ title: "Cookie Policy — Book my Carz" }] }),
  component: () => (
    <LegalDoc
      title="Cookie Policy"
      updated="January 2026"
      sections={[
        { id: "what", title: "What are cookies", body: "Small text files stored on your device that help us remember your preferences and improve your experience." },
        { id: "types", title: "Types we use", body: "Essential (always on), Analytics (optional), Marketing (optional)." },
        { id: "manage", title: "Managing cookies", body: "You can update your preferences anytime via the cookie banner or your browser settings." },
      ]}
    />
  ),
});
