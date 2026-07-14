import { cn } from "@/features/landscape-site/lib/utils";

type Variant = "hills" | "leaf";

/**
 * Organic, field-guide-style transition between two stacked sections.
 *
 * Colors are given explicitly as CSS color strings so they match design tokens
 * seamlessly, e.g. bgColor="hsl(var(--foreground))".
 *
 * Modes:
 * - In-flow (default): render BETWEEN two sections. `bgColor` = the band ABOVE,
 *   `fillColor` = the band BELOW. The wave is drawn in the lower color rising
 *   into the upper band.
 * - Overlay (`overlay`): absolutely pinned to the bottom of a section that has a
 *   background image; only `fillColor` (next band's color) is used. Parent must
 *   be `relative`.
 *
 * Purely decorative: non-interactive and hidden from assistive tech.
 */
export function SectionDivider({
  variant = "hills",
  overlay = false,
  flip = false,
  bgColor,
  fillColor,
  className,
  heightClassName = "h-10 md:h-16 lg:h-20",
}: {
  variant?: Variant;
  overlay?: boolean;
  flip?: boolean;
  bgColor?: string;
  fillColor: string;
  className?: string;
  heightClassName?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none w-full leading-none",
        overlay ? "absolute inset-x-0 bottom-0 z-10" : "relative",
        className,
      )}
      style={overlay ? undefined : { backgroundColor: bgColor }}
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className={cn("block w-full", heightClassName, flip && "rotate-180")}
        style={{ color: fillColor, fill: "currentColor" }}
      >
        {variant === "hills" ? (
          <>
            <path
              d="M0,72 C220,32 430,104 720,80 C1000,58 1230,16 1440,64 L1440,120 L0,120 Z"
              opacity="0.45"
            />
            <path d="M0,96 C260,60 480,116 720,100 C980,82 1220,52 1440,92 L1440,120 L0,120 Z" />
          </>
        ) : (
          <path d="M0,120 L0,70 C60,70 60,30 120,30 C180,30 180,70 240,70 C300,70 300,30 360,30 C420,30 420,70 480,70 C540,70 540,30 600,30 C660,30 660,70 720,70 C780,70 780,30 840,30 C900,30 900,70 960,70 C1020,70 1020,30 1080,30 C1140,30 1140,70 1200,70 C1260,70 1260,30 1320,30 C1380,30 1380,70 1440,70 L1440,120 Z" />
        )}
      </svg>
    </div>
  );
}
