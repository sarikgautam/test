import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = "gcnpleague@gmail.com";

interface RegistrationEmailRequest {
  playerName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  role: string;
  currentTeam?: string;
  battingStyle?: string;
  bowlingStyle?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactEmail?: string;
}

const sendPlayerConfirmationEmail = async (data: RegistrationEmailRequest) => {
  const emailContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>GC Cricket Feud - Registration Confirmation</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        line-height: 1.5;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f9fafb;
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px;
        border-radius: 8px 8px 0 0;
        text-align: center;
      }
      .content {
        background-color: white;
        padding: 30px;
        border-radius: 0 0 8px 8px;
      }
      .section {
        margin: 20px 0;
        padding: 15px;
        background-color: #f3f4f6;
        border-radius: 6px;
        border-left: 4px solid #667eea;
      }
      .section-title {
        font-weight: 600;
        margin-bottom: 10px;
        color: #1f2937;
      }
      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #e5e7eb;
      }
      .detail-row:last-child {
        border-bottom: none;
      }
      .label {
        font-weight: 500;
        color: #4b5563;
      }
      .value {
        color: #1f2937;
        word-break: break-word;
        text-align: right;
      }
      .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        font-size: 12px;
        color: #6b7280;
        text-align: center;
      }
      .status-badge {
        display: inline-block;
        background-color: #fef3c7;
        color: #92400e;
        padding: 8px 12px;
        border-radius: 4px;
        margin-top: 10px;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Registration Confirmed!</h1>
        <p>Welcome to GC Cricket Feud</p>
      </div>
      
      <div class="content">
        <p>Hello <strong>${data.playerName}</strong>,</p>
        
        <p>Thank you for registering for the GC Cricket Feud tournament! We have successfully received your registration details. Your registration is now pending admin review.</p>
        
        <div class="section">
          <div class="section-title">📋 Personal Information</div>
          <div class="detail-row">
            <span class="label">Full Name</span>
            <span class="value">${data.playerName}</span>
          </div>
          <div class="detail-row">
            <span class="label">Email</span>
            <span class="value">${data.email}</span>
          </div>
          <div class="detail-row">
            <span class="label">Phone</span>
            <span class="value">${data.phone}</span>
          </div>
          <div class="detail-row">
            <span class="label">Date of Birth</span>
            <span class="value">${new Date(data.dateOfBirth).toLocaleDateString('en-AU')}</span>
          </div>
          <div class="detail-row">
            <span class="label">Address</span>
            <span class="value">${data.address}</span>
          </div>
          ${data.currentTeam ? `
          <div class="detail-row">
            <span class="label">Current Team</span>
            <span class="value">${data.currentTeam}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="section">
          <div class="section-title">🏏 Cricket Details</div>
          <div class="detail-row">
            <span class="label">Role</span>
            <span class="value">${data.role.replace(/_/g, ' ').toUpperCase()}</span>
          </div>
          ${data.battingStyle ? `
          <div class="detail-row">
            <span class="label">Batting Style</span>
            <span class="value">${data.battingStyle}</span>
          </div>
          ` : ''}
          ${data.bowlingStyle ? `
          <div class="detail-row">
            <span class="label">Bowling Style</span>
            <span class="value">${data.bowlingStyle}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="section">
          <div class="section-title">🆘 Emergency Contact</div>
          <div class="detail-row">
            <span class="label">Name</span>
            <span class="value">${data.emergencyContactName}</span>
          </div>
          <div class="detail-row">
            <span class="label">Phone</span>
            <span class="value">${data.emergencyContactPhone}</span>
          </div>
          ${data.emergencyContactEmail ? `
          <div class="detail-row">
            <span class="label">Email</span>
            <span class="value">${data.emergencyContactEmail}</span>
          </div>
          ` : ''}
        </div>
        
        <div>
          <span class="status-badge">⏳ Pending Admin Review</span>
          <p style="margin-top: 15px; color: #6b7280;">Your registration will be reviewed by our admin team. You will receive another email once your registration is approved or if we need any additional information.</p>
        </div>
        
        <p style="margin-top: 20px;">If you have any questions or need to update your registration, please don't hesitate to contact us.</p>
        
        <div class="footer">
          <p>GC Cricket Feud Management | All Rights Reserved</p>
          <p>This is an automated email. Please do not reply directly.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "GCNPL League <onboarding@resend.dev>",
      reply_to: ADMIN_EMAIL,
      to: data.email,
      subject: "Your Registration is Confirmed - GC Cricket Feud",
      html: emailContent,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Resend API Error (Player Email):", error);
    throw new Error(`Failed to send player email: ${response.statusText}`);
  }

  return await response.json();
};

const sendAdminNotificationEmail = async (data: RegistrationEmailRequest) => {
  const emailContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>New Player Registration - GC Cricket Feud</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        line-height: 1.5;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f9fafb;
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px;
        border-radius: 8px 8px 0 0;
        text-align: center;
      }
      .content {
        background-color: white;
        padding: 30px;
        border-radius: 0 0 8px 8px;
      }
      .section {
        margin: 20px 0;
        padding: 15px;
        background-color: #f3f4f6;
        border-radius: 6px;
        border-left: 4px solid #667eea;
      }
      .section-title {
        font-weight: 600;
        margin-bottom: 10px;
        color: #1f2937;
      }
      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #e5e7eb;
      }
      .detail-row:last-child {
        border-bottom: none;
      }
      .label {
        font-weight: 500;
        color: #4b5563;
      }
      .value {
        color: #1f2937;
        word-break: break-word;
        text-align: right;
      }
      .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        font-size: 12px;
        color: #6b7280;
        text-align: center;
      }
      .action-button {
        display: inline-block;
        background-color: #667eea;
        color: white;
        padding: 12px 24px;
        border-radius: 6px;
        text-decoration: none;
        margin-top: 15px;
        font-weight: 500;
      }
      .alert {
        background-color: #fef3c7;
        border-left: 4px solid #f59e0b;
        padding: 15px;
        margin: 20px 0;
        border-radius: 6px;
        color: #92400e;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎯 New Player Registration</h1>
        <p>A new player has registered for GC Cricket Feud</p>
      </div>
      
      <div class="content">
        <p>Hello Admin,</p>
        
        <p>A new player registration has been submitted and is pending your review.</p>
        
        <div class="section">
          <div class="section-title">📋 Personal Information</div>
          <div class="detail-row">
            <span class="label">Full Name</span>
            <span class="value">${data.playerName}</span>
          </div>
          <div class="detail-row">
            <span class="label">Email</span>
            <span class="value">${data.email}</span>
          </div>
          <div class="detail-row">
            <span class="label">Phone</span>
            <span class="value">${data.phone}</span>
          </div>
          <div class="detail-row">
            <span class="label">Date of Birth</span>
            <span class="value">${new Date(data.dateOfBirth).toLocaleDateString('en-AU')}</span>
          </div>
          <div class="detail-row">
            <span class="label">Address</span>
            <span class="value">${data.address}</span>
          </div>
          ${data.currentTeam ? `
          <div class="detail-row">
            <span class="label">Current Team</span>
            <span class="value">${data.currentTeam}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="section">
          <div class="section-title">🏏 Cricket Details</div>
          <div class="detail-row">
            <span class="label">Role</span>
            <span class="value">${data.role.replace(/_/g, ' ').toUpperCase()}</span>
          </div>
          ${data.battingStyle ? `
          <div class="detail-row">
            <span class="label">Batting Style</span>
            <span class="value">${data.battingStyle}</span>
          </div>
          ` : ''}
          ${data.bowlingStyle ? `
          <div class="detail-row">
            <span class="label">Bowling Style</span>
            <span class="value">${data.bowlingStyle}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="section">
          <div class="section-title">🆘 Emergency Contact</div>
          <div class="detail-row">
            <span class="label">Name</span>
            <span class="value">${data.emergencyContactName}</span>
          </div>
          <div class="detail-row">
            <span class="label">Phone</span>
            <span class="value">${data.emergencyContactPhone}</span>
          </div>
          ${data.emergencyContactEmail ? `
          <div class="detail-row">
            <span class="label">Email</span>
            <span class="value">${data.emergencyContactEmail}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="alert">
          ⚠️ <strong>Action Required:</strong> Please review this registration in the admin panel and approve or request amendments.
        </div>
        
        <p style="margin-top: 20px; text-align: center;">
          <a href="https://gcnpl.com/admin" class="action-button">Review Registration</a>
        </p>
        
        <div class="footer">
          <p>GC Cricket Feud Management System | Auto-generated Email</p>
          <p>This is an automated email. Please do not reply directly.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "GCNPL Bot <onboarding@resend.dev>",
      reply_to: ADMIN_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New Registration: ${data.playerName}`,
      html: emailContent,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Resend API Error (Admin Email):", error);
    throw new Error(`Failed to send admin email: ${response.statusText}`);
  }

  return await response.json();
};

const sendBothEmails = async (data: RegistrationEmailRequest) => {
  const results = await Promise.allSettled([
    sendPlayerConfirmationEmail(data),
    sendAdminNotificationEmail(data),
  ]);

  return results;
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const data: RegistrationEmailRequest = await req.json();

    // Validate required fields
    if (!data.email || !data.playerName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, playerName" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const results = await sendBothEmails(data);
    
    const playerEmailResult = results[0];
    const adminEmailResult = results[1];
    
    const playerEmailSent = playerEmailResult.status === "fulfilled";
    const adminEmailSent = adminEmailResult.status === "fulfilled";

    if (!playerEmailSent && !adminEmailSent) {
      throw new Error("Failed to send both emails");
    }

    console.log("Player email sent:", playerEmailSent);
    console.log("Admin email sent:", adminEmailSent);

    return new Response(
      JSON.stringify({
        success: true,
        playerEmailSent,
        adminEmailSent,
        playerEmail: playerEmailResult.status === "fulfilled" ? playerEmailResult.value : null,
        adminEmail: adminEmailResult.status === "fulfilled" ? adminEmailResult.value : null,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error sending registration emails:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
