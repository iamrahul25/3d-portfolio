import { ViewTransition } from "react";

// Route changes run as React transitions, so this cross-fades/slides whole pages via the
// browser View Transitions API (no-op where unsupported). Shared thumbnails morph on top.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      {children}
    </ViewTransition>
  );
}
