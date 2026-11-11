import { Button, Card, CardContent, Stack, TextField, Typography, useTheme } from "@mui/material";
import { useState, type ReactNode } from "react";

import {
  getPath,
  missingRequired,
  resolveContext,
  resolveValue,
  setPath,
  type A2uiComponent,
  type A2uiDataModel,
  type A2uiSurface as Surface,
} from "@/chat/a2ui";
import { SPACE } from "@/lib/layout";

import { useChatActions } from "./chatActions";

/**
 * Renders an A2UI surface from the Atlas catalog subset in `@/chat/a2ui`
 * (Column, Row, Card, Text, TextField, Button) with Atlas components. Fields
 * write to the surface's data model; a Button fires its action with the
 * resolved context. Once submitted, the surface shows read-only.
 */
export function A2uiSurface({ surface, messageId }: { surface: Surface; messageId: string }) {
  const { tokens } = useTheme();
  const actions = useChatActions();
  const [data, setData] = useState<A2uiDataModel>(surface.dataModel);
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  const byId = new Map(surface.components.map((c) => [c.id, c]));
  const missing = missingRequired(surface, data);
  const readOnly = Boolean(surface.submitted);

  // A plain function, not a nested component, so fields keep focus as you type.
  const render = (id: string): ReactNode => {
    const component = byId.get(id);
    return component ? renderComponent(component) : null;
  };

  function renderComponent(component: A2uiComponent): ReactNode {
    const key = component.id;
    switch (component.component) {
      case "Column":
        return (
          <Stack key={key} gap={SPACE.group}>
            {component.children.map(render)}
          </Stack>
        );
      case "Row":
        return (
          <Stack key={key} direction="row" gap={SPACE.item} sx={{ "& > *": { flex: 1, minWidth: 0 } }}>
            {component.children.map(render)}
          </Stack>
        );
      case "Card":
        return (
          <Card key={key} variant="outlined" sx={{ p: 0 }}>
            <CardContent sx={{ p: SPACE.block, "&:last-child": { pb: SPACE.block } }}>{render(component.child)}</CardContent>
          </Card>
        );
      case "Text":
        return (
          <Typography
            key={key}
            variant={component.variant ?? "body1"}
            sx={{
              color: component.color === "muted" ? tokens.semantic.color.type.muted.value : undefined,
              fontWeight: component.variant === "h5" || component.variant === "h6" ? tokens.semantic.fontWeight.emphasis.value : undefined,
            }}
          >
            {String(resolveValue(component.text, data) ?? "")}
          </Typography>
        );
      case "TextField": {
        const value = String(getPath(data, component.value.path) ?? "");
        const showError = touched.has(component.id) && missing.includes(component.id) && value.trim() !== "";
        return (
          <TextField
            key={key}
            size="small"
            fullWidth
            label={component.label}
            required={component.required}
            placeholder={component.placeholder}
            value={value}
            disabled={readOnly}
            error={showError}
            helperText={showError ? "Enter a valid email address." : undefined}
            onChange={(e) => setData((d) => setPath(d, component.value.path, e.target.value))}
            onBlur={() => setTouched((t) => new Set(t).add(component.id))}
            inputProps={{ "aria-label": component.label }}
          />
        );
      }
      case "Button":
        if (readOnly) return null;
        return (
          <Button
            key={key}
            variant={component.variant ?? "contained"}
            sx={{ alignSelf: "flex-start" }}
            disabled={!actions || (component.requireFields && missing.length > 0)}
            onClick={() => {
              if (!component.action || !actions) return;
              const { name, context } = component.action.event;
              actions.submitSurface(messageId, data, {
                surfaceId: surface.surfaceId,
                name,
                context: resolveContext(context, data),
              });
            }}
          >
            {component.label}
          </Button>
        );
    }
  }

  return <>{render(surface.root)}</>;
}
