import { cn } from "@/lib/utils";

type Variant = "fern" | "sprig" | "leaf";

/**
 * Decorative field-guide botanical line-art. Purely decorative: non-interactive
 * and hidden from assistive tech. Color follows `currentColor` (set via a
 * text-* utility on `className`); position/size via `className` too.
 */
export function BotanicalAccent({
  variant = "fern",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 120 200"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("pointer-events-none select-none", className)}
    >
      {variant === "fern" && (
        <g>
          <path d="M60 196 C60 150 60 90 60 20" />
          {Array.from({ length: 9 }).map((_, i) => {
            const y = 176 - i * 18;
            const len = 40 - i * 3.4;
            return (
              <g key={i}>
                <path d={`M60 ${y} C${60 - len * 0.5} ${y - 4} ${60 - len} ${y - 14} ${60 - len} ${y - 22}`} />
                <path d={`M60 ${y} C${60 + len * 0.5} ${y - 4} ${60 + len} ${y - 14} ${60 + len} ${y - 22}`} />
              </g>
            );
          })}
        </g>
      )}
      {variant === "sprig" && (
        <g>
          <path d="M60 196 C60 150 66 90 60 24" />
          {Array.from({ length: 5 }).map((_, i) => {
            const y = 168 - i * 30;
            const dir = i % 2 === 0 ? 1 : -1;
            return (
              <g key={i}>
                <path d={`M60 ${y} q${dir * 26} -6 ${dir * 34} -26`} />
                <ellipse
                  cx={60 + dir * 40}
                  cy={y - 30}
                  rx="9"
                  ry="16"
                  transform={`rotate(${dir * 35} ${60 + dir * 40} ${y - 30})`}
                />
              </g>
            );
          })}
        </g>
      )}
      {variant === "leaf" && (
        <g>
          <path d="M60 190 C10 140 10 60 60 12 C110 60 110 140 60 190 Z" />
          <path d="M60 190 L60 12" />
          {Array.from({ length: 5 }).map((_, i) => {
            const y = 60 + i * 26;
            const w = 30 - i * 3;
            return (
              <g key={i}>
                <path d={`M60 ${y} q${-w} ${w * 0.5} ${-w} ${w}`} />
                <path d={`M60 ${y} q${w} ${w * 0.5} ${w} ${w}`} />
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
}
