/**
 * A small slice of A2UI v0.9 (the Atlas catalog, urn:grc-agent:catalog:atlas-v09):
 * flat components that refer to each other by id, bound to a data model by
 * JSON-pointer paths. Buttons fire an action event with a resolved context.
 * See https://a2ui-gallery.diligentoneplatform-dev.com/ for the full catalog.
 */
export type A2uiBinding = { path: string };
export type A2uiValue = string | A2uiBinding;

export type A2uiAction = { event: { name: string; context?: Record<string, A2uiValue> } };

export type A2uiComponent =
  | { id: string; component: "Column" | "Row"; children: string[] }
  | { id: string; component: "Card"; child: string }
  | {
      id: string;
      component: "Text";
      text: A2uiValue;
      variant?: "h5" | "h6" | "body1" | "textMd";
      color?: "default" | "muted";
    }
  | {
      id: string;
      component: "TextField";
      label: string;
      value: A2uiBinding;
      required?: boolean;
      placeholder?: string;
      /** The value must match this pattern to count as filled in. */
      validationRegexp?: string;
    }
  | {
      id: string;
      component: "Button";
      label: string;
      variant?: "contained" | "outlined" | "text";
      /** Stays disabled until every required field on the surface is filled in. */
      requireFields?: boolean;
      action?: A2uiAction;
    };

export type A2uiDataModel = Record<string, unknown>;

export type A2uiSurface = {
  surfaceId: string;
  root: string;
  components: A2uiComponent[];
  dataModel: A2uiDataModel;
  /** Set once its action has fired: the surface then shows read-only. */
  submitted?: boolean;
};

export type A2uiActionEvent = { surfaceId: string; name: string; context: Record<string, unknown> };

function segments(path: string): string[] {
  return path.split("/").filter(Boolean);
}

export function getPath(data: unknown, path: string): unknown {
  return segments(path).reduce<unknown>(
    (node, key) => (node && typeof node === "object" ? (node as Record<string, unknown>)[key] : undefined),
    data,
  );
}

/** A copy of the data model with `value` at `path`. */
export function setPath<T>(data: T, path: string, value: unknown): T {
  const [head, ...rest] = segments(path);
  if (head === undefined) return value as T;
  const node = (data ?? {}) as Record<string, unknown> | unknown[];
  const child = setPath((node as Record<string, unknown>)[head], rest.join("/"), value);
  if (Array.isArray(node)) {
    const copy = [...node];
    copy[Number(head)] = child;
    return copy as T;
  }
  return { ...node, [head]: child } as T;
}

export function resolveValue(value: A2uiValue, data: unknown): unknown {
  return typeof value === "string" ? value : getPath(data, value.path);
}

export function resolveContext(context: Record<string, A2uiValue> = {}, data: unknown): Record<string, unknown> {
  return Object.fromEntries(Object.entries(context).map(([key, value]) => [key, resolveValue(value, data)]));
}

/** Ids of required fields that are blank or don't match their pattern. */
export function missingRequired(surface: A2uiSurface, data: unknown): string[] {
  return surface.components
    .filter((c): c is Extract<A2uiComponent, { component: "TextField" }> => c.component === "TextField")
    .filter((field) => {
      if (!field.required) return false;
      const value = String(getPath(data, field.value.path) ?? "").trim();
      if (!value) return true;
      return field.validationRegexp ? !new RegExp(field.validationRegexp).test(value) : false;
    })
    .map((field) => field.id);
}
