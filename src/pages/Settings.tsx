import { Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Field, Input, Select } from '@/components/ui/Field'
import { useApp } from '@/context/AppContext'
import { isLocalMode } from '@/data'
import { hourInZone, todayISO } from '@/lib/dates'

const TIMEZONES = [
  'America/Chicago',
  'America/New_York',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Australia/Sydney',
  'UTC',
]

export function Settings() {
  const { profile, user, saveProfile, timezone } = useApp()
  const [webhook, setWebhook] = useState('')
  const [zone, setZone] = useState(timezone)
  const [status, setStatus] = useState('')
  const [testStatus, setTestStatus] = useState('')

  useEffect(() => {
    if (profile) {
      setWebhook(profile.discordWebhookUrl ?? '')
      setZone(profile.timezone || timezone)
    }
  }, [profile, timezone])

  const webhookValid = webhook === '' || /^https:\/\/discord(app)?\.com\/api\/webhooks\//.test(webhook)

  async function handleSave() {
    if (!webhookValid) {
      setStatus('That does not look like a Discord webhook URL.')
      return
    }
    await saveProfile({ discordWebhookUrl: webhook.trim(), timezone: zone })
    setStatus('Settings saved.')
    setTimeout(() => setStatus(''), 2500)
  }

  async function sendTest() {
    if (!webhook || !webhookValid) {
      setTestStatus('Add a valid webhook URL first.')
      return
    }
    setTestStatus('Sending…')
    try {
      const response = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '🔔 Habitat Tracker test message — reminders are wired up correctly.',
        }),
      })
      setTestStatus(response.ok ? 'Test message sent.' : `Discord returned ${response.status}.`)
    } catch {
      setTestStatus('Request failed — check the URL and your network.')
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="stat-label">Configuration</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-heading sm:text-2xl">Settings</h1>
      </header>

      <Card>
        <CardHeader title="Account" />
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Email</dt>
            <dd className="text-body">{user?.email ?? '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Storage</dt>
            <dd className="text-body">{isLocalMode ? 'Local browser (demo)' : 'Firebase Firestore'}</dd>
          </div>
        </dl>
      </Card>

      <Card delay={0.05}>
        <CardHeader
          title="Timezone"
          subtitle="Determines which calendar day counts as today, and when the evening prompt appears"
        />
        <Field label="IANA timezone" htmlFor="timezone">
          <Select id="timezone" value={zone} onChange={(e) => setZone(e.target.value)}>
            {Array.from(new Set([zone, ...TIMEZONES])).map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </Select>
        </Field>
        <p className="mt-2 text-xs text-muted">
          Right now that is {todayISO(zone)} at about {String(hourInZone(zone)).padStart(2, '0')}:00.
        </p>
      </Card>

      <Card delay={0.1}>
        <CardHeader
          title="Discord reminders"
          subtitle="Used by the GitHub Actions workflow for the 7am and 8pm nudges"
        />
        <Field
          label="Webhook URL"
          htmlFor="webhook"
          hint="Server Settings → Integrations → Webhooks → Copy Webhook URL"
        >
          <Input
            id="webhook"
            type="url"
            value={webhook}
            onChange={(e) => setWebhook(e.target.value)}
            placeholder="https://discord.com/api/webhooks/…"
          />
        </Field>
        {!webhookValid ? (
          <p className="mt-2 text-xs text-danger">That does not look like a Discord webhook URL.</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void sendTest()}>
            <Send className="h-3.5 w-3.5" aria-hidden />
            Send test message
          </Button>
          {testStatus ? <span className="text-xs text-muted">{testStatus}</span> : null}
        </div>
        <p className="mt-3 rounded-lg border border-border/60 bg-elevated/30 p-3 text-xs text-muted">
          The scheduled reminders run from GitHub Actions and read the webhook from the{' '}
          <code className="text-body">DISCORD_WEBHOOK_URL</code> repository secret. Saving it here is
          for reference and testing only.
        </p>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={() => void handleSave()}>Save settings</Button>
        {status ? <span className="text-xs text-muted">{status}</span> : null}
      </div>
    </div>
  )
}
