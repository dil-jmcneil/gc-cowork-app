import type { CSSProperties } from "react";

/**
 * Diligent brand lens ("D" aperture) mark. Shared by `ToolCall` (as the
 * branded icon for calls into core internal Diligent systems — Entities) and
 * the Refreshed idle indicator at the bottom of the thread (a static "ready
 * for your next message" mark, as opposed to `BrandSpinner`'s animated
 * facet-wave, which only shows while something is actively running).
 */
export function DiligentLogo({
  size,
  style,
  ...rest
}: {
  /** Convenience square sizing; omit and pass `style` directly when used as
   * a `ToolCall` icon, which sizes itself via its own wrapper. */
  size?: number;
  style?: CSSProperties;
  "aria-hidden"?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={size !== undefined ? { width: size, height: size, ...style } : style}
      {...rest}
    >
      {/* Original artwork is drawn in a 114×114 box (see path data below);
          scale it down to fit the 28×28 viewBox without touching the path
          coordinates themselves, so the mark is pixel-identical, just on a
          smaller native grid. */}
      <g transform="scale(0.2456140351) translate(20.9131 11.3)">
        <path
          d="M72.1738 39.9475C72.1738 52.2357 67.7939 62.3601 60.3059 69.3581C60.2197 69.4341 60.155 69.5137 60.0688 69.5897C54.4995 74.7026 47.2379 78.1003 38.7835 79.3993L38.2122 78.8131L50.813 5.81116L51.2873 4.47595C64.1864 10.8227 72.1738 23.4908 72.1738 39.9475Z"
          fill="#EE312E"
        />
        <path
          d="M51.291 4.47961L0 42.7699V78.6901V80H30.886C33.6203 80 36.254 79.7901 38.7871 79.3993C38.7871 79.403 51.291 4.47961 51.291 4.47961Z"
          fill="#D3222A"
        />
        <path
          d="M51.291 4.47962L50.9353 5.01153L0.265887 43.0196L0 42.7699C0 42.7699 0 42.7591 0 42.7482V0H30.7674C32.8909 0 34.9497 0.123027 36.9439 0.365462H37.0193C42.0568 0.966122 46.6955 2.28685 50.8455 4.26614C51.0107 4.34574 51.291 4.47962 51.291 4.47962Z"
          fill="#AF292E"
        />
      </g>
    </svg>
  );
}
