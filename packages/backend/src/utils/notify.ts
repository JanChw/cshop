import { getBool, getSetting } from './settings'
import { config } from '../config'
import nodemailer from 'nodemailer'

export type NotificationEvent = 'new_order' | 'stock_alert' | 'user_register' | 'verification'

export type NotificationChannel = 'email' | 'sms' | 'none'

export interface NotifyResult {
  channel: NotificationChannel
  recipient: string
  subject: string
  message: string
}

export function resolveChannel(): NotificationChannel {
  if (getBool('notify_email', true)) return 'email'
  if (getBool('notify_sms', false)) return 'sms'
  return 'none'
}

function encodeSubject(subject: string): string {
  return '=?utf-8?B?' + Buffer.from(subject, 'utf-8').toString('base64') + '?='
}

function buildEmailBody(event: NotificationEvent, subject: string, message: string): string {
  return [
    `[CShop 通知] ${subject}`,
    '',
    message,
    '',
    `事件类型: ${event}`,
    `发送时间: ${new Date().toISOString()}`,
  ].join('\n')
}

let cachedTransporter: nodemailer.Transporter | null = null
let cachedConfigKey = ''

function getTransporter(): nodemailer.Transporter | null {
  const { smtpHost, smtpPort, smtpUser, smtpPass } = config
  if (!smtpHost || !smtpUser || !smtpPass) return null

  const key = `${smtpHost}|${smtpPort}|${smtpUser}|${smtpPass}`
  if (cachedTransporter && cachedConfigKey === key) return cachedTransporter

  cachedTransporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  })
  cachedConfigKey = key
  return cachedTransporter
}

export interface SendEmailOptions {
  to: string
  subject: string
  body: string
  event: NotificationEvent
}

export async function sendEmail({ to, subject, body, event }: SendEmailOptions): Promise<boolean> {
  const { smtpUser } = config
  const transporter = getTransporter()

  if (!transporter || !smtpUser) {
    console.log(`[NOTIFY EMAIL DEV-FALLBACK] event=${event} to=${to} | ${subject} | ${body}`)
    return false
  }

  try {
    await transporter.sendMail({
      from: smtpUser,
      to,
      subject: encodeSubject(subject),
      text: body,
    })
    console.log(`[NOTIFY EMAIL SENT] event=${event} to=${to} | ${subject}`)
    return true
  } catch (err: any) {
    console.error(`[NOTIFY EMAIL FAILED] event=${event} to=${to} | ${subject} | error=${err?.message ?? err}`)
    return false
  }
}

export function sendNotification(event: NotificationEvent, subject: string, message: string): NotifyResult | null {
  if (!getBool(`notify_${event}`, false)) return null

  const channel = resolveChannel()
  if (channel === 'none') return null

  const recipient = getSetting('notify_receive_email', 'admin@cshop.com')

  if (channel === 'email') {
    const body = buildEmailBody(event, subject, message)
    void sendEmail({ to: recipient, subject, body, event }).catch((err) => {
      console.error('[NOTIFY EMAIL UNCAUGHT]', err)
    })
  } else {
    console.log(`[NOTIFY SMS SIMULATED] event=${event} to=${recipient} | ${subject} | ${message}`)
  }

  return { channel, recipient, subject, message }
}

export async function sendTestEmail(to: string): Promise<{ ok: boolean; reason?: string }> {
  const subject = 'CShop 邮件通知测试'
  const body = buildEmailBody('user_register' as NotificationEvent, subject, '这是一封来自 CShop 的测试邮件，用于验证 SMTP 配置是否正确。')
  const ok = await sendEmail({ to, subject, body, event: 'user_register' })
  if (!ok) {
    const { smtpHost, smtpUser } = config
    if (!smtpHost || !smtpUser) {
      return { ok: false, reason: 'SMTP 未配置（SEND_EMAIL / EMAIL / EMAIL_AUTH_PASSWORD 缺失）' }
    }
    return { ok: false, reason: '发送失败，请检查 SMTP 配置或网络' }
  }
  return { ok: true }
}
