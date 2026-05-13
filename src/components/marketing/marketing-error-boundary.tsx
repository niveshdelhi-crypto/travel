import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  sectionName?: string;
  fallbackTitle?: string;
  children: ReactNode;
};

type State = { hasError: boolean; message?: string };

export class MarketingSectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[marketing-section]", this.props.sectionName, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-3xl rounded-xl border border-red-400/25 bg-red-950/35 px-4 py-10 text-center text-sm text-[#fecaca]">
          <p className="font-semibold text-[#fca5a5]">
            {this.props.fallbackTitle ?? "We could not render this module."}
          </p>
          <p className="mt-2 text-[#fca5a5]/80">
            Refresh the page in a moment, or navigate home and try again.
          </p>
          {process.env.NODE_ENV === "development" && this.state.message ? (
            <p className="mt-3 font-mono text-xs text-[#fca5a5]/60">{this.state.message}</p>
          ) : null}
        </div>
      );
    }
    return this.props.children;
  }
}
