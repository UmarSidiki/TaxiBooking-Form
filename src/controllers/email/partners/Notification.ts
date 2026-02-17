import { sendEmail } from "@/lib/email";
import { connectDB } from "@/lib/database";
import { Setting } from "@/models/settings";

interface PartnerData {
  name: string;
  email: string;
  rejectionReason?: string;
  baseUrl?: string;
}

// Email validation utility
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateApprovalEmailHTML(partnerData: PartnerData, primaryColor: string = '#EAB308') {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Partner Application Approved</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background-color: #f5f5f5; padding: 15px; border-left: 4px solid ${primaryColor}; margin-bottom: 20px; }
    .header h1 { margin: 0 0 5px 0; font-size: 18px; color: ${primaryColor}; }
    .section { margin-bottom: 20px; }
    .section h2 { font-size: 15px; color: ${primaryColor}; margin: 15px 0 8px 0; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; }
    .details { background-color: #f9f9f9; padding: 10px; border-radius: 3px; }
    .footer { font-size: 12px; color: #999; margin-top: 25px; border-top: 1px solid #ddd; padding-top: 15px; }
    a { color: ${primaryColor}; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Congratulations!</h1>
      <p>Your partner application has been approved</p>
    </div>

    <div class="section">
      <p>Dear ${partnerData.name},</p>
      <p>We are pleased to inform you that your partner application has been <strong>approved</strong>!</p>
      <p>You can now log in to your partner dashboard and start accepting ride assignments.</p>
    </div>

    <div class="section">
      <h2>Next Steps</h2>
      <div class="details">
        <p>• Log in to your partner dashboard<br>
        • Review your profile information<br>
        • Check for assigned rides<br>
        • Start accepting bookings</p>
      </div>
    </div>

    <div class="section">
      <p>Go to dashboard: <a href="${partnerData.baseUrl?.replace(/\/$/, "")}/partners/login">Partner Dashboard</a></p>
    </div>

    <div class="footer">
      <p>Thank you for partnering with us!</p>
      <p>&copy; ${new Date().getFullYear()} Booking Service. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateRejectionEmailHTML(partnerData: PartnerData, primaryColor: string = '#EAB308', warningColor: string = '#f59e0b') {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Partner Application Status</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background-color: #f5f5f5; padding: 15px; border-left: 4px solid ${warningColor}; margin-bottom: 20px; }
    .header h1 { margin: 0 0 5px 0; font-size: 18px; color: ${warningColor}; }
    .section { margin-bottom: 20px; }
    .section h2 { font-size: 15px; color: ${warningColor}; margin: 15px 0 8px 0; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; }
    .details { background-color: #f9f9f9; padding: 10px; border-radius: 3px; border-left: 3px solid ${warningColor}; }
    .footer { font-size: 12px; color: #999; margin-top: 25px; border-top: 1px solid #ddd; padding-top: 15px; }
    a { color: ${primaryColor}; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Application Status Update</h1>
      <p>Regarding your partner application</p>
    </div>

    <div class="section">
      <p>Dear ${partnerData.name},</p>
      <p>Thank you for your interest. After review of your application, we are unable to approve it at this time.</p>
    </div>

    ${
      partnerData.rejectionReason
        ? `
    <div class="section">
      <h2>Reason</h2>
      <div class="details">
        <p>${partnerData.rejectionReason}</p>
      </div>
    </div>
    `
        : ""
    }

    <div class="section">
      <p>You may reapply after addressing any concerns or contact support for more information.</p>
    </div>

    <div class="section">
      <p>Contact us: <a href="${partnerData.baseUrl?.replace(/\/$/, "")}/contact">Support</a></p>
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

function generateSuspensionEmailHTML(partnerData: PartnerData, primaryColor: string = '#EAB308', warningColor: string = '#f59e0b') {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Account Suspension Notice</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background-color: #fef3c7; padding: 15px; border-left: 4px solid ${warningColor}; margin-bottom: 20px; }
    .header h1 { margin: 0 0 5px 0; font-size: 18px; color: #92400e; }
    .section { margin-bottom: 20px; }
    .section h2 { font-size: 15px; color: #92400e; margin: 15px 0 8px 0; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; }
    .warning { background-color: #fffbeb; padding: 12px; border-left: 3px solid ${warningColor}; color: #78350f; }
    .footer { font-size: 12px; color: #999; margin-top: 25px; border-top: 1px solid #ddd; padding-top: 15px; }
    a { color: ${primaryColor}; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Account Suspension Notice</h1>
      <p>Important: Your partner account has been suspended</p>
    </div>

    <div class="section">
      <p>Dear ${partnerData.name},</p>
      <p>We are writing to inform you that your partner account has been suspended effective immediately.</p>
    </div>

    ${
      partnerData.rejectionReason
        ? `
    <div class="section">
      <h2>Reason for Suspension</h2>
      <div class="warning">
        <p>${partnerData.rejectionReason}</p>
      </div>
    </div>
    `
        : ""
    }

    <div class="section">
      <h2>What This Means</h2>
      <p>Your account access has been temporarily suspended. You will not be able to manage bookings or access your dashboard during this period.</p>
    </div>

    <div class="section">
      <p>If you have questions or wish to appeal this decision, please contact our support team immediately.</p>
    </div>

    <div class="section">
      <p>Contact support: <a href="${partnerData.baseUrl?.replace(/\/$/, "")}/contact">Support Center</a></p>
    </div>

    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} Booking Service. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendPartnerApprovalEmail(partnerData: PartnerData) {
  try {
    // Validate email
    if (!isValidEmail(partnerData.email)) {
      console.error("Invalid email address:", partnerData.email);
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

    const fromAddress = settings?.smtpFrom || settings?.smtpUser;
    const fromField = settings?.smtpSenderName ? `${settings.smtpSenderName} <${fromAddress}>` : fromAddress;
    const primaryColor = settings?.primaryColor || '#EAB308';
    
    const emailHTML = generateApprovalEmailHTML(partnerData, primaryColor);

    const success = await sendEmail({
      from: fromField,
      to: partnerData.email,
      subject: "🎉 Your Partner Application Has Been Approved!",
      html: emailHTML,
      text: `Congratulations ${partnerData.name}! Your partner application has been approved. You can now log in to your partner dashboard.`,
    });

    return success;
  } catch (error) {
    console.error("Error sending partner approval email:", error);
    return false;
  }
}

export async function sendPartnerRejectionEmail(partnerData: PartnerData) {
  try {
    // Validate email
    if (!isValidEmail(partnerData.email)) {
      console.error("Invalid email address:", partnerData.email);
      return false;
    }

    // Get SMTP settings
    await connectDB();
    const settings = await Setting.findOne();

    const fromAddress = settings?.smtpFrom || settings?.smtpUser || "noreply@booking.com";
    const fromField = settings?.smtpSenderName ? `${settings.smtpSenderName} <${fromAddress}>` : fromAddress;
    const primaryColor = settings?.primaryColor || '#EAB308';
    
    const emailHTML = generateRejectionEmailHTML(partnerData, primaryColor);

    const success = await sendEmail({
      from: fromField,
      to: partnerData.email,
      subject: "Partner Application Status Update",
      html: emailHTML,
      text: `Dear ${partnerData.name}, Thank you for your interest in becoming a partner. After review, we are unable to approve your application at this time. ${partnerData.rejectionReason ? `Reason: ${partnerData.rejectionReason}` : ''}`,
    });

    return success;
  } catch (error) {
    console.error("Error sending partner rejection email:", error);
    return false;
  }
}

export async function sendPartnerSuspensionEmail(partnerData: PartnerData) {
  try {
    // Validate email
    if (!isValidEmail(partnerData.email)) {
      console.error("Invalid email address:", partnerData.email);
      return false;
    }

    // Get SMTP settings
    await connectDB();
    const settings = await Setting.findOne();

    const fromAddress = settings?.smtpFrom || settings?.smtpUser || "noreply@booking.com";
    const fromField = settings?.smtpSenderName ? `${settings.smtpSenderName} <${fromAddress}>` : fromAddress;
    const primaryColor = settings?.primaryColor || '#EAB308';

    const emailHTML = generateSuspensionEmailHTML(partnerData, primaryColor);

    const success = await sendEmail({
      from: fromField,
      to: partnerData.email,
      subject: "⚠️ Partner Account Suspended - Action Required",
      html: emailHTML,
      text: `Dear ${partnerData.name}, Your partner account has been suspended. Your account data will be permanently deleted after 30 days. ${partnerData.rejectionReason ? `Reason: ${partnerData.rejectionReason}` : ''}`,
    });

    return success;
  } catch (error) {
    console.error("Error sending partner suspension email:", error);
    return false;
  }
}

interface RideNotificationData {
  tripId: string;
  pickup: string;
  dropoff: string;
  date: string;
  time: string;
  vehicleType: string;
  passengerCount: number;
  partnerName: string;
  partnerEmail: string;
  baseUrl?: string;
  partnerAmount?: number;
  currencySymbol?: string;
}

function generateRideNotificationEmailHTML(rideData: RideNotificationData, primaryColor: string = '#EAB308') {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>New Ride Assignment Available</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px; text-align: center; border: 2px solid ${primaryColor}; }
    .header h1 { margin: 0; color: ${primaryColor}; }
    .notification-icon { font-size: 48px; margin-bottom: 10px; }
    .section { margin-bottom: 20px; }
    .ride-details { background-color: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid ${primaryColor}; }
    .ride-details h3 { color: ${primaryColor}; margin-top: 0; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
    .detail-item { background-color: white; padding: 8px; border-radius: 3px; }
    .detail-label { font-weight: bold; color: #64748b; font-size: 0.9em; }
    .detail-value { color: #1e293b; margin-top: 2px; }
    .footer { color: #718096; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
    .cta-button {
      display: inline-block;
      background-color: ${primaryColor};
      color: #ffffff !important;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 15px;
      font-weight: bold;
      text-align: center;
    }
    .urgent { color: #dc2626; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="notification-icon">🚗</div>
      <h1>New Ride Available!</h1>
      <p>A new ride assignment is waiting for you</p>
        ${
          typeof rideData.partnerAmount === "number"
            ? `
          <div class="detail-item">
            <div class="detail-label">Your Earnings</div>
            <div class="detail-value">${rideData.currencySymbol ?? "€"}${rideData.partnerAmount.toFixed(2)}</div>
          </div>`
            : ""
        }
    </div>

    <div class="section">
      <p>Dear ${rideData.partnerName},</p>
      <p>A new ride has been booked that matches your approved fleet type. You have the opportunity to accept this ride assignment.</p>
      <p class="urgent">⚡ First-come, first-served: Accept quickly to secure this assignment!</p>
    </div>

    <div class="section">
      <div class="ride-details">
        <h3>Ride Details</h3>
        <div class="details-grid">
          <div class="detail-item">
            <div class="detail-label">Trip ID</div>
            <div class="detail-value">${rideData.tripId}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Date & Time</div>
            <div class="detail-value">${rideData.date} at ${rideData.time}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Pickup Location</div>
            <div class="detail-value">${rideData.pickup}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Drop-off Location</div>
            <div class="detail-value">${rideData.dropoff || 'N/A'}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Vehicle Type</div>
            <div class="detail-value">${rideData.vehicleType}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Passengers</div>
            <div class="detail-value">${rideData.passengerCount}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <h3>What happens next?</h3>
      <ul>
        <li>Log in to your dashboard to view the full ride details</li>
        <li>Accept the ride assignment if available</li>
        <li>Prepare for the pickup time</li>
        <li>Contact the passenger if needed</li>
      </ul>
    </div>

    <div style="text-align: center;">
      <a href="${rideData.baseUrl?.replace(/\/$/, "")}/partners/dashboard" class="cta-button">
        View Ride & Accept
      </a>
    </div>

    <div class="footer">
      <p>This is an automated notification. Please do not reply to this email.</p>
      <p>If you have questions about your account, contact our support team.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendRideNotificationEmail(rideData: RideNotificationData) {
  try {
    // Validate email
    if (!isValidEmail(rideData.partnerEmail)) {
      console.error("Invalid email address:", rideData.partnerEmail);
      return false;
    }

    // Get SMTP settings
    await connectDB();
    const settings = await Setting.findOne();

    if (!settings?.smtpHost) {
      console.error("SMTP not configured");
      return false;
    }

    const fromAddress = settings?.smtpFrom || settings?.smtpUser;
    const fromField = settings?.smtpSenderName ? `${settings.smtpSenderName} <${fromAddress}>` : fromAddress;
    const primaryColor = settings?.primaryColor || '#EAB308';

    const emailHTML = generateRideNotificationEmailHTML(rideData, primaryColor);

    const success = await sendEmail({
      from: fromField,
      to: rideData.partnerEmail,
      subject: "🚗 New Ride Assignment Available - Action Required",
      html: emailHTML,
      text: `Dear ${rideData.partnerName}, A new ride (${rideData.tripId}) is available for ${rideData.date} at ${rideData.time}. Your estimated payout is ${rideData.currencySymbol ?? "€"}${rideData.partnerAmount?.toFixed(2) ?? "0.00"}. Please log in to your dashboard to accept this assignment.`,
    });

    return success;
  } catch (error) {
    console.error("Error sending ride notification email:", error);
    return false;
  }
}
