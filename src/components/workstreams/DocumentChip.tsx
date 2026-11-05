import AgendaFileIcon from "@diligentcorp/atlas-react-bundle/icons/AgendaFile";
import ExcelFileIcon from "@diligentcorp/atlas-react-bundle/icons/ExcelFile";
import FileIcon from "@diligentcorp/atlas-react-bundle/icons/File";
import ImageFileIcon from "@diligentcorp/atlas-react-bundle/icons/ImageFile";
import PdfFileIcon from "@diligentcorp/atlas-react-bundle/icons/PdfFile";
import PowerpointFileIcon from "@diligentcorp/atlas-react-bundle/icons/PowerpointFile";
import WordFileIcon from "@diligentcorp/atlas-react-bundle/icons/WordFile";
import ZipFileIcon from "@diligentcorp/atlas-react-bundle/icons/ZipFile";
import { ButtonBase, Typography, useTheme } from "@mui/material";
import type { ComponentType, SVGProps } from "react";

import { SPACE } from "@/lib/layout";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const BY_EXTENSION: Record<string, Icon> = {
  pdf: PdfFileIcon,
  doc: WordFileIcon,
  docx: WordFileIcon,
  xls: ExcelFileIcon,
  xlsx: ExcelFileIcon,
  csv: ExcelFileIcon,
  ppt: PowerpointFileIcon,
  pptx: PowerpointFileIcon,
  png: ImageFileIcon,
  jpg: ImageFileIcon,
  jpeg: ImageFileIcon,
  zip: ZipFileIcon,
};

/** The Atlas icon for a file: an agenda gets the agenda icon, otherwise its type (PDF, Word, Excel…). */
export function fileIcon(name: string): Icon {
  if (/\bagenda\b/i.test(name)) return AgendaFileIcon;
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  return BY_EXTENSION[extension] ?? FileIcon;
}

/** The file's type icon, by name. */
export function FileTypeIcon({ name, ...props }: { name: string } & SVGProps<SVGSVGElement>) {
  const Icon = fileIcon(name);
  return <Icon {...props} />;
}

/**
 * A document as a compact, clickable chip: a muted file-type icon so the
 * title keeps the contrast, the title in default text, a hairline outline,
 * and a subtle fill on hover. The full name is also in the
 * tooltip and the accessible label. Chips show the full title and wrap to a
 * new row; a title only truncates when it's wider than the row itself.
 */
export function DocumentChip({ name, onOpen }: { name: string; onOpen: () => void }) {
  const { tokens } = useTheme();
  const Icon = fileIcon(name);
  return (
    <ButtonBase
      onClick={onOpen}
      title={name}
      aria-label={`Open ${name}`}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: SPACE.item,
        maxWidth: "100%",
        height: 32,
        pl: SPACE.item,
        pr: SPACE.group,
        borderRadius: tokens.semantic.radius.md.value,
        border: `1px solid ${tokens.semantic.color.ui.divider.default.value}`,
        bgcolor: tokens.semantic.color.surface.default.value,
        transition: "background-color 120ms ease, border-color 120ms ease",
        "&:hover": {
          bgcolor: tokens.semantic.color.surface.subtle.value,
          borderColor: tokens.semantic.color.outline.fixed.value,
        },
        "&.Mui-focusVisible": { outline: `2px solid ${tokens.semantic.color.ui.focusRing.value}`, outlineOffset: 2 },
      }}
    >
      <Icon
        aria-hidden
        style={{ width: 18, height: 18, flexShrink: 0, color: tokens.semantic.color.type.muted.value }}
      />
      <Typography
        variant="body1"
        component="span"
        sx={{
          color: tokens.semantic.color.type.default.value,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          minWidth: 0,
        }}
      >
        {name}
      </Typography>
    </ButtonBase>
  );
}
