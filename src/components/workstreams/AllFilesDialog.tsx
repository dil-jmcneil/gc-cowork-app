import CloseIcon from "@diligentcorp/atlas-react-bundle/icons/Close";
import OpenFileIcon from "@diligentcorp/atlas-react-bundle/icons/OpenFile";
import { Dialog, DialogContent, DialogTitle, IconButton, Link, Stack, Typography, useTheme } from "@mui/material";

import { DETAIL_DIALOG_PAPER, SPACE } from "@/lib/layout";
import { formatShortDate } from "@/workstreams/taskStatus";
import { newestFirst, type HistoryFile } from "@/workstreams/thread";
import type { WorkstreamTask } from "@/workstreams/workstream";

/** Every file on the workstream's tasks: what Cowork created and what people uploaded. */
export function workstreamFiles(tasks: WorkstreamTask[]): { file: HistoryFile; task: WorkstreamTask }[] {
  return newestFirst(
    tasks.flatMap((task) =>
      task.history.filter((e): e is HistoryFile => e.kind === "file").map((file) => ({ file, task })),
    ),
    (item) => item.file.sentAt,
  );
}

/** All the workstream's files, newest first, each with who added it, its task and date. Picking one opens it. */
export function AllFilesDialog({
  open,
  tasks,
  onClose,
  onOpenFile,
}: {
  open: boolean;
  tasks: WorkstreamTask[];
  onClose: () => void;
  onOpenFile: (fileId: string) => void;
}) {
  const { tokens } = useTheme();
  const muted = tokens.semantic.color.type.muted.value;
  if (!open) return null;
  const files = workstreamFiles(tasks);

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth slotProps={{ paper: DETAIL_DIALOG_PAPER }}>
      <DialogTitle component="div" sx={{ pr: 6 }}>
        {/* The Atlas dialog title styles any h2 at 22px; keep the 18px h4. */}
        <Typography
          variant="h4"
          component="h2"
          sx={(theme) => ({
            "&.MuiTypography-root": { ...theme.typography.h4, fontWeight: tokens.semantic.fontWeight.emphasis.value },
          })}
        >
          All files ({files.length})
        </Typography>
        <IconButton
          aria-label="Close"
          onClick={onClose}
          size="small"
          sx={{
            position: "absolute",
            top: (theme) => theme.spacing(SPACE.group),
            right: (theme) => theme.spacing(SPACE.group),
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {files.length ? (
          <Stack component="ul" gap={SPACE.group} aria-label="All files" sx={{ listStyle: "none", m: 0, p: 0 }}>
            {files.map(({ file, task }) => (
              <Stack component="li" key={file.id} direction="row" gap={SPACE.item} alignItems="flex-start">
                <OpenFileIcon
                  aria-hidden
                  style={{ width: 20, height: 20, flexShrink: 0, color: muted, marginTop: 2 }}
                />
                <Stack sx={{ minWidth: 0 }}>
                  <Link
                    component="button"
                    type="button"
                    underline="hover"
                    onClick={() => {
                      onClose();
                      onOpenFile(file.id);
                    }}
                    sx={{ alignSelf: "flex-start", textAlign: "left", font: "inherit" }}
                  >
                    <Typography
                      variant="body1"
                      component="span"
                      sx={{ color: "inherit", fontWeight: tokens.semantic.fontWeight.emphasis.value }}
                    >
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
      </DialogContent>
    </Dialog>
  );
}
