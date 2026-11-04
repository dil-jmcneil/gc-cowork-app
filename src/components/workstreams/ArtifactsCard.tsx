import OpenFileIcon from "@diligentcorp/atlas-react-bundle/icons/OpenFile";
import { Stack, Typography, useTheme } from "@mui/material";

import { SPACE } from "@/lib/layout";
import { formatShortDate } from "@/workstreams/taskStatus";
import { newestFirst, type HistoryFile } from "@/workstreams/thread";
import type { WorkstreamTask } from "@/workstreams/workstream";

import { SectionCard } from "./SectionCard";

/** Every file Cowork or a person created or uploaded on the workstream's tasks, newest first. */
export function ArtifactsCard({ tasks }: { tasks: WorkstreamTask[] }) {
  const { tokens } = useTheme();
  const muted = tokens.semantic.color.type.muted.value;
  const files = newestFirst(
    tasks.flatMap((task) =>
      task.history.filter((e): e is HistoryFile => e.kind === "file").map((file) => ({ file, task })),
    ),
    (item) => item.file.sentAt,
  );

  return (
    <SectionCard title="Artifacts">
      {files.length ? (
        <Stack component="ul" gap={SPACE.group} aria-label="Artifacts" sx={{ listStyle: "none", m: 0, p: 0 }}>
          {files.map(({ file, task }) => (
            <Stack component="li" key={file.id} direction="row" gap={SPACE.item} alignItems="flex-start">
              <OpenFileIcon aria-hidden style={{ width: 20, height: 20, flexShrink: 0, color: muted, marginTop: 2 }} />
              <Stack sx={{ minWidth: 0 }}>
                <Typography variant="body1" sx={{ fontWeight: tokens.semantic.fontWeight.emphasis.value }}>
                  {file.name}
                </Typography>
                <Typography variant="textMd" sx={{ color: muted }}>
                  {file.addedBy} · {task.description} · {formatShortDate(file.sentAt)}
                </Typography>
              </Stack>
            </Stack>
          ))}
        </Stack>
      ) : (
        <Typography variant="body1" sx={{ color: muted }}>
          No files yet.
        </Typography>
      )}
    </SectionCard>
  );
}
