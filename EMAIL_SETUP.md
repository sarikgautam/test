# Email Setup Guide - Registration Confirmation

## Overview
Registration confirmation emails are now sent to players when they successfully submit their registration. The email contains all their submitted details in a nicely formatted HTML email.

## Setup Instructions

### 1. Get Resend API Key
1. Go to [Resend.com](https://resend.com)
2. Sign up or log in to your account
3. Navigate to the API Keys section
4. Create a new API key
5. Copy the API key

### 2. Add Resend API Key to Supabase

#### Option A: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions** or **Secrets**
3. Add a new secret:
   - Name: `RESEND_API_KEY`
   - Value: `(paste your Resend API key)`
4. Save the secret

#### Option B: Using Supabase CLI
```bash
supabase secrets set RESEND_API_KEY "your_resend_api_key_here"
```

### 3. Configure Email Sender Domain (Resend)
1. In Resend dashboard, add your domain
2. Follow the DNS verification steps
3. Update the `from` email in the Edge Function if needed

For development/testing, you can use:
- `noreply@gccricketfeud.com` (requires domain setup)
- Or Resend's default onboarding domain

### 4. Deploy Edge Function
```bash
supabase functions deploy send-registration-email
```

### 5. Test the Setup
1. Go to your application's registration page
2. Fill out the form completely
3. Submit the registration
4. Check the player's email inbox for the confirmation email

## Email Template Details

The confirmation email includes:
- ✅ Greeting with player name
- 📋 Personal Information (name, email, phone, DOB, address, current team)
- 🏏 Cricket Details (role, batting style, bowling style)
- 🆘 Emergency Contact Information
- ⏳ Status notification (pending admin review)

## Troubleshooting

### Email not being sent:
1. Check Supabase function logs:
   ```bash
   supabase functions list
   supabase functions logs send-registration-email
   ```

2. Verify the API key is set correctly:
   ```bash
   supabase secrets list
   ```

3. Check that the email address is valid

### Email going to spam:
1. Verify your domain in Resend
2. Set up SPF, DKIM, and DMARC records
3. Use a consistent sender email address

### CORS Issues:
The Edge Function includes CORS headers to allow requests from your frontend.

## Alternative Email Services

If you prefer to use a different email service (SendGrid, Mailgun, etc.), you can modify the Edge Function:

1. Update the API endpoint in `supabase/functions/send-registration-email/index.ts`
2. Change the request headers and body format
3. Re-deploy the function

Example services:
- **SendGrid**: `https://api.sendgrid.com/v3/mail/send`
- **Mailgun**: `https://api.mailgun.net/v3/{domain}/messages`
- **AWS SES**: Use AWS SDK

## Cost Considerations
- **Resend**: First 100 emails/day free, then $0.20 per email
- **SendGrid**: 100 emails/day free forever
- **Mailgun**: First 1,000 emails/month free
