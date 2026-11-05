import ArrowLeftIcon from "@diligentcorp/atlas-react-bundle/icons/ArrowLeft";
import OpenFileIcon from "@diligentcorp/atlas-react-bundle/icons/OpenFile";
import { Box, Button, Card, CardContent, Container, Stack, Typography, useTheme } from "@mui/material";
import type { ReactNode } from "react";

import { SPACE } from "@/lib/layout";
import { formatShortDate } from "@/workstreams/taskStatus";
import type { HistoryFile } from "@/workstreams/thread";

/**
 * A file opened from the workstream, shown in the main panel (Cowork's chat
 * stays open beside it). Back returns to the workstream.
 */
export function FileView({
  file,
  taskName,
  backLabel,
  onBack,
}: {
  file: HistoryFile;
  /** The task the file belongs to. */
  taskName: string;
  backLabel: string;
  onBack: () => void;
}) {
  const { tokens } = useTheme();
  const muted = tokens.semantic.color.type.muted.value;
  const meta = [`Added by ${file.addedBy}`, formatShortDate(file.sentAt), taskName, file.note]
    .filter(Boolean)
    .join(" · ");

  return (
    <Container maxWidth="lg" sx={{ py: SPACE.section }}>
      <Stack gap={SPACE.block}>
        <Button
          variant="text"
          size="small"
          startIcon={<ArrowLeftIcon aria-hidden />}
          onClick={onBack}
          sx={{ alignSelf: "flex-start" }}
        >
          {backLabel}
        </Button>

        <Stack direction="row" gap={SPACE.group} alignItems="flex-start">
          <OpenFileIcon aria-hidden style={{ width: 28, height: 28, flexShrink: 0, color: muted, marginTop: 2 }} />
          <Stack gap={SPACE.pair} sx={{ minWidth: 0 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
              {file.name}
            </Typography>
            <Typography variant="textMd" sx={{ color: muted }}>
              {meta}
            </Typography>
          </Stack>
        </Stack>

        <Card variant="outlined" sx={{ p: 0 }}>
          <CardContent sx={{ p: SPACE.section, "&:last-child": { pb: SPACE.section } }}>
            {file.body ? (
              <Document body={file.body} />
            ) : (
              <Typography variant="body1" sx={{ color: muted }}>
                There's no preview for this file in the prototype.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}

/** Renders a file's text: blank lines split blocks, "## " starts a heading, "- " lines are bullets. */
function Document({ body }: { body: string }) {
  const { tokens } = useTheme();
  const blocks = body.split(/\n\s*\n/);
  return (
    <Stack gap={SPACE.block} sx={{ maxWidth: 760 }}>
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (block.startsWith("## ")) {
          return (
            <Stack key={i} gap={SPACE.item}>
              <Typography variant="h5" component="h2" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
                {lines[0].slice(3)}
              </Typography>
              <Lines lines={lines.slice(1)} />
            </Stack>
          );
        }
        return <Lines key={i} lines={lines} />;
      })}
    </Stack>
  );
}

function Lines({ lines }: { lines: string[] }): ReactNode {
  if (!lines.length) return null;
  if (lines.every((l) => l.startsWith("- "))) {
    return (
      <Box component="ul" sx={{ m: 0, pl: SPACE.block }}>
        {lines.map((l, i) => (
          <Typography component="li" variant="body1" key={i}>
            {l.slice(2)}
          </Typography>
        ))}
      </Box>
    );
  }
  return (
    <Stack>
      {lines.map((l, i) => (
        <Typography variant="body1" key={i}>
          {l}
        </Typography>
      ))}
    </Stack>
  );
}
