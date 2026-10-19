import crypto from 'crypto'
import { isSafePublicUrl } from './url-guard'

type NewsletterConfig = {
  provider: string
  api_key: string
  list_id: string
  webhook_url: string
  notify_email: string
}

function unsubscribeSecret(): string {
  return process.env.UNSUBSCRIBE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

/** Jeton de désabonnement signé (HMAC-SHA256) : impossible à forger sans le secret. */
export function signUnsubscribeToken(email: string, bookId: string): string {
  const secret = unsubscribeSecret()
  if (!secret) throw new Error('UNSUBSCRIBE_SECRET manquant')
  const payload = Buffer.from(
    JSON.stringify({ e: email.trim().toLowerCase(), b: bookId })
  ).toString('base64url')
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

/** Vérifie un jeton de désabonnement et renvoie l'email + le livre associés. */
export function verifyUnsubscribeToken(token: string): { email: string; bookId: string } | null {
  if (!token || !token.includes('.')) return null
  const secret = unsubscribeSecret()
  if (!secret) return null

  const [payload, sig] = token.split('.')
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (typeof data.e !== 'string' || typeof data.b !== 'string') return null
    return { email: data.e, bookId: data.b }
  } catch {
    return null
  }
}

type Consents = {
  transmission?: boolean
  newsletter?: boolean
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

type Sender = { apiKey: string; from: string; name: string }

// Expéditeur transactionnel : compte plateforme si configuré (PLATFORM_BREVO_API_KEY),
// sinon la clé Brevo de l'auteur.
function resolveSender(config: NewsletterConfig): Sender | null {
  const platformKey = process.env.PLATFORM_BREVO_API_KEY
  const platformFrom = process.env.PLATFORM_FROM_EMAIL
  if (platformKey && platformFrom) {
    return {
      apiKey: platformKey,
      from: platformFrom,
      name: process.env.PLATFORM_FROM_NAME || 'As-tu-lu',
    }
  }
  if (config.provider === 'brevo' && config.api_key && config.notify_email) {
    return { apiKey: config.api_key, from: config.notify_email, name: 'As-tu-lu' }
  }
  return null
}

async function sendTransactional(sender: Sender, to: string, subject: string, html: string) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': sender.apiKey,
    },
    body: JSON.stringify({
      to: [{ email: to }],
      templateId: null,
      subject,
      htmlContent: html,
      sender: { name: sender.name, email: sender.from },
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Brevo ${response.status}: ${body}`)
  }
}

export async function sendDownloadEmail(
  email: string,
  bookTitle: string,
  bookAuthor: string,
  downloadLinks: { url: string; label: string }[],
  recoveryUrl: string,
  unsubscribeUrl: string,
  config: NewsletterConfig
) {
  const sender = resolveSender(config)
  if (!sender) {
    console.warn('sendDownloadEmail: aucun expéditeur configuré, email lecteur ignoré')
    return
  }

  const siteName = 'As-tu-lu'
  const safeTitle = escapeHtml(bookTitle)
  const safeAuthor = escapeHtml(bookAuthor)
  const linksHtml = downloadLinks.map(({ url, label }) =>
    `<a href="${url}" style="display:inline-block;background:#2563eb;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;margin:4px;">${escapeHtml(label)}</a>`
  ).join(' ')
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1f2937;">Merci pour ton inscription !</h2>
      <p style="color:#4b5563;font-size:15px;line-height:1.5;">
        Ton livre <strong>"${safeTitle}"</strong> de <strong>${safeAuthor}</strong> est prêt.
      </p>
      <div style="text-align:center;margin:20px 0;">
        ${linksHtml}
      </div>
      <p style="color:#9ca3af;font-size:13px;">
        Ces liens de téléchargement sont personnels et expirent dans 1 semaine. Ne les partage pas.
      </p>
      <p style="color:#9ca3af;font-size:13px;">
        <a href="${recoveryUrl}" style="color:#2563eb;">Lien de récupération (valable 30 jours)</a>
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
      <p style="color:#9ca3af;font-size:12px;">
        Tu as téléchargé ce livre sur ${siteName}.<br>
        Si tu n'es pas à l'origine de cet email, ignore-le.
      </p>
      ${unsubscribeUrl ? `<p style="color:#9ca3af;font-size:12px;">
        <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Se désabonner de la newsletter</a>
      </p>` : ''}
    </div>
  `

  await sendTransactional(sender, email, `Ton livre "${bookTitle}" est prêt à être téléchargé`, html)
}

export async function forwardToNewsletter(
  email: string,
  bookTitle: string,
  config: NewsletterConfig,
  consents: Consents = {}
) {
  const errors: string[] = []

  // 1) Intégration au service newsletter de l'auteur (si consentement newsletter)
  if (consents.newsletter !== false) {
    try {
      if (config.provider === 'brevo' && config.api_key) {
        await forwardToBrevo(email, config)
      } else if (config.provider === 'mailerlite' && config.api_key) {
        await forwardToMailerLite(email, config)
      } else if (config.provider === 'webhook') {
        await forwardToWebhook(email, bookTitle, config)
      }
    } catch (err) {
      errors.push((err as Error).message)
    }
  }

  // 2) Email de notification à l'auteur (fonctionne sans intégration)
  if (config.notify_email && consents.transmission !== false) {
    try {
      await sendNotificationEmail(email, bookTitle, config, consents)
    } catch (err) {
      errors.push(`Notification: ${(err as Error).message}`)
    }
  }

  return errors.length > 0 ? errors : []
}

async function forwardToBrevo(email: string, config: NewsletterConfig) {
  const body: { email: string; updateEnabled: boolean; listIds?: number[] } = { email, updateEnabled: true }

  if (config.list_id) {
    const ids = config.list_id.split(',').map((id) => parseInt(id.trim())).filter((n) => !isNaN(n))
    if (ids.length > 0) body.listIds = ids
  }

  const response = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': config.api_key,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Brevo (contacts) ${response.status}: ${errorBody}`)
  }
}

/**
 * Liste Brevo « Auteurs » de la plateforme. Distincte des listes lecteur, qui
 * vivent chacune dans le compte Brevo de l'auteur concerné (newsletter_settings).
 */
export function platformAuthorsListId(): number {
  const id = parseInt((process.env.PLATFORM_BREVO_AUTHORS_LIST_ID || '').trim(), 10)
  return Number.isFinite(id) && id > 0 ? id : 0
}

/**
 * Ajoute un auteur à la liste Brevo de la plateforme. Idempotent : un contact
 * déjà présent est simplement rattaché à la liste.
 * Renvoie 'ok', 'duplicate' (déjà présent), 'ignoré' (non configuré) ou une erreur.
 */
export async function addAuthorToPlatformBrevo(email: string): Promise<string> {
  const apiKey = process.env.PLATFORM_BREVO_API_KEY
  const listId = platformAuthorsListId()
  if (!apiKey || !listId) return 'ignoré'

  const address = email.trim().toLowerCase()
  if (!address) return 'ignoré'

  const response = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
    body: JSON.stringify({ email: address, updateEnabled: true, listIds: [listId] }),
  })

  // 201 = contact créé, 204 = contact existant (rattaché ou mis à jour).
  if (response.status === 201) return 'ok'
  if (response.status === 204) return 'duplicate'
  if (response.ok) return 'ok'

  const errorBody = await response.text()
  if (response.status === 400 && /duplicate/i.test(errorBody)) return 'duplicate'
  return `Brevo ${response.status}: ${errorBody.slice(0, 200)}`
}

/**
 * Retire un auteur de la liste Brevo de la plateforme (le contact est conservé,
 * seul le rattachement à la liste est supprimé). Utilisé à la suppression de compte.
 */
export async function removeAuthorFromPlatformBrevo(email: string): Promise<string> {
  const apiKey = process.env.PLATFORM_BREVO_API_KEY
  const listId = platformAuthorsListId()
  if (!apiKey || !listId) return 'ignoré'

  const address = email.trim().toLowerCase()
  if (!address) return 'ignoré'

  const response = await fetch(
    `https://api.brevo.com/v3/contacts/lists/${listId}/contacts/remove`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify({ emails: [address] }),
    }
  )

  if (response.ok) return 'ok'
  const errorBody = await response.text()
  if (response.status === 404) return 'ok'
  return `Brevo ${response.status}: ${errorBody.slice(0, 200)}`
}

async function forwardToMailerLite(email: string, config: NewsletterConfig) {
  const body: { email: string; groups?: string[] } = { email }

  if (config.list_id) {
    body.groups = config.list_id.split(',').map((id) => id.trim()).filter(Boolean)
  }

  const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.api_key}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`MailerLite ${response.status}: ${errorBody}`)
  }
}

async function forwardToWebhook(email: string, bookTitle: string, config: NewsletterConfig) {
  if (!config.webhook_url) return

  if (!(await isSafePublicUrl(config.webhook_url))) {
    throw new Error("Webhook refusé : URL non publique ou non https")
  }

  const response = await fetch(config.webhook_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, book: bookTitle, source: 'bookface' }),
  })

  if (!response.ok) {
    throw new Error(`Webhook ${response.status}`)
  }
}

async function sendNotificationEmail(
  subscriberEmail: string,
  bookTitle: string,
  config: NewsletterConfig,
  consents: Consents
) {
  const sender = resolveSender(config)
  if (!sender || !config.notify_email) return

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1f2937;">Nouvel inscrit à ta newsletter</h2>
      <p><strong>Email :</strong> ${escapeHtml(subscriberEmail)}</p>
      <p><strong>Livre :</strong> ${escapeHtml(bookTitle)}</p>
      <p><strong>Consentement transmission :</strong> ${consents.transmission ? 'oui' : 'non'}</p>
      <p><strong>Consentement newsletter :</strong> ${consents.newsletter ? 'oui' : 'non'}</p>
      <p><strong>Plateforme :</strong> As-tu-lu</p>
      <hr>
      <p style="color:#666;font-size:12px;">Cet email a été envoyé automatiquement depuis As-tu-lu.</p>
    </div>
  `

  await sendTransactional(sender, config.notify_email, `Nouvel inscrit : ${subscriberEmail}`, html)
}

export async function unsubscribeFromNewsletter(
  email: string,
  config: NewsletterConfig
): Promise<string[]> {
  const errors: string[] = []
  if (!config.api_key) return errors

  try {
    if (config.provider === 'brevo') {
      const response = await fetch(
        `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
        { method: 'DELETE', headers: { 'api-key': config.api_key } }
      )
      if (!response.ok && response.status !== 404) {
        throw new Error(`Brevo (unsubscribe) ${response.status}`)
      }
    } else if (config.provider === 'mailerlite') {
      const response = await fetch(
        `https://connect.mailerlite.com/api/subscribers/${encodeURIComponent(email)}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${config.api_key}` } }
      )
      if (!response.ok && response.status !== 404) {
        throw new Error(`MailerLite (unsubscribe) ${response.status}`)
      }
    }
  } catch (err) {
    errors.push((err as Error).message)
  }

  return errors
}
