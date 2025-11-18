import { sendEmail } from "@/lib/email";
import { connectDB } from "@/lib/database";
import { Setting } from "@/models/settings";
import { User } from "@/models/user";

interface FleetRequestData {
  partnerName: string;
  partnerEmail: string;
  vehicleName: string;
  vehicleCategory: string;
  baseUrl?: string;
}

interface FleetApprovalData {
  partnerName: string;
  partnerEmail: string;
  vehicleName: string;
  vehicleCategory: string;
  baseUrl?: string;
}

interface FleetRejectionData {
  partnerName: string;
  partnerEmail: string;
  vehicleName: string;
  vehicleCategory: string;
  rejectionReason?: string;
  baseUrl?: string;
}

// Email validation utility
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateFleetRequestEmailHTML(data: FleetRequestData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>New Fleet Assignment Request</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f0f9ff; padding: 20px; border-radius: 5px; margin-bottom: 20px; text-align: center; border: 2px solid #0ea5e9; }
    .header h1 { margin: 0; color: #0369a1; }
    .notification-icon { font-size: 48px; margin-bottom: 10px; }
    .section { margin-bottom: 20px; }
    .details { background-color: #f8fafc; padding: 15px; border-radius: 5px; border-left: 4px solid #0ea5e9; }
    .footer { color: #718096; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
    .cta-button {
      display: inline-block;
      background-color: #0369a1;
      color: #ffffff !important;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 15px;
      font-weight: bold;
      text-align: center;
    }
    .highlight { color: #2d3748; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="notification-icon">🚗</div>
      <h1>New Fleet Assignment Request</h1>
      <p>A partner has requested fleet assignment</p>
    </div>

    <div class="section">
      <p>A partner has submitted a fleet assignment request that requires your approval.</p>
    </div>

    <div class="section">
      <div class="details">
        <h3>Request Details:</h3>
        <p><strong>Partner:</strong> ${data.partnerName} (${data.partnerEmail})</p>
        <p><strong>Requested Vehicle:</strong> ${data.vehicleName}</p>
        <p><strong>Category:</strong> ${data.vehicleCategory}</p>
        <p><strong>Requested At:</strong> ${new Date().toLocaleString()}</p>
      </div>
    </div>

    <div class="section">
      <h3>Next Steps:</h3>
      <ul>
        <li>Review the partner's profile and documents</li>
        <li>Verify vehicle availability</li>
        <li>Approve or reject the fleet assignment request</li>
        <li>The partner will be notified via email</li>
      </ul>
    </div>

    <div style="text-align: center;">
      <a href="${data.baseUrl?.replace(/\/$/, "")}/dashboard/partners" class="cta-button">
        Review Partner Requests
      </a>
    </div>

    <div class="footer">
      <p>This is an automated notification from your booking system.</p>
      <p>Please review fleet assignment requests promptly to maintain service quality.</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateFleetApprovalEmailHTML(data: FleetApprovalData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Fleet Assignment Approved</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f0fdf4; padding: 20px; border-radius: 5px; margin-bottom: 20px; text-align: center; border: 2px solid #22c55e; }
    .header h1 { margin: 0; color: #15803d; }
    .success-icon { font-size: 48px; margin-bottom: 10px; }
    .section { margin-bottom: 20px; }
    .details { background-color: #f7fafc; padding: 15px; border-radius: 5px; }
    .footer { color: #718096; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
    .cta-button {
      display: inline-block;
      background-color: #15803d;
      color: #ffffff !important;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 15px;
      font-weight: bold;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="success-icon">✅</div>
      <h1>Fleet Assignment Approved!</h1>
      <p>Your fleet assignment request has been approved</p>
    </div>

    <div class="section">
      <p>Dear ${data.partnerName},</p>
      <p>Great news! Your fleet assignment request has been <strong>approved</strong>.</p>
      <p>You can now start accepting ride assignments with your assigned vehicle.</p>
    </div>

    <div class="section">
      <div class="details">
        <h3>Assigned Vehicle:</h3>
        <p><strong>Vehicle:</strong> ${data.vehicleName}</p>
        <p><strong>Category:</strong> ${data.vehicleCategory}</p>
        <p><strong>Approved At:</strong> ${new Date().toLocaleString()}</p>
      </div>
    </div>

    <div class="section">
      <h3>What happens next:</h3>
      <ul>
        <li>You can now accept ride assignments</li>
        <li>Check your partner dashboard for available rides</li>
        <li>Vehicle details are available in your fleet section</li>
        <li>Contact support if you need any assistance</li>
      </ul>
    </div>

    <div style="text-align: center;">
      <a href="${data.baseUrl?.replace(/\/$/, "")}/partners/dashboard" class="cta-button">
        Go to Dashboard
      </a>
    </div>

    <div class="footer">
      <p>Thank you for being part of our partner network!</p>
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateFleetRejectionEmailHTML(data: FleetRejectionData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Fleet Assignment Request Update</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #fef2f2; padding: 20px; border-radius: 5px; margin-bottom: 20px; text-align: center; border: 2px solid #ef4444; }
    .header h1 { margin: 0; color: #dc2626; }
    .warning-icon { font-size: 48px; margin-bottom: 10px; }
    .section { margin-bottom: 20px; }
    .details { background-color: #fff7ed; padding: 15px; border-radius: 5px; border-left: 4px solid #f59e0b; }
    .footer { color: #718096; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
    .cta-button {
      display: inline-block;
      background-color: #0369a1;
      color: #ffffff !important;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 15px;
      font-weight: bold;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="warning-icon">⚠️</div>
      <h1>Fleet Assignment Request Update</h1>
      <p>Regarding your fleet assignment request</p>
    </div>

    <div class="section">
      <p>Dear ${data.partnerName},</p>
      <p>Thank you for your interest in fleet assignment. After careful review, we regret to inform you that we are unable to approve your fleet assignment request at this time.</p>
    </div>

    ${data.rejectionReason ? `
    <div class="section">
      <div class="details">
        <h3>Reason:</h3>
        <p>${data.rejectionReason}</p>
      </div>
    </div>
    ` : ''}

    <div class="section">
      <p>You can submit a new request for a different vehicle or contact our support team for more information.</p>
    </div>

    <div class="section">
      <h3>What you can do:</h3>
      <ul>
        <li>Request a different vehicle from the available fleet</li>
        <li>Contact support for clarification</li>
        <li>Reapply after addressing any concerns</li>
      </ul>
    </div>

    <div style="text-align: center;">
      <a href="${data.baseUrl?.replace(/\/$/, "")}/partners/fleet" class="cta-button">
        Request Different Vehicle
      </a>
    </div>

    <div class="footer">
      <p>We appreciate your partnership and look forward to working with you.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendFleetRequestNotificationEmail(data: FleetRequestData) {
  try {
    // Validate input
    if (!isValidEmail(data.partnerEmail)) {
      console.error("Invalid partner email address:", data.partnerEmail);
      return false;
    }

    // Get SMTP settings
    await connectDB();
    const settings = await Setting.findOne();

    if (!settings?.smtpHost) {
      console.error("SMTP not configured");
      return {
        success: false,
        error: "SMTP not configured",
      };
    }

    const fromAddress = settings?.smtpFrom || settings?.smtpUser || "noreply@booking.com";
    const fromField = settings?.smtpSenderName ? `${settings.smtpSenderName} <${fromAddress}>` : fromAddress;

    // Get admin email from users collection
    const adminUsers = await User.find({ role: 'admin' }).select('email');
    const adminEmail = adminUsers.length > 0 ? adminUsers[0].email : (settings?.adminEmail || process.env.ADMIN_EMAIL || fromAddress);

    const emailHTML = generateFleetRequestEmailHTML(data);

    const success = await sendEmail({
      from: fromField,
      to: adminEmail,
      subject: "🚗 New Fleet Assignment Request - Action Required",
      html: emailHTML,
      text: `A new fleet assignment request has been submitted by ${data.partnerName} for vehicle ${data.vehicleName}. Please review and approve/reject the request.`,
    });

    return success;
  } catch (error) {
    console.error("Error sending fleet request notification email:", error);
    return false;
  }
}

export async function sendFleetApprovalEmail(data: FleetApprovalData) {
  try {
    // Validate email
    if (!isValidEmail(data.partnerEmail)) {
      console.error("Invalid partner email address:", data.partnerEmail);
      return false;
    }

    // Get SMTP settings
    await connectDB();
    const settings = await Setting.findOne();

    if (!settings?.smtpHost) {
      console.error("SMTP not configured");
      return {
        success: false,
        error: "SMTP not configured",
      };
    }

    const fromAddress = settings?.smtpFrom || settings?.smtpUser || "noreply@booking.com";
    const fromField = settings?.smtpSenderName ? `${settings.smtpSenderName} <${fromAddress}>` : fromAddress;

    const emailHTML = generateFleetApprovalEmailHTML(data);

    const success = await sendEmail({
      from: fromField,
      to: data.partnerEmail,
      subject: "🎉 Fleet Assignment Approved - Start Accepting Rides!",
      html: emailHTML,
      text: `Congratulations ${data.partnerName}! Your fleet assignment request for ${data.vehicleName} has been approved. You can now start accepting ride assignments.`,
    });

    return success;
  } catch (error) {
    console.error("Error sending fleet approval email:", error);
    return false;
  }
}

export async function sendFleetRejectionEmail(data: FleetRejectionData) {
  try {
    // Validate email
    if (!isValidEmail(data.partnerEmail)) {
      console.error("Invalid partner email address:", data.partnerEmail);
      return false;
    }

    // Get SMTP settings
    await connectDB();
    const settings = await Setting.findOne();

    if (!settings?.smtpHost) {
      console.error("SMTP not configured");
      return {
        success: false,
        error: "SMTP not configured",
      };
    }

    const fromAddress = settings?.smtpFrom || settings?.smtpUser || "noreply@booking.com";
    const fromField = settings?.smtpSenderName ? `${settings.smtpSenderName} <${fromAddress}>` : fromAddress;

    const emailHTML = generateFleetRejectionEmailHTML(data);

    const success = await sendEmail({
      from: fromField,
      to: data.partnerEmail,
      subject: "Fleet Assignment Request Update",
      html: emailHTML,
      text: `Dear ${data.partnerName}, your fleet assignment request for ${data.vehicleName} could not be approved at this time. ${data.rejectionReason ? `Reason: ${data.rejectionReason}` : ''}`,
    });

    return success;
  } catch (error) {
    console.error("Error sending fleet rejection email:", error);
    return false;
  }
}