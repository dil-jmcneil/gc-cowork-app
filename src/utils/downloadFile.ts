/**
 * Triggers a client-side download of text content by creating a temporary
 * object URL and clicking a hidden anchor. Used to "hand back" generated
 * documents in the prototype without a backend.
 */
export function downloadTextFile(
  filename: string,
  content: string,
  mimeType = "text/html",
): void {
  if (typeof document === "undefined") return;

  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
