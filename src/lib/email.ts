/**
 * Email sending via Resend.
 * Set RESEND_API_KEY and RESEND_FROM in .env.local to send real emails.
 */

import { Resend } from 'resend'

export interface SendEmailParams {
  to: string
  toName?: string
  subject: string
  template: 'notification' | 'alert'
  data: {
    title: string
    message: string
    linkUrl?: string
    linkLabel?: string
  }
}

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM ?? 'FinAcct Pulse <onboarding@resend.dev>'
const resend = resendApiKey ? new Resend(resendApiKey) : null

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildHtml(params: SendEmailParams): string {
  const { template, data } = params
  const title = escapeHtml(data.title)
  const message = escapeHtml(data.message)
  const linkUrl = data.linkUrl ? escapeHtml(data.linkUrl) : ''
  const linkLabel = data.linkLabel ? escapeHtml(data.linkLabel) : 'View'

  const isAlert = template === 'alert'
  const accentColor = isAlert ? '#dc2626' : '#7c3aed'
  const borderColor = isAlert ? '#fecaca' : '#ddd6fe'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f4f4f5;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid ${borderColor};overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <div style="height:4px;background:${accentColor};"></div>
    <div style="padding:24px;">
      <h1 style="margin:0 0 12px;font-size:18px;font-weight:600;color:#18181b;">${title}</h1>
      <p style="margin:0;font-size:15px;line-height:1.5;color:#52525b;">${message}</p>
      ${linkUrl ? `
      <p style="margin:16px 0 0;">
        <a href="${linkUrl}" style="display:inline-block;padding:10px 16px;background:${accentColor};color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500;">${linkLabel}</a>
      </p>
      ` : ''}
    </div>
    <div style="padding:16px 24px;background:#fafafa;border-top:1px solid #e4e4e7;">
      <p style="margin:0;font-size:12px;color:#71717a;">FinAcct Pulse — Internal Operations</p>
    </div>
  </div>
</body>
</html>
`.trim()
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  if (resend && resendApiKey) {
    try {
      const html = buildHtml(params)
      await resend.emails.send({
        from: fromEmail,
        to: params.to,
        subject: params.subject,
        html,
      })
    } catch (err) {
      console.error('[email] Resend send failed:', err)
      throw err
    }
  } else {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[email] (no RESEND_API_KEY) stub:', params.template, params.to, params.subject, params.data)
    }
  }
}
