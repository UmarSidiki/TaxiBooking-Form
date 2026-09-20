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
    body { font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background-color: #f5f5f5; padding: 15px; border-left: 4px solid #0369a1; margin-bottom: 20px; }
    .header h1 { margin: 0 0 5px 0; font-size: 18px; color: #0369a1; }
    .section { margin-bottom: 20px; }
    .section h2 { font-size: 15px; color: #0369a1; margin: 15px 0 8px 0; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; }
    tr { border-bottom: 1px solid #f0f0f0; }
    td { padding: 6px 0; font-size: 13px; }
    td:first-child { width: 40%; color: #666; }
    .details { background-color: #f9f9f9; padding: 10px; border-radius: 3px; }
    .footer { font-size: 12px; color: #999; margin-top: 25px; border-top: 1px solid #ddd; padding-top: 15px; }
    a { color: #0369a1; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Fleet Assignment Request</h1>
      <p>A partner has requested fleet assignment</p>
    </div>

    <div class="section">
      <h2>Request Details</h2>
      <div class="details">
        <table>
          <tr><td><strong>Partner:</strong></td><td>${data.partnerName}</td></tr>
          <tr><td><strong>Email:</strong></td><td><a href="mailto:${data.partnerEmail}">${data.partnerEmail}</a></td></tr>
          <tr><td><strong>Vehicle:</strong></td><td>${data.vehicleName}</td></tr>
          <tr><td><strong>Category:</strong></td><td>${data.vehicleCategory}</td></tr>
          <tr><td><strong>Requested:</strong></td><td>${new Date().toLocaleString()}</td></tr>
        </table>
      </div>
    </div>

    <div class="section">
      <p><strong>Next Steps:</strong></p>
      <p>• Review partner profile and documents<br>• Verify vehicle availability<br>• Approve or reject the request<br>• Partner will be notified via email</p>
    </div>

    <div class="section">
      <p>Review this request: <a href="${data.baseUrl?.replace(/\/$/, "")}/dashboard/partners">Go to Partner Requests</a></p>
    </div>

    <div class="footer">
      <p>This is an automated notification. Please review promptly.</p>
      <p>&copy; ${new Date().getFullYear()} Booking Service. All rights reserved.</p>
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
    body { font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background-color: #f5f5f5; padding: 15px; border-left: 4px solid #16a34a; margin-bottom: 20px; }
    .header h1 { margin: 0 0 5px 0; font-size: 18px; color: #16a34a; }
    .section { margin-bottom: 20px; }
    .section h2 { font-size: 15px; color: #16a34a; margin: 15px 0 8px 0; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; }
    tr { border-bottom: 1px solid #f0f0f0; }
    td { padding: 6px 0; font-size: 13px; }
    td:first-child { width: 40%; color: #666; }
    .details { background-color: #f9f9f9; padding: 10px; border-radius: 3px; }
    .footer { font-size: 12px; color: #999; margin-top: 25px; border-top: 1px solid #ddd; padding-top: 15px; }
    a { color: #16a34a; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Fleet Assignment Approved</h1>
      <p>Your request has been approved</p>
    </div>

    <div class="section">
      <p>Dear ${data.partnerName},</p>
      <p>Your fleet assignment request has been <strong>approved</strong>. You can now start accepting ride assignments.</p>
    </div>

    <div class="section">
      <h2>Assigned Vehicle</h2>
      <div class="details">
        <table>
          <tr><td><strong>Vehicle:</strong></td><td>${data.vehicleName}</td></tr>
          <tr><td><strong>Category:</strong></td><td>${data.vehicleCategory}</td></tr>
          <tr><td><strong>Approved:</strong></td><td>${new Date().toLocaleString()}</td></tr>
        </table>
      </div>
    </div>

    <div class="section">
      <p><strong>Next Steps:</strong></p>
      <p>• Check your partner dashboard<br>• Review vehicle details<br>• Start accepting ride assignments<br>• Contact support if needed</p>
    </div>

    <div class="section">
      <p>Go to: <a href="${data.baseUrl?.replace(/\/$/, "")}/partners/dashboard">Partner Dashboard</a></p>
    </div>

    <div class="footer">
      <p>Thank you for being part of our partner network!</p>
      <p>&copy; ${new Date().getFullYear()} Booking Service. All rights reserved.</p>
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
    body { font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background-color: #f5f5f5; padding: 15px; border-left: 4px solid #dc2626; margin-bottom: 20px; }
    .header h1 { margin: 0 0 5px 0; font-size: 18px; color: #dc2626; }
    .section { margin-bottom: 20px; }
    .section h2 { font-size: 15px; color: #dc2626; margin: 15px 0 8px 0; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; }
    tr { border-bottom: 1px solid #f0f0f0; }
    td { padding: 6px 0; font-size: 13px; }
    td:first-child { width: 40%; color: #666; }
    .details { background-color: #f9f9f9; padding: 10px; border-radius: 3px; border-left: 3px solid #f59e0b; }
    .footer { font-size: 12px; color: #999; margin-top: 25px; border-top: 1px solid #ddd; padding-top: 15px; }
    a { color: #0369a1; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Fleet Assignment Request Update</h1>
      <p>Regarding your fleet assignment request</p>
    </div>

    <div class="section">
      <p>Dear ${data.partnerName},</p>
      <p>Thank you for your interest. We are unable to approve your fleet assignment request at this time.</p>
    </div>

    ${data.rejectionReason ? `
    <div class="section">
      <h2>Reason</h2>
      <div class="details">
        <p>${data.rejectionReason}</p>
      </div>
    </div>
    ` : ''}

    <div class="section">
      <p>You can submit a new request or contact support for more information.</p>
      <p><strong>Options:</strong></p>
      <p>• Request a different vehicle<br>• Contact support<br>• Reapply later</p>
    </div>

    <div class="section">
      <p>Request a vehicle: <a href="${data.baseUrl?.replace(/\/$/, "")}/partners/fleet">Submit New Request</a></p>
    </div>

    <div class="footer">
      <p>We appreciate your interest in our partnership program.</p>
      <p>&copy; ${new Date().getFullYear()} Booking Service. All rights reserved.</p>
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