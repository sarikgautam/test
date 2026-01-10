# Registration Email Implementation

## What Was Added

Registration details are now automatically sent via email when a player successfully registers for the tournament.

## Files Modified/Created

### 1. **supabase/functions/send-registration-email/index.ts** (NEW)
   - Supabase Edge Function that handles sending registration confirmation emails
   - Uses Resend API for email delivery
   - Generates professional HTML emails for both player and admin
   - Sends two emails: player confirmation + admin notification
   - Includes error handling and CORS support

### 2. **src/pages/Register.tsx** (MODIFIED)
   - Updated the registration mutation's `mutationFn` to call the email service
   - Sends all registration data to the Edge Function after successful registration
   - Emails are sent to both player and admin (gcnpleague@gmail.com)
   - Includes error handling so registration succeeds even if email fails
   - Email is sent asynchronously in the background

## Email Content

### Player Confirmation Email
The player receives a confirmation email that includes:
- **Personal Information**: Full name, email, phone, date of birth, address, current team
- **Cricket Details**: Role, batting style, bowling style  
- **Emergency Contact**: Name, phone, and email
- **Status**: Notification that registration is pending admin review
- **Professional Styling**: Branded header and organized sections

### Admin Notification Email
The admin (gcnpleague@gmail.com) receives a detailed notification with:
- **Player Information**: All registration details
- **Cricket Details**: Role, batting and bowling styles
- **Emergency Contact**: Full emergency contact information
- **Action Required**: Alert that registration needs review
- **Review Link**: Button to access admin panel to review registration

## How It Works

1. User fills out registration form and submits
2. Registration data is saved to the database
3. Player/season registration is created with "pending" status
4. Email function is called with player details
5. **Two emails are sent**:
   - ✅ Confirmation email to player with their registration details
   - ✅ Notification email to admin (gcnpleague@gmail.com) with all registration details and review link
6. Confirmation toast is shown to user
7. Success page is displayed

## Setup Required

See [EMAIL_SETUP.md](./EMAIL_SETUP.md) for detailed setup instructions.

### Quick Setup:
1. Get a Resend API key from [resend.com](https://resend.com)
2. Add the API key to Supabase secrets: `RESEND_API_KEY`
3. Deploy the Edge Function: `supabase functions deploy send-registration-email`
4. Done! Emails will now be sent on registration

## Configuration Options

### Change Email Service
To use a different email service, edit `supabase/functions/send-registration-email/index.ts`:

**For SendGrid:**
```typescript
const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${Deno.env.get("SENDGRID_API_KEY")}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    personalizations: [{ to: [{ email: data.email }] }],
    from: { email: "noreply@gccricketfeud.com" },
    subject: "Your Registration is Confirmed - GC Cricket Feud",
    content: [{ type: "text/html", value: emailContent }],
  }),
});
```

### Customize Sender Email
Change this line in the Edge Function:
```typescript
from: "noreply@gccricketfeud.com", // Update this
```

### Customize Email Template
Edit the `emailContent` variable in the Edge Function to change:
- Colors and styling
- Section titles and text
- Information included in the email
- HTML structure

## Testing

To test locally:
```bash
# Deploy the function first
supabase functions deploy send-registration-email

# Run a test by submitting a registration
```

To test with a specific email address, you can use free services like:
- [Mailinator](https://www.mailinator.com)
- [10minutemail](https://10minutemail.com)
- [TempMail](https://temp-mail.org)

## Security Notes

- ✅ API key stored securely in Supabase secrets
- ✅ Email validation happens before sending
- ✅ No sensitive data logged in email function
- ✅ CORS headers configured for secure cross-origin requests
- ✅ Email sending is asynchronous and doesn't block registration

## Performance

- Email sending happens in background (non-blocking)
- Registration completes immediately
- Email delivery typically takes 1-5 seconds
- If email fails, registration still succeeds and user is notified

## Admin Notification (Optional Enhancement)

You can also add an email to the admin team when a registration is received:
1. Add another email send call with admin email
2. Use a different subject and template for admin
3. Send all registration details to admin for review

## Monitoring

Check email delivery status:
1. Resend Dashboard → Messages: See all sent emails
2. Supabase Function Logs: View function execution and errors
3. User feedback: Ask players if they received confirmation email
