/**
 * Spacing for dense screens, in MUI spacing units (1 = 8px). Use these names
 * instead of raw numbers so it's clear which relationship a gap expresses:
 * less space inside a related group, more space between blocks.
 */
export const SPACE = {
  /** 4px: a label and its value, or a title and its meta line. */
  pair: 0.5,
  /** 8px: items in a row, or lines inside one item. */
  item: 1,
  /** 12px: groups inside a card, and list items. */
  group: 1.5,
  /** 16px: card padding, and between cards stacked in one column. */
  block: 2,
  /** 24px: between page sections, e.g. the header and the first row of cards. The largest gap. */
  section: 3,
} as const;

/**
 * Atlas pins dialog paper to 440px. Detail dialogs (a signal, a task) hold
 * a lot of 14px text, so they open wider to avoid long scrolls.
 */
export const DETAIL_DIALOG_PAPER = { sx: { width: "100%", maxWidth: 880 } } as const;
