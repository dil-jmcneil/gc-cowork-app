import { Chip, Stack } from "@mui/material";

import type { InsightTag } from "@/insights/insight";

/** An insight's metadata tags. The type tag is filled so it reads first. */
export function InsightTags({ tags }: { tags: InsightTag[] }) {
  const ordered = [...tags].sort((a, b) => Number(b.kind === "type") - Number(a.kind === "type"));
  return (
    <Stack
      component="ul"
      direction="row"
      gap={0.75}
      flexWrap="wrap"
      aria-label="Tags"
      sx={{ listStyle: "none", m: 0, p: 0 }}
    >
      {ordered.map((tag) => (
        <li key={`${tag.kind}-${tag.label}`}>
          <Chip label={tag.label} size="xsmall" variant={tag.kind === "type" ? "filled" : "outlined"} />
        </li>
      ))}
    </Stack>
  );
}
