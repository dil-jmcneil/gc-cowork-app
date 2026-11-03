import {
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";

import type { PlanRule } from "@/workstreams/workstream";
import { SPACE } from "@/lib/layout";

/**
 * A plan's rules as rows: when the work looks like this, Cowork does these
 * things, until the work looks like that. Rows don't point at each other.
 */
export function RuleTable({ rules, ariaLabel }: { rules: PlanRule[]; ariaLabel: string }) {
  const { tokens, presets } = useTheme();
  const StatusIndicator = presets.StatusIndicatorPresets.components.StatusIndicator;
  const muted = tokens.semantic.color.type.muted.value;

  return (
    <TableContainer>
      <Table
        size="small"
        aria-label={ariaLabel}
        sx={(theme) => ({
          "& .MuiTableCell-body": theme.typography.body1,
          // No divider under the last row; the card edge ends the table.
          "& .MuiTableBody-root .MuiTableRow-root:last-of-type .MuiTableCell-root": { borderBottom: "none" },
        })}
      >
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: "34%" }}>When</TableCell>
            <TableCell sx={{ width: "36%" }}>Cowork does</TableCell>
            <TableCell>Until</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rules.map((rule) => (
            <TableRow key={rule.id}>
              <TableCell sx={{ verticalAlign: "top", whiteSpace: "normal" }}>
                <Stack gap={SPACE.item} alignItems="flex-start">
                  {rule.kind === "exception" ? <StatusIndicator color="warning" label="Exception" /> : null}
                  <Typography variant="body1">{rule.when}</Typography>
                </Stack>
              </TableCell>
              <TableCell sx={{ verticalAlign: "top", whiteSpace: "normal" }}>
                <Stack gap={SPACE.pair}>
                  <Typography variant="body1">{rule.actions}</Typography>
                  {rule.circuitBreaker ? (
                    <Typography variant="textMd" sx={{ color: muted }}>
                      Stops: {rule.circuitBreaker}
                    </Typography>
                  ) : null}
                </Stack>
              </TableCell>
              <TableCell sx={{ verticalAlign: "top", whiteSpace: "normal" }}>
                <Typography variant="body1">{rule.until}</Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
