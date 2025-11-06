# Deployment Runbook

## Quick Reference

**Staging:** https://imajin-staging.vercel.app
**Production:** https://www.imajin.ca (or imajin.vercel.app)

---

## Pre-Deployment Checklist

Before deploying to ANY environment:

- [ ] All tests passing: `npm test`
- [ ] Lint clean: `npm run lint`
- [ ] Type-check passing: `npm run type-check`
- [ ] Build succeeds locally: `npm run build`

---

## Staging Deployment (Automatic)

**Triggered by:** Push/merge to `main` branch

**Process:**
1. GitHub Actions runs tests (see `.github/workflows/test.yml`)
2. If tests pass, Vercel auto-deploys to staging
3. Deployment takes ~2-3 minutes
4. Staging URL updates automatically

**Verification:**
- [ ] Homepage loads: https://imajin-staging.vercel.app
- [ ] Product pages render
- [ ] Cart functionality works
- [ ] Images load from Cloudinary
- [ ] API routes respond

**If deployment fails:**
1. Check Vercel deployment logs
2. Check GitHub Actions run
3. Fix issue locally
4. Push fix to `main`

---

## Production Deployment (Manual)

**Triggered by:** Manual promotion in Vercel dashboard

**Pre-Deploy Steps:**

1. **Verify staging fully functional:**
   ```bash
   npm run test:smoke:ci  # Run smoke tests
   ```

2. **Run database migration (if schema changed):**
   ```bash
   DATABASE_URL=<production-neon-url> npm run db:push
   ```
   ⚠️ **CAUTION:** This modifies production database

3. **Sync products (if products.json changed):**
   ```bash
   DATABASE_URL=<production-neon-url> npm run sync:products
   ```

**Deploy Steps:**

1. Go to Vercel dashboard → Deployments tab
2. Find the staging deployment you want to promote
3. Click "..." menu → "Promote to Production"
4. Confirm promotion
5. Wait ~2 minutes for deployment

**Post-Deploy Verification:**

- [ ] Homepage loads: https://www.imajin.ca
- [ ] Product pages render correctly
- [ ] Test cart → checkout flow
- [ ] Place small test order ($1 item)
- [ ] Verify order appears in Stripe dashboard
- [ ] Check webhook delivery in Stripe (should show success)
- [ ] Monitor Vercel logs for 10 minutes

**If production deploy fails:**
1. Check Vercel deployment logs immediately
2. If critical, rollback (see Rollback section)
3. Fix issue on staging first
4. Re-test on staging
5. Re-attempt production deployment

---

## Rollback Procedure

**If production deployment has issues:**

### Option 1: Instant Rollback (Vercel Dashboard)

1. Go to Vercel dashboard → Deployments
2. Find the last known good deployment
3. Click "..." menu → "Promote to Production"
4. Rollback complete in <1 minute

### Option 2: Database Rollback (If Migration Broke Things)

1. Go to Neon dashboard → Backups
2. Select production database
3. Choose restore point (before migration)
4. Restore database
5. Rollback code deployment (Option 1)

**Database rollback is slow (~5-10 minutes). Avoid migrations on Fridays.**

---

## Environment Variables

### Where They Live

**All environment variables stored in Vercel dashboard:**
- Project Settings → Environment Variables
- Separate values for Preview/Development (staging) and Production

### Required Variables

**Both environments need:**

```env
NODE_ENV=production
NEXT_PUBLIC_ENV=staging | production
NEXT_PUBLIC_BASE_URL=https://...
NEXT_PUBLIC_SITE_URL=https://...
NEXT_PUBLIC_API_BASE_URL=https://...
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_test_... | sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... | pk_live_...
CLOUDINARY_CLOUD_NAME=imajin
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=imajin
```

**Key differences between environments:**
- Staging uses `sk_test_` and `pk_test_` Stripe keys
- Production uses `sk_live_` and `pk_live_` Stripe keys
- Different `DATABASE_URL` (staging vs production Neon database)
- Different `NEXT_PUBLIC_BASE_URL` (staging.vercel.app vs www.imajin.ca)

### Updating Environment Variables

1. Go to Vercel dashboard → Project Settings → Environment Variables
2. Edit the variable
3. Select which environment(s) to update
4. Save changes
5. **Redeploy to pick up new values** (env vars only update on new deployments)

---

## Database Migrations

### Testing Migrations

**ALWAYS test on staging first:**

```bash
# 1. Run migration on staging database
DATABASE_URL=<staging-neon-url> npm run db:push

# 2. Deploy code to staging
git push origin main

# 3. Test manually on staging
# 4. If successful, proceed to production
```

### Running Production Migrations

```bash
# Connect to production database and apply schema changes
DATABASE_URL=<production-neon-url> npm run db:push
```

### Migration Best Practices

- **Additive changes are safe:** Adding columns, tables, indexes
- **Destructive changes require care:** Dropping columns, renaming, changing types
- **Two-phase deploys for destructive changes:**
  1. Phase 1: Deploy code that works with OLD and NEW schema
  2. Run migration
  3. Phase 2: Deploy code that uses only NEW schema

### Backup Before Migrations

Neon automatically backs up daily:
- **Free tier:** 7-day retention
- **Paid tier:** 30-day retention
- Access backups: Neon dashboard → Backups → Restore point-in-time

---

## Monitoring

### Vercel Dashboard (Built-in)

- **Runtime logs:** Vercel → Deployments → [deployment] → Logs
- **Build logs:** Vercel → Deployments → [deployment] → Build Logs
- **Function metrics:** Vercel → Analytics (Pro plan)

### Stripe Dashboard

- **Webhook deliveries:** Stripe → Developers → Webhooks → [endpoint]
- Check webhook success rate after every production deploy
- Failed webhooks = orders not created properly

### Health Check Endpoint

```bash
# Check if app is responding
curl https://www.imajin.ca/api/health
```

Expected response: `{"status": "ok", "timestamp": "..."}`

### What to Monitor Daily

- [ ] Vercel deployment status (check for failed builds)
- [ ] Stripe webhook delivery success rate (should be >99%)
- [ ] Neon database storage usage (free tier has limits)
- [ ] Cloudinary bandwidth usage (free tier has limits)

---

## Stripe Webhook Configuration

### Webhook Endpoints

**Staging:**
- URL: `https://imajin-staging.vercel.app/api/webhooks/stripe`
- Events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
- Signing secret: Stored in Vercel env vars as `STRIPE_WEBHOOK_SECRET`

**Production:**
- URL: `https://www.imajin.ca/api/webhooks/stripe`
- Events: Same as staging
- Signing secret: Different from staging (separate webhook)

### Testing Webhook Delivery

```bash
# View recent webhook attempts
# Stripe dashboard → Developers → Webhooks → [endpoint] → Logs

# Look for:
# - HTTP 200 responses (success)
# - Response time <2 seconds
# - No failed deliveries
```

### Webhook Troubleshooting

**If webhooks fail:**
1. Check Stripe dashboard → Webhooks → [endpoint] → Logs
2. Look at the error message
3. Check Vercel logs at the time of the webhook
4. Common issues:
   - Wrong `STRIPE_WEBHOOK_SECRET` env var
   - Webhook signature verification failing
   - Database connection issue
   - App not deployed yet

---

## Cost Tracking

### Current Monthly Costs

**Launch configuration (~$40/month):**
- Vercel Hobby: $20/mo (production)
- Vercel Free: $0 (staging/preview)
- Neon Free: $0 (staging database, 0.5GB limit)
- Neon Scale: $19/mo (production database, starts at 1GB)
- Cloudinary Free: $0 (25GB bandwidth/month)

### Cost Scaling Triggers

**Monitor these metrics monthly:**
- Vercel bandwidth usage (check dashboard)
- Neon storage usage (check dashboard)
- Cloudinary bandwidth (check dashboard)
- Vercel function executions (check dashboard)

**When to upgrade:**
- Neon storage >0.4GB on staging → upgrade to paid ($19/mo)
- Neon storage >10GB on production → upgrade to Pro ($69/mo)
- Cloudinary bandwidth >20GB/month → upgrade to paid ($89/mo)
- Vercel bandwidth consistently high → consider Pro ($40/mo)

---

## Security Checklist

### Pre-Launch (Required)

- [ ] HTTPS enabled (automatic with Vercel)
- [ ] All environment variables in Vercel dashboard (not in code)
- [ ] Database not publicly accessible (Neon handles this)
- [ ] Input validation on all API routes (Zod schemas)
- [ ] Stripe webhook signature verification enabled
- [ ] No secrets in git history (check with `git log -S "sk_live_"`)
- [ ] Error messages don't leak sensitive data

### Post-Launch (Week 1)

- [ ] Test Stripe webhook signature verification
- [ ] Verify database backups are working (Neon dashboard)
- [ ] Test order flow end-to-end
- [ ] Review Vercel logs for suspicious activity

### Ongoing (Monthly)

- [ ] Run `npm audit` and fix high/critical vulnerabilities
- [ ] Review Stripe webhook delivery failures
- [ ] Check for unusual traffic patterns in Vercel logs
- [ ] Verify Neon backups still running

---

## Common Issues & Solutions

### Build Failing on Vercel

**Symptoms:** Deployment fails during build step

**Troubleshooting:**
1. Check Vercel build logs for exact error
2. Run `npm run build` locally to reproduce
3. Common causes:
   - TypeScript errors (`npm run type-check`)
   - Linting errors (`npm run lint`)
   - Missing environment variables (check Vercel env vars)
   - Out of memory (increase Node memory in vercel.json)

**Solution:**
```bash
# Fix locally first
npm run type-check  # Fix TS errors
npm run lint        # Fix lint errors
npm run build       # Verify build works
git push origin main  # Deploy fixed code
```

### Database Connection Failing

**Symptoms:** API routes return 500 errors, logs show "connection refused"

**Troubleshooting:**
1. Check `DATABASE_URL` in Vercel env vars
2. Verify Neon database is running (Neon dashboard)
3. Test connection locally:
   ```bash
   DATABASE_URL=<vercel-database-url> npm run db:push
   ```

**Common causes:**
- Wrong `DATABASE_URL` format
- Database suspended (Neon free tier auto-suspends after inactivity)
- Connection limit reached (upgrade Neon plan)

### Images Not Loading

**Symptoms:** Product images show broken image icon

**Troubleshooting:**
1. Check Cloudinary dashboard (images exist?)
2. Check browser console for errors
3. Verify `CLOUDINARY_CLOUD_NAME` in Vercel env vars
4. Test Cloudinary URL directly in browser

**Common causes:**
- Wrong `CLOUDINARY_CLOUD_NAME`
- Images not uploaded to Cloudinary
- Cloudinary bandwidth limit exceeded (free tier)

### Checkout Not Creating Orders

**Symptoms:** Payment succeeds in Stripe, but no order in database

**Troubleshooting:**
1. Check Stripe webhook deliveries (Stripe dashboard)
2. Look for failed webhooks
3. Check Vercel logs at time of payment
4. Verify `STRIPE_WEBHOOK_SECRET` is correct

**Common causes:**
- Webhook not configured in Stripe
- Wrong `STRIPE_WEBHOOK_SECRET`
- Webhook signature verification failing
- Database error during order creation

---

## Emergency Contacts

**If production is down and you need help:**

1. Check Vercel status: https://www.vercel-status.com
2. Check Neon status: https://neon.tech/status
3. Check Stripe status: https://status.stripe.com
4. Check Cloudinary status: https://status.cloudinary.com

**Support channels:**
- Vercel: https://vercel.com/support
- Neon: https://neon.tech/docs/introduction/support
- Stripe: https://support.stripe.com

---

## Deployment Schedule

**Best practices:**

- **Monday-Thursday:** Safe to deploy to production
- **Friday:** Avoid production deploys (deploy to staging only)
- **Weekends:** Emergency hotfixes only
- **Holidays:** Avoid deploys unless critical

**Recommended deployment windows:**
- **Staging:** Anytime (auto-deploys on merge to main)
- **Production:** Tuesday-Thursday, 10am-2pm (business hours, high availability for monitoring)

---

## Backup & Disaster Recovery

### Database Backups

**Neon automatic backups:**
- **Staging:** 7-day retention (free tier)
- **Production:** 30-day retention (paid tier)

**Manual backup (before major changes):**
```bash
# Export production database
DATABASE_URL=<production-neon-url> pg_dump > backup-$(date +%Y%m%d).sql

# Encrypt backup
gpg -c backup-$(date +%Y%m%d).sql

# Store encrypted backup securely
# Delete unencrypted file
rm backup-$(date +%Y%m%d).sql
```

**Restore from backup:**
```bash
# Option 1: Neon point-in-time restore (Neon dashboard)
# Option 2: Import from manual backup
DATABASE_URL=<production-neon-url> psql < backup-20250128.sql
```

### Code Backups

**GitHub is source of truth:**
- All code is version controlled
- Can restore any previous commit
- No additional backup needed

### Environment Variable Backups

**Quarterly backup process:**
1. Vercel dashboard → Project Settings → Environment Variables
2. Document all variables (names only, not values)
3. Store encrypted copy of values in password manager
4. Test restore process on staging

---

## Future Considerations

### When to Upgrade Services

**Vercel Hobby ($20/mo) → Pro ($40/mo):**
- Need preview deployments for all PRs
- Want password protection on staging
- Need more detailed analytics
- Require team collaboration features

**Neon Scale ($19/mo) → Pro ($69/mo):**
- Database >10GB
- Need higher connection limits (>100 concurrent)
- Want longer backup retention (30 → 90 days)

**Cloudinary Free → Paid ($89/mo):**
- Bandwidth >20GB/month consistently
- Need advanced image transformations
- Want video support

### When to Consider Self-Hosting

**Only when ALL of these are true:**
- Hosting costs >$200/month for 3+ consecutive months
- Traffic patterns are predictable (not spiky)
- Have 40+ hours for migration work
- Have ongoing time for server maintenance
- Self-hosting would save >$100/month after time cost

**Migration timeline: 4 weeks minimum**

See Dr. DevOps guide for detailed self-hosting migration process.

---

**Last Updated:** 2025-10-30
**Maintained By:** Development team
**Review Cadence:** Monthly or after major infrastructure changes
