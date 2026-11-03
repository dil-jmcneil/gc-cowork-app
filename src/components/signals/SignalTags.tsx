import { Chip, Stack } from "@mui/material";

import type { SignalTag } from "@/signals/signal";
import { SPACE } from "@/lib/layout";

/** A signal's metadata tags. The type tag is filled so it reads first. */
export function SignalTags({ tags }: { tags: SignalTag[] }) {
  const ordered = [...tags].sort((a, b) => Number(b.kind === "type") - Number(a.kind === "type"));
  return (
    <Stack
      component="ul"
      direction="row"
      gap={SPACE.item}
      flexWrap="wrap"
      aria-label="Tags"
      sx={{ listStyle: "none", m: 0, p: 0 }}
    >
      {ordered.map((tag) => (
        <li key={`${tag.kind}-${tag.label}`}>
          <Chip label={tag.label} size="small" variant={tag.kind === "type" ? "filled" : "outlined"} />
        </li>
      ))}
    </Stack>
  );
}
