export function downloadUrl(
  url: string | null,
  title: string,
  author: string,
): string | null {
  if (!url) return null;
  const ext = url.split('.').pop()?.split('?')[0] || '';
  const cleanName = `${title}_${author}`.replace(/[\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
  return `${url}?download=${encodeURIComponent(cleanName)}.${ext}`;
}
