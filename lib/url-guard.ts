import { lookup } from 'node:dns/promises'
import net from 'node:net'

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number)
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    )
  }

  const lower = ip.toLowerCase()
  return (
    lower === '::' ||
    lower === '::1' ||
    lower.startsWith('fc') ||
    lower.startsWith('fd') ||
    lower.startsWith('fe80')
  )
}

/**
 * Vrai si l'URL est https, publique, et ne pointe pas vers le réseau interne
 * (protection SSRF basique). Résout le DNS et refuse si une des adresses est privée.
 */
export async function isSafePublicUrl(raw: string): Promise<boolean> {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return false
  }

  if (url.protocol !== 'https:') return false

  const host = url.hostname.toLowerCase()
  if (!host) return false
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return false
  }

  if (net.isIP(host)) return !isPrivateIp(host)

  try {
    const records = await lookup(host, { all: true })
    if (records.length === 0) return false
    return records.every((r) => !isPrivateIp(r.address))
  } catch {
    return false
  }
}
