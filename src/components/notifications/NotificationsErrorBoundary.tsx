"use client";

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export default class NotificationsErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-white/10 bg-[#1a1835] px-6 py-16 text-center">
          <p className="text-sm font-medium text-white">
            Could not load notifications
          </p>
          <p className="mt-2 text-xs text-muted">
            Please refresh the page and try again.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
