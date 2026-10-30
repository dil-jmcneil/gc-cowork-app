import { Box, InputAdornment, TextField, Typography, useTheme } from "@mui/material";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { NavLink as RouterNavLink, useNavigate } from "react-router";

import ForumIcon from "@mui/icons-material/ForumOutlined";

import { AINavLink, AINavSection } from "@diligentcorp/atlas-react-bundle/global-nav";

import AddCircleIcon from "@diligentcorp/atlas-react-bundle/icons/AddCircle";
import CalendarIcon from "@diligentcorp/atlas-react-bundle/icons/Calendar";
import HomeIcon from "@diligentcorp/atlas-react-bundle/icons/Home";
import ProjectsIcon from "@diligentcorp/atlas-react-bundle/icons/Projects";
import SearchIcon from "@diligentcorp/atlas-react-bundle/icons/Search";

import { expandPrototypeSideNav } from "./configureAtlasPrototypeNav.js";
import { DEFAULT_CHAT_PREVIEW, useChatStore, type ChatRecord } from "./chat/chatStore.js";
import { useProjectStore } from "./projects/projectStore.js";
import {
  commandCenterNavRowInnerSx,
  commandCenterNavSearchAlignedRowSx,
} from "./commandCenterNavLayout.js";

type HistoryNavItem = {
  to: string;
  label: string;
  title: string;
  preview: string;
  sortKey: number;
};

const VISIBLE_HISTORY_COUNT = 5;

function buildChatHistoryItems(chats: ChatRecord[]): HistoryNavItem[] {
  return chats
    .map((chat) => ({
      to: `/chats/${chat.id}`,
      label: formatChatNavLabel(chat.title, chat.preview),
      title: chat.title,
      preview: chat.preview || "",
      sortKey: chat.lastActivity.getTime(),
    }))
    .sort((a, b) => b.sortKey - a.sortKey);
}

function historyItemMatchesQuery(item: HistoryNavItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    item.label.toLowerCase().includes(q) ||
    item.title.toLowerCase().includes(q) ||
    item.preview.toLowerCase().includes(q)
  );
}

function truncateLabel(text: string, max = 42) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}\u2026`;
}

function formatChatNavLabel(title: string, preview: string) {
  const effectivePreview = preview === DEFAULT_CHAT_PREVIEW ? "" : preview;
  const normalisedTitle = title.trim().toLowerCase();
  const normalisedPreview = effectivePreview.trim().toLowerCase();
  if (
    !effectivePreview ||
    normalisedTitle === normalisedPreview ||
    normalisedPreview.startsWith(normalisedTitle) ||
    normalisedTitle.startsWith(normalisedPreview)
  ) {
    return truncateLabel(title);
  }
  return truncateLabel(`${title} \u2014 ${effectivePreview}`);
}

export default function CommandCenterNavigation() {
  const { tokens } = useTheme();
  const navigate = useNavigate();
  const chats = useChatStore((s) => s.chats);

  const chatHistoryItems = buildChatHistoryItems(chats);
  const chatHistoryVisibleItems = chatHistoryItems.slice(0, VISIBLE_HISTORY_COUNT);
  const listGap = tokens.core.spacing["0_5"].value;

  return (
    <Box
      component="section"
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        flex: 1,
        minHeight: 0,
        height: "100%",
      }}
    >
      <Box
        className="cc-nav-expanded"
        sx={{
          display: "var(--label-display, flex)",
          flexDirection: "column",
          gap: listGap,
          width: "100%",
          flex: 1,
          minHeight: 0,
        }}
      >
        <RoutedAINavLink to="/" label="Home" end icon={<HomeIcon slot="icon" />} />
        <ProjectsNavSection />
        <RoutedAINavLink
          to="/compliance-calendar"
          label="Compliance calendar"
          icon={<CalendarIcon slot="icon" />}
        />
        <RoutedAINavLink
          to="/chats/new"
          label="New chat"
          end
          icon={<AddCircleIcon slot="icon" />}
        />
        <AiNavHistorySection
          label="History"
          icon={<ForumIcon slot="icon" />}
          visibleItems={chatHistoryVisibleItems}
          allItems={chatHistoryItems}
          emptyMessage="No history yet"
          searchEmptyMessage="No matching chats"
        />
      </Box>
      <Box
        className="cc-nav-compact"
        sx={{
          flexDirection: "column",
          alignItems: "center",
          gap: listGap,
          width: "100%",
          flex: 1,
          minHeight: 0,
        }}
      >
        <CommandCenterCompactNavButton
          label="Home"
          icon={<HomeIcon aria-hidden fontSize="small" />}
          onClick={() => navigate("/")}
        />
        <CommandCenterCompactNavButton
          label="Projects"
          icon={<ProjectsIcon aria-hidden fontSize="small" />}
          onClick={() => expandPrototypeSideNav()}
        />
        <CommandCenterCompactNavButton
          label="Compliance calendar"
          icon={<CalendarIcon aria-hidden fontSize="small" />}
          onClick={() => navigate("/compliance-calendar")}
        />
        <CommandCenterCompactNavButton
          label="New chat"
          icon={<AddCircleIcon aria-hidden fontSize="small" />}
          onClick={() => navigate("/chats/new")}
        />
        <CommandCenterCompactNavButton
          label="History"
          icon={<ForumIcon aria-hidden fontSize="small" />}
          onClick={() => expandPrototypeSideNav()}
        />
      </Box>
    </Box>
  );
}

/** Collapsible list of projects, one sub-item per project. */
function ProjectsNavSection() {
  const projects = useProjectStore((s) => s.projects);
  const [open, setOpen] = useState(true);
  return (
    <AINavSection
      label="Projects"
      isOpen={open}
      childCount={projects.length}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
    >
      <ProjectsIcon slot="icon" />
      {projects.length === 0 ? (
        <CommandCenterEmptyHint message="No projects yet" />
      ) : (
        projects.map((project) => (
          <RoutedAINavLink
            key={project.id}
            to={`/projects/${project.id}`}
            label={truncateLabel(project.name)}
          />
        ))
      )}
    </AINavSection>
  );
}

/** Collapsible, searchable chat history built on Atlas `AINavSection` + `AINavLink`. */
function AiNavHistorySection({
  label,
  icon,
  visibleItems,
  allItems,
  emptyMessage,
  searchEmptyMessage,
}: {
  label: string;
  icon: ReactNode;
  visibleItems: HistoryNavItem[];
  allItems: HistoryNavItem[];
  emptyMessage: string;
  searchEmptyMessage: string;
}) {
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState("");
  const isSearching = query.trim().length > 0;

  const filteredItems = useMemo(() => {
    if (!isSearching) return visibleItems;
    return allItems.filter((item) => historyItemMatchesQuery(item, query));
  }, [visibleItems, allItems, query, isSearching]);

  return (
    <AINavSection
      label={label}
      isOpen={open}
      childCount={allItems.length}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
    >
      {icon}
      <NavSearchField value={query} onChange={setQuery} />
      {filteredItems.length === 0 ? (
        <CommandCenterEmptyHint
          message={isSearching ? searchEmptyMessage : emptyMessage}
          searchAligned
        />
      ) : (
        filteredItems.map((item) => (
          <RoutedAINavLink key={item.to} to={item.to} label={item.label} />
        ))
      )}
    </AINavSection>
  );
}

function RoutedAINavLink({
  to,
  label,
  icon,
  trailing,
  end,
  slot,
}: {
  to: string;
  label: string;
  icon?: ReactNode;
  /** Slot-targeted trailing content (e.g. an "Action Needed" pill). */
  trailing?: ReactNode;
  end?: boolean;
  slot?: string;
}) {
  const hideIconStyle = icon
    ? undefined
    : ({ ["--view-all-icon-display"]: "none" } as CSSProperties);
  return (
    <RouterNavLink
      to={to}
      end={end}
      slot={slot}
      style={{ display: "contents", textDecoration: "none", color: "inherit" }}
    >
      {({ isActive }) => (
        <AINavLink
          as="span"
          label={label}
          isCurrent={isActive}
          style={hideIconStyle}
        >
          {icon}
          {trailing}
        </AINavLink>
      )}
    </RouterNavLink>
  );
}

/**
 * The single custom nav item: an inline search field that sits inside the
 * `AINavSection` child area (above the chat links), filtering the full history
 * data set as the user types.
 */
function NavSearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { tokens } = useTheme();
  return (
    <Box sx={{ width: "100%", py: tokens.core.spacing["0_5"].value }}>
      <TextField
        fullWidth
        variant="outlined"
        size="small"
        placeholder="Search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        slotProps={{
          input: {
            "aria-label": "Search chat history",
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />
    </Box>
  );
}

function CommandCenterCompactNavButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  const { tokens } = useTheme();
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: tokens.semantic.iconSize.lg.value,
        height: tokens.semantic.iconSize.lg.value,
        padding: tokens.core.spacing[1].value,
        boxSizing: "content-box",
        border: "none",
        cursor: "pointer",
        borderRadius: tokens.semantic.radius.lg.value,
        color: tokens.semantic.color.type.default.value,
        bgcolor: "transparent",
        "&:hover": {
          bgcolor: tokens.semantic.color.action.secondary.hoverFill.value,
        },
      }}
    >
      {icon}
    </Box>
  );
}

function CommandCenterEmptyHint({
  message,
  searchAligned,
}: {
  message: string;
  searchAligned?: boolean;
}) {
  const { tokens } = useTheme();
  const rowSx = searchAligned
    ? commandCenterNavSearchAlignedRowSx(tokens)
    : commandCenterNavRowInnerSx(tokens);
  return (
    <Box sx={{ width: "100%", ...rowSx }}>
      <Typography
        variant="textMd"
        sx={{
          color: tokens.semantic.color.type.muted.value,
          fontStyle: "italic",
        }}
      >
        {message}
      </Typography>
    </Box>
  );
}
