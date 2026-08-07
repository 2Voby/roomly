import nodemailer from 'nodemailer';

import { env } from '../../config/env.js';
import type { EmailJobData } from './email-queue.js';

let transporter: nodemailer.Transporter | null | undefined;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter !== undefined) return transporter;
  if (!env.SMTP_HOST) {
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth:
      env.SMTP_USER && env.SMTP_PASSWORD
        ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
        : undefined,
  });
  return transporter;
}

export async function sendEmail(data: EmailJobData): Promise<void> {
  const currentTransporter = getTransporter();
  if (!currentTransporter) {
    process.stdout.write(
      [
        'SMTP is not configured; email fallback:',
        `To: ${data.to}`,
        `Subject: ${data.subject}`,
        data.text,
        data.confirmationUrl ? `Verification link: ${data.confirmationUrl}` : '',
        '',
      ]
        .filter(Boolean)
        .join('\n'),
    );
    return;
  }

  await currentTransporter.sendMail({
    from: env.SMTP_FROM,
    to: data.to,
    subject: data.subject,
    text: data.text,
    html: data.html,
  });
}
