import { lazy, Suspense, type ComponentProps } from "react";
import type { PublicFormRenderer as PublicFormRendererComponent } from "./public-form-renderer";

const PublicFormRenderer = lazy(() =>
  import("./public-form-renderer").then((module) => ({
    default: module.PublicFormRenderer,
  })),
);

type LazyPublicFormRendererProps = ComponentProps<typeof PublicFormRendererComponent>;

export function LazyPublicFormRenderer(props: LazyPublicFormRendererProps) {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-80 animate-pulse rounded-md border border-border/60 bg-muted/20"
          aria-busy="true"
          aria-label="Loading form"
        />
      }
    >
      <PublicFormRenderer {...props} />
    </Suspense>
  );
}
