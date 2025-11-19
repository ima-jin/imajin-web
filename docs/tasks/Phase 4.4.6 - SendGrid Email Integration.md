# Phase 4.4.6: SendGrid Email Integration (Ory Kratos)

**Status:** Ready for Implementation 🟡
**Estimated Effort:** 2 hours
**Dependencies:** Phase 4.4.5 complete (Auth flow integrated), Ory Kratos running
**Next Phase:** Phase 4.4.7 (Testing)

---

## Overview

Configure Ory Kratos to send emails via SendGrid SMTP for verification, recovery, and authentication flows. Customize email templates with Imajin branding.

**Key Difference from DIY Email:**
- Ory Kratos handles all email logic (token generation, expiration, validation)
- We only configure SMTP and customize templates
- No custom verification/reset APIs needed

**Email Types (Auto-sent by Ory):**
1. Email verification (registration flow)
2. Password recovery (recovery flow)
3. Email change verification (settings flow)
4. Login code (passwordless flow - optional)

---

## SendGrid Setup

### Create Account & API Key

1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Verify sender identity: `noreply@imajin.ca`
3. Get SMTP credentials (not API key):
   - SMTP server: `smtp.sendgrid.net`
   - Port: `587` (TLS) or `465` (SSL)
   - Username: `apikey` (literal string)
   - Password: Your SendGrid API key

**Note:** Ory Kratos uses SMTP relay, not SendGrid API.

### Sender Authentication

**Domain Authentication (Recommended):**
- Add DNS records to imajin.ca domain
- Improves deliverability
- Removes "via sendgrid.net" in email clients

**Single Sender Verification (Quick Start):**
- Verify single email address
- Click confirmation link sent to noreply@imajin.ca
- Good for development/testing

---

## Environment Variables

**File:** `.env.local`

```bash
# SendGrid SMTP (for Ory Kratos)
SMTP_CONNECTION_URI=smtps://apikey:SG.your_sendgrid_api_key@smtp.sendgrid.net:465

# Email settings
EMAIL_FROM=noreply@imajin.ca
EMAIL_FROM_NAME=Imajin

# Base URL for email links
NEXT_PUBLIC_BASE_URL=http://localhost:30000
```

**File:** `.env.example`

```bash
# SendGrid SMTP for Ory Kratos
SMTP_CONNECTION_URI=smtps://apikey:your_sendgrid_api_key@smtp.sendgrid.net:465
EMAIL_FROM=noreply@imajin.ca
EMAIL_FROM_NAME=Imajin
NEXT_PUBLIC_BASE_URL=http://localhost:30000
```

**SMTP URI Format:**
```
smtps://username:password@smtp.sendgrid.net:465
```

- `smtps://` → SSL (port 465)
- `smtp://` → TLS (port 587)
- Username: `apikey` (literal)
- Password: Your SendGrid API key

---

## Ory Kratos Configuration

### Update Kratos Config

**File:** `config/kratos/kratos.yml`

```yaml
# ... existing config

courier:
  smtp:
    connection_uri: ${SMTP_CONNECTION_URI}
    from_address: ${EMAIL_FROM}
    from_name: ${EMAIL_FROM_NAME}

  # Email template overrides
  templates:
    verification:
      valid:
        email:
          body:
            html: /etc/config/kratos/email_templates/verification.html.gotmpl
            plaintext: /etc/config/kratos/email_templates/verification.txt.gotmpl
          subject: /etc/config/kratos/email_templates/verification_subject.txt.gotmpl

    recovery:
      valid:
        email:
          body:
            html: /etc/config/kratos/email_templates/recovery.html.gotmpl
            plaintext: /etc/config/kratos/email_templates/recovery.txt.gotmpl
          subject: /etc/config/kratos/email_templates/recovery_subject.txt.gotmpl

selfservice:
  flows:
    verification:
      enabled: true
      ui_url: ${NEXT_PUBLIC_BASE_URL}/auth/verify
      after:
        default_browser_return_url: ${NEXT_PUBLIC_BASE_URL}/account

    recovery:
      enabled: true
      ui_url: ${NEXT_PUBLIC_BASE_URL}/auth/recovery
      after:
        default_browser_return_url: ${NEXT_PUBLIC_BASE_URL}/auth/settings

    settings:
      ui_url: ${NEXT_PUBLIC_BASE_URL}/auth/settings
      after:
        default_browser_return_url: ${NEXT_PUBLIC_BASE_URL}/account
```

---

## Email Templates

### Verification Email

**File:** `config/kratos/email_templates/verification_subject.txt.gotmpl`

```
Verify your email - Imajin
```

**File:** `config/kratos/email_templates/verification.html.gotmpl`

```html
<!DOCTYPE html>
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
    <h1>Verify Your Email</h1>
    <p>Thank you for signing up for Imajin! Click the button below to verify your email address:</p>

    <a href="{{ .VerificationURL }}" class="button">Verify Email</a>

    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666;">{{ .VerificationURL }}</p>

    <p>This link expires in {{ .ExpiresInMinutes }} minutes.</p>

    <div class="footer">
      <p>If you didn't create an account with Imajin, you can safely ignore this email.</p>
      <p>© {{ now.Year }} Imajin. All rights reserved.</p>
    </div>
  </body>
</html>
```

**File:** `config/kratos/email_templates/verification.txt.gotmpl`

```
Verify Your Email

Thank you for signing up for Imajin!

Click this link to verify your email address:
{{ .VerificationURL }}

This link expires in {{ .ExpiresInMinutes }} minutes.

If you didn't create an account with Imajin, you can safely ignore this email.

© {{ now.Year }} Imajin. All rights reserved.
```

---

### Recovery Email (Password Reset)

**File:** `config/kratos/email_templates/recovery_subject.txt.gotmpl`

```
Reset your password - Imajin
```

**File:** `config/kratos/email_templates/recovery.html.gotmpl`

```html
<!DOCTYPE html>
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
    <h1>Reset Your Password</h1>
    <p>You requested to reset your password. Click the button below to set a new password:</p>

    <a href="{{ .RecoveryURL }}" class="button">Reset Password</a>

    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #666;">{{ .RecoveryURL }}</p>

    <p>This link expires in {{ .ExpiresInMinutes }} minutes.</p>

    <div class="footer">
      <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
      <p>© {{ now.Year }} Imajin. All rights reserved.</p>
    </div>
  </body>
</html>
```

**File:** `config/kratos/email_templates/recovery.txt.gotmpl`

```
Reset Your Password

You requested to reset your password.

Click this link to set a new password:
{{ .RecoveryURL }}

This link expires in {{ .ExpiresInMinutes }} minutes.

If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.

© {{ now.Year }} Imajin. All rights reserved.
```

---

## Docker Compose Update

**File:** `docker/docker-compose.auth.yml`

```yaml
services:
  kratos:
    image: oryd/kratos:v1.1
    ports:
      - "4433:4433"
      - "4434:4434"
    environment:
      - DSN=postgres://kratos:kratos_password@kratos-db:5432/kratos
      - SMTP_CONNECTION_URI=${SMTP_CONNECTION_URI}
      - EMAIL_FROM=${EMAIL_FROM}
      - EMAIL_FROM_NAME=${EMAIL_FROM_NAME}
      - NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
    volumes:
      - ../config/kratos:/etc/config/kratos:ro
    command: serve -c /etc/config/kratos/kratos.yml --watch-courier
    depends_on:
      - kratos-db
    networks:
      - intranet

  kratos-db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=kratos
      - POSTGRES_PASSWORD=kratos_password
      - POSTGRES_DB=kratos
    volumes:
      - kratos_db_data:/var/lib/postgresql/data
    networks:
      - intranet

volumes:
  kratos_db_data:

networks:
  intranet:
```

**Key Addition:** `--watch-courier` flag enables Courier (email service).

---

## Template Variables (Ory Provided)

### Verification Email

```go
.VerificationURL      // Full verification link
.ExpiresInMinutes     // Token expiration time
.Identity             // User identity object
.Identity.traits      // User traits (email, name, etc.)
now.Year              // Current year
```

### Recovery Email

```go
.RecoveryURL          // Full recovery link
.ExpiresInMinutes     // Token expiration time
.Identity             // User identity object
.Identity.traits      // User traits (email, name, etc.)
now.Year              // Current year
```

**Go Template Functions:**
- `{{ .Variable }}` - Print variable
- `{{ if .Variable }}...{{ end }}` - Conditional
- `{{ range .Array }}...{{ end }}` - Loop
- `{{ now.Year }}` - Current year

---

## Testing Email Configuration

### Test SMTP Connection

**File:** `scripts/test-smtp.sh`

```bash
#!/bin/bash

# Test SendGrid SMTP connection
docker exec -it imajin-kratos sh -c '
  wget -O - -q --post-data="" http://localhost:4434/health/ready && echo "Kratos is ready"
'

# Send test email via Kratos
curl -X POST http://localhost:4434/admin/courier/messages \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "your-email@example.com",
    "subject": "Test Email",
    "body": "This is a test email from Ory Kratos."
  }'
```

### Test Verification Flow

```bash
# 1. Create registration flow
curl http://localhost:4433/self-service/registration/browser

# 2. Submit registration form (triggers verification email)
curl -X POST http://localhost:4433/self-service/registration \
  -H "Content-Type: application/json" \
  -d '{
    "traits": {
      "email": "test@example.com",
      "name": "Test User",
      "role": "customer"
    },
    "password": "TestPassword123!",
    "method": "password"
  }'

# 3. Check Kratos logs for email delivery
docker logs imajin-kratos | grep courier
```

### Test Recovery Flow

```bash
# 1. Create recovery flow
curl http://localhost:4433/self-service/recovery/browser

# 2. Submit recovery request (triggers recovery email)
curl -X POST http://localhost:4433/self-service/recovery \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "method": "code"
  }'

# 3. Check Kratos logs for email delivery
docker logs imajin-kratos | grep courier
```

---

## Implementation Steps

### Step 1: SendGrid Setup (15 min)

- [ ] Create SendGrid account
- [ ] Verify sender identity (noreply@imajin.ca)
- [ ] Get SendGrid API key
- [ ] Add SMTP_CONNECTION_URI to .env.local
- [ ] Test SMTP credentials with curl

### Step 2: Kratos Configuration (20 min)

- [ ] Update kratos.yml with Courier config
- [ ] Add SMTP environment variables to docker-compose
- [ ] Enable verification and recovery flows
- [ ] Set UI URLs for flows
- [ ] Restart Kratos container

### Step 3: Email Templates (30 min)

- [ ] Create email_templates directory
- [ ] Create verification templates (HTML, TXT, subject)
- [ ] Create recovery templates (HTML, TXT, subject)
- [ ] Test template rendering with Ory

### Step 4: Testing (30 min)

- [ ] Test registration → verification email sent
- [ ] Test recovery → recovery email sent
- [ ] Test email rendering (Gmail, Outlook, mobile)
- [ ] Test expired links
- [ ] Check spam folder

### Step 5: Production Setup (25 min)

- [ ] Configure domain authentication in SendGrid
- [ ] Update SMTP_CONNECTION_URI for production
- [ ] Test production email delivery
- [ ] Monitor delivery rates

---

## Acceptance Criteria

- [ ] SendGrid SMTP configured in Ory Kratos
- [ ] Verification email sends on registration
- [ ] Recovery email sends on password reset request
- [ ] Email templates branded with Imajin styling
- [ ] Plain text fallback renders correctly
- [ ] Links in emails work correctly
- [ ] Expired tokens handled by Ory
- [ ] Emails don't land in spam folder

---

## Testing

### Manual Testing Checklist

**Email Delivery:**
- [ ] Register new user → Verification email received
- [ ] Click verification link → Account verified
- [ ] Request password reset → Recovery email received
- [ ] Click recovery link → Password reset form loads

**Email Rendering:**
- [ ] Gmail renders HTML correctly
- [ ] Outlook renders HTML correctly
- [ ] Mobile email clients render correctly
- [ ] Plain text version works

**Links & Tokens:**
- [ ] Verification link works
- [ ] Recovery link works
- [ ] Expired verification link shows error
- [ ] Expired recovery link shows error

**Spam Prevention:**
- [ ] Emails land in inbox (not spam)
- [ ] Domain authentication configured
- [ ] SPF/DKIM records correct

---

## Troubleshooting

**Emails not sending:**
```bash
# Check Kratos logs
docker logs imajin-kratos | grep courier

# Test SMTP connection
docker exec -it imajin-kratos sh -c 'nc -zv smtp.sendgrid.net 465'

# Verify environment variables
docker exec -it imajin-kratos env | grep SMTP
```

**Emails in spam folder:**
```bash
# Check domain authentication in SendGrid
# Verify SPF record: v=spf1 include:sendgrid.net ~all
# Verify DKIM records match SendGrid settings
# Use SendGrid email validation API
```

**Template not loading:**
```bash
# Check template file paths in kratos.yml
# Verify files mounted in Docker volume
docker exec -it imajin-kratos ls /etc/config/kratos/email_templates/

# Check template syntax (Go templates)
# Test with simple template first
```

**Links not working:**
```bash
# Verify NEXT_PUBLIC_BASE_URL is correct
# Check UI URLs in kratos.yml selfservice flows
# Test with curl to see redirect URLs
```

---

## Environment-Specific Configuration

### Local Development

```bash
SMTP_CONNECTION_URI=smtps://apikey:SG.xxx@smtp.sendgrid.net:465
EMAIL_FROM=noreply@imajin.ca
NEXT_PUBLIC_BASE_URL=http://localhost:30000
```

### Dev/Staging

```bash
SMTP_CONNECTION_URI=smtps://apikey:SG.xxx@smtp.sendgrid.net:465
EMAIL_FROM=noreply@imajin.ca
NEXT_PUBLIC_BASE_URL=https://www-dev.imajin.ca
```

### Production

```bash
SMTP_CONNECTION_URI=smtps://apikey:SG.xxx@smtp.sendgrid.net:465
EMAIL_FROM=noreply@imajin.ca
NEXT_PUBLIC_BASE_URL=https://www.imajin.ca
```

---

## Security Considerations

### SMTP Credentials

- Store SMTP_CONNECTION_URI in environment variables (not code)
- Use secrets management in production
- Rotate SendGrid API keys periodically
- Restrict API key permissions (Mail Send only)

### Email Content

- No sensitive data in email bodies
- Use generic messages ("Reset your password" not "Your password is...")
- Links expire after short duration (Ory default: 1 hour)
- Tokens are single-use (Ory handles invalidation)

### Spam Prevention

- Configure SPF, DKIM, DMARC records
- Use verified sender domain
- Monitor SendGrid delivery metrics
- Handle bounces and complaints

---

## Next Steps

After Phase 4.4.6 complete:
1. **Phase 4.4.7:** Comprehensive testing (unit, integration, E2E)

---

**See Also:**
- `docs/tasks/Phase 4.4.5 - Integration with Existing Features.md` - Previous phase
- `docs/tasks/Phase 4.4.7 - Testing.md` - Next phase
- `docs/tasks/Phase 4.4.2 - Ory Kratos Setup.md` - Kratos configuration
- Ory Kratos Courier Docs: https://www.ory.sh/docs/kratos/emails-sms/sending-emails
- SendGrid SMTP Docs: https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api
