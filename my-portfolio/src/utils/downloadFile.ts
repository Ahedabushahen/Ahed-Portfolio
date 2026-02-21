/**
 * Downloads a file from any URL (same-origin or cross-origin/Storage)
 * by fetching it as a blob and triggering a named download.
 */
export async function downloadFile(
  url: string,
  filename: string
): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch file: ${response.status}`);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}
