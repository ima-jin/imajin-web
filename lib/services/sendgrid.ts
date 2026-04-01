/**
 * SendGrid email service — fetch-based (no SDK required)
 */

const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

interface SendVerificationEmailParams {
  to: string;
  verificationUrl: string;
  unsubscribeUrl: string;
}

export async function sendVerificationEmail({
  to,
  verificationUrl,
  unsubscribeUrl,
}: SendVerificationEmailParams): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.EMAIL_FROM || 'noreply@imajin.ca';
  const fromName = process.env.EMAIL_FROM_NAME || 'Imajin';

  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY is not configured');
  }

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .button {
        display: inline-block;
        background: #000;
        color: #fff !important;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 4px;
        margin: 20px 0;
      }
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #eee;
        font-size: 12px;
        color: #666;
      }
    </style>
  </head>
  <body>
    <h1>Confirm Your Subscription</h1>
    <p>Thank you for signing up! Click the button below to confirm your email address and activate your subscription:</p>

    <a href="${verificationUrl}" class="button">Confirm Subscription</a>

    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666;">${verificationUrl}</p>

    <p>This link expires in 24 hours.</p>

    <div class="footer">
      <p>If you didn't sign up for Imajin, you can safely ignore this email.</p>
      <p>
        <a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a>
      </p>
      <p>&copy; ${new Date().getFullYear()} Imajin. All rights reserved.</p>
    </div>
  </body>
</html>`;

  const text = `Confirm Your Subscription

Thank you for signing up! Click the link below to confirm your email address and activate your subscription:

${verificationUrl}

This link expires in 24 hours.

If you didn't sign up for Imajin, you can safely ignore this email.

Unsubscribe: ${unsubscribeUrl}

© ${new Date().getFullYear()} Imajin. All rights reserved.`;

  const response = await fetch(SENDGRID_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from, name: fromName },
      subject: 'Confirm your subscription — Imajin',
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`SendGrid API error ${response.status}: ${body}`);
  }
}
