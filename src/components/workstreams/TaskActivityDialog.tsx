import CloseIcon from "@diligentcorp/atlas-react-bundle/icons/Close";
import { Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography, useTheme } from "@mui/material";

import { DETAIL_DIALOG_PAPER, SPACE } from "@/lib/layout";
import type { WorkstreamTask } from "@/workstreams/workstream";

import { TimelineList } from "./Timeline";

/** A task's activity log: its messages, Cowork's actions and files, newest first. */
export function TaskActivityDialog({
  task,
  now,
  onClose,
}: {
  task: WorkstreamTask | undefined;
  now: Date;
  onClose: () => void;
}) {
  const { tokens } = useTheme();
  if (!task) return null;
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth slotProps={{ paper: DETAIL_DIALOG_PAPER }}>
      <DialogTitle component="div" sx={{ pr: 6 }}>
        <Stack gap={SPACE.pair} alignItems="flex-start" sx={{ width: "100%", minWidth: 0, textAlign: "left" }}>
          <Typography variant="textMd" sx={{ color: tokens.semantic.color.type.muted.value }}>
            Activity log
          </Typography>
          {/* The Atlas dialog title styles any h2 at 22px; keep the 18px h4. */}
          <Typography
            variant="h4"
            component="h2"
            sx={(theme) => ({
              "&.MuiTypography-root": { ...theme.typography.h4, fontWeight: tokens.semantic.fontWeight.emphasis.value },
            })}
          >
            {task.description}
          </Typography>
        </Stack>
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
        <TimelineList
          items={task.history.map((entry) => ({ entry }))}
          ariaLabel={`Activity log for ${task.description}`}
          now={now}
          initialStep="ten"
        />
      </DialogContent>
    </Dialog>
  );
}
