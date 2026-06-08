// Map known image extensions to their MIME types.
const MAP: Record<string, string> = {
  webp: 'image/webp',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  svg: 'image/svg+xml'
}

export function mimeFromFilename(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot < 0) return 'application/octet-stream'
  const ext = name.slice(dot + 1).toLowerCase()
  return MAP[ext] ?? 'application/octet-stream'
}
