import { useEffect } from "react";

/**
 * Lightweight document metadata for SPA marketing routes without SSR.
 */
export function useDocumentMeta(title: string, description?: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title.trim();
    let metaDesc: HTMLMetaElement | null = null;
    if (description?.trim()) {
      metaDesc = document.querySelector('meta[name="description"]');
      const previousDesc = metaDesc?.getAttribute("content") ?? undefined;
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", description.trim());
      return () => {
        document.title = previousTitle;
        if (metaDesc && previousDesc !== undefined) metaDesc.setAttribute("content", previousDesc);
      };
    }
    return () => {
      document.title = previousTitle;
    };
  }, [title, description]);
}
