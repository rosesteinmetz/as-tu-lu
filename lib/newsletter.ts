type NewsletterConfig = {
  provider: string
  api_key: string
  list_id: string
  webhook_url: string
  notify_email: string
}

export async function forwardToNewsletter(
  email: string,
  bookTitle: string,
  config: NewsletterConfig
) {
  const errors: string[] = []

  if (config.api_key) {
    try {
      switch (config.provider) {
        case 'brevo':
          await forwardToBrevo(email, config)
          break
        case 'mailerlite':
          await forwardToMailerLite(email, config)
          break
      }
    } catch (err) {
      errors.push((err as Error).message)
    }
  }

  if (config.provider === 'webhook') {
    try {
      await forwardToWebhook(email, bookTitle, config)
    } catch (err) {
      errors.push((err as Error).message)
    }
  }

  if (config.notify_email && config.api_key && config.provider === 'brevo') {
    try {
      await sendNotificationEmail(email, bookTitle, config)
    } catch (err) {
      errors.push(`Notification: ${(err as Error).message}`)
    }
  }

  return errors.length > 0 ? errors : []
}

async function forwardToBrevo(email: string, config: NewsletterConfig) {
  const body: any = { email, updateEnabled: true }

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
    const body = await response.text()
    throw new Error(`Brevo (contacts) ${response.status}: ${body}`)
  }
}

async function forwardToMailerLite(email: string, config: NewsletterConfig) {
  const body: any = { email }

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
    const body = await response.text()
    throw new Error(`MailerLite ${response.status}: ${body}`)
  }
}

async function forwardToWebhook(email: string, bookTitle: string, config: NewsletterConfig) {
  if (!config.webhook_url) return

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
  config: NewsletterConfig
) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': config.api_key,
    },
    body: JSON.stringify({
      to: [{ email: config.notify_email }],
      templateId: null,
      subject: `Nouvel inscrit : ${subscriberEmail}`,
      htmlContent: `
        <h2>Nouvel inscrit à ta newsletter</h2>
        <p><strong>Email :</strong> ${subscriberEmail}</p>
        <p><strong>Livre :</strong> ${bookTitle}</p>
        <p><strong>Plateforme :</strong> As-tu-lu</p>
        <hr>
        <p style="color:#666;font-size:12px;">Cet email a été envoyé automatiquement depuis As-tu-lu.</p>
      `,
      sender: {
        name: 'As-tu-lu',
        email: config.notify_email,
      },
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Brevo (email) ${response.status}: ${body}`)
  }
}
