import OpenFileIcon from "@diligentcorp/atlas-react-bundle/icons/OpenFile";
import { Link, Stack, Typography, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router";

import { SPACE } from "@/lib/layout";
import { formatShortDate } from "@/workstreams/taskStatus";
import { newestFirst, type HistoryFile } from "@/workstreams/thread";
import type { WorkstreamTask } from "@/workstreams/workstream";

import { SectionCard } from "./SectionCard";

/** Every file Cowork or a person created or uploaded on the workstream's tasks, newest first. Each title opens the file. */
export function ArtifactsCard({ tasks, hrefFor }: { tasks: WorkstreamTask[]; hrefFor: (fileId: string) => string }) {
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
                <Link
                  component={RouterLink}
                  to={hrefFor(file.id)}
                  underline="hover"
                  sx={{ alignSelf: "flex-start", fontWeight: tokens.semantic.fontWeight.emphasis.value }}
                >
                  <Typography variant="body1" component="span" sx={{ color: "inherit", fontWeight: "inherit" }}>
                    {file.name}
                  </Typography>
                </Link>
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
