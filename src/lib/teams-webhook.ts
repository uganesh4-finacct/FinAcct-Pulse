// ============================================================
// Microsoft Teams Webhook — FinAcct Pulse Alerts
// Sends notifications to FinAcct Pulse Alerts channel
// ============================================================

export async function sendTeamsAlert({
  title,
  message,
  urgency = 'medium',
  clientName,
  raisedBy,
  link,
}: {
  title: string
  message: string
  urgency?: 'low' | 'medium' | 'high' | 'critical'
  clientName?: string
  raisedBy?: string
  link?: string
}) {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL
  if (!webhookUrl) {
    console.warn('TEAMS_WEBHOOK_URL not set — skipping Teams notification')
    return
  }

  const colorMap = {
    low:      '00b4d8',
    medium:   'f59e0b',
    high:     'f97316',
    critical: 'e11d48',
  }

  const payload = {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: colorMap[urgency],
    summary: title,
    sections: [{
      activityTitle: `**${title}**`,
      activitySubtitle: clientName ? `Client: ${clientName}` : 'FinAcct Pulse Alert',
      activityText: message,
      facts: [
        ...(clientName ? [{ name: 'Client', value: clientName }] : []),
        ...(raisedBy   ? [{ name: 'Raised by', value: raisedBy }] : []),
        { name: 'Priority', value: urgency.toUpperCase() },
        { name: 'Time', value: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET' },
      ],
      ...(link ? {
        potentialAction: [{
          '@type': 'OpenUri',
          name: 'View in FinAcct Pulse',
          targets: [{ os: 'default', uri: link }]
        }]
      } : {})
    }]
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) console.error('Teams webhook failed:', res.status)
  } catch (err) {
    console.error('Teams webhook error:', err)
  }
}
