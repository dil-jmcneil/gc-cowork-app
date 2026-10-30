import type { CSSProperties } from "react";

/**
 * Refreshed's muted, multi-shade gray rendition of the Diligent brand lens
 * mark — the `tool=diligent_app` variant from the Figma ToolIcon set
 * (PUW-436), exported directly rather than approximated by forcing the red
 * `DiligentLogo` to a single flat `currentColor` tone. Used in place of
 * `DiligentLogo` for `ToolCall` rows (`entities_jurisdictions` /
 * `entities_person`) when the Refreshed theme is active; Current keeps the
 * red branded mark.
 */
export function DiligentToolIconMuted({
  style,
  ...rest
}: {
  style?: CSSProperties;
  "aria-hidden"?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      {...rest}
    >
      <path
        d="M13.4536 7.99212C13.4536 9.83535 12.804 11.354 11.6936 12.4037C11.6808 12.4151 11.6712 12.4271 11.6584 12.4385C10.8324 13.2054 9.75554 13.715 8.50172 13.9099L8.41699 13.822L10.2857 2.87167L10.3561 2.67139C12.269 3.6234 13.4536 5.52362 13.4536 7.99212Z"
        fill="#DEE0E9"
      />
      <path
        d="M10.3566 2.672L2.75 8.41554V13.8036V14.0001H7.33047C7.73598 14.0001 8.12656 13.9686 8.50223 13.91C8.50223 13.9105 10.3566 2.672 10.3566 2.672Z"
        fill="#C3C4CC"
      />
      <path
        d="M10.3566 2.67194L10.3038 2.75173L2.78943 8.45294L2.75 8.41549C2.75 8.41549 2.75 8.41386 2.75 8.41223V2H7.31289C7.62781 2 7.93314 2.01845 8.22887 2.05482H8.24006C8.98713 2.14492 9.67506 2.34303 10.2905 2.63992C10.315 2.65186 10.3566 2.67194 10.3566 2.67194Z"
        fill="#A5A7B3"
      />
    </svg>
  );
}
