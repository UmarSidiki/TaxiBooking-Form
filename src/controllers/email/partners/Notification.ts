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

function generateApprovalEmailHTML(partnerData: PartnerData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Partner Application Approved</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f0fdf4; padding: 20px; border-radius: 5px; margin-bottom: 20px; text-align: center; border: 2px solid #86efac; }
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
    .highlight { color: #2d3748; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="success-icon">✅</div>
      <h1>Congratulations!</h1>
      <p>Your Partner Application Has Been Approved</p>
    </div>

    <div class="section">
      <p>Dear ${partnerData.name},</p>
      <p>We are pleased to inform you that your partner application has been <strong>approved</strong>!</p>
      <p>You can now log in to your partner dashboard and start accepting ride assignments.</p>
    </div>

    <div class="section">
      <div class="details">
        <h3>Next Steps:</h3>
        <ol>
          <li>Log in to your partner dashboard</li>
          <li>Review your profile information</li>
          <li>Check for assigned rides</li>
          <li>Start accepting bookings</li>
        </ol>
      </div>
    </div>

    <div style="text-align: center;">
      <a href="${partnerData.baseUrl?.replace(/\/$/, "")}/partners/login" class="cta-button">
        Go to Partner Dashboard
      </a>
    </div>

    <div class="footer">
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
      <p>Thank you for partnering with us!</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateRejectionEmailHTML(partnerData: PartnerData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Partner Application Status</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #fef2f2; padding: 20px; border-radius: 5px; margin-bottom: 20px; text-align: center; border: 2px solid #fca5a5; }
    .header h1 { margin: 0; color: #991b1b; }
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
    .highlight { color: #2d3748; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="warning-icon">⚠️</div>
      <h1>Application Update</h1>
      <p>Regarding Your Partner Application</p>
    </div>

    <div class="section">
      <p>Dear ${partnerData.name},</p>
      <p>Thank you for your interest in becoming a partner with us. After careful review of your application, we regret to inform you that we are unable to approve your application at this time.</p>
    </div>

    ${
      partnerData.rejectionReason
        ? `
    <div class="section">
      <div class="details">
        <h3>Reason:</h3>
        <p>${partnerData.rejectionReason}</p>
      </div>
    </div>
    `
        : ""
    }

    <div class="section">
      <p>If you believe this decision was made in error or if you would like to reapply after addressing the concerns, please contact our support team.</p>
    </div>

    <div style="text-align: center;">
      <a href="${partnerData.baseUrl?.replace(/\/$/, "")}/contact" class="cta-button">
        Contact Support
      </a>
    </div>

    <div class="footer">
      <p>We appreciate your interest and wish you the best in your future endeavors.</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateSuspensionEmailHTML(partnerData: PartnerData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Partner Account Suspended</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #fef3c7; padding: 20px; border-radius: 5px; margin-bottom: 20px; text-align: center; border: 2px solid #fbbf24; }
    .header h1 { margin: 0; color: #92400e; }
    .warning-icon { font-size: 48px; margin-bottom: 10px; }
    .section { margin-bottom: 20px; }
    .details { background-color: #fef2f2; padding: 15px; border-radius: 5px; border-left: 4px solid #ef4444; }
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
    .warning-box { 
      background-color: #fee2e2; 
      border: 2px solid #ef4444; 
      padding: 15px; 
      border-radius: 5px; 
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="warning-icon">🚫</div>
      <h1>Account Suspended</h1>
      <p>Important Notice About Your Partner Account</p>
    </div>

    <div class="section">
      <p>Dear ${partnerData.name},</p>
      <p>We regret to inform you that your partner account has been <strong>suspended</strong>.</p>
    </div>

    ${
      partnerData.rejectionReason
        ? `
    <div class="section">
      <div class="details">
        <h3>Reason for Suspension:</h3>
        <p>${partnerData.rejectionReason}</p>
      </div>
    </div>
    `
        : ""
    }

    <div class="warning-box">
      <h3 style="margin-top: 0; color: #991b1b;">⚠️ Important: Data Deletion Notice</h3>
      <p><strong>Your account data will be permanently deleted after 30 days from the suspension date.</strong></p>
      <p>If you wish to appeal this decision or have any questions, please contact our support team immediately.</p>
    </div>

    <div class="section">
      <h3>What This Means:</h3>
      <ul>
        <li>You can no longer access your partner dashboard</li>
        <li>You will not receive new ride assignments</li>
        <li>Your account data will be deleted in 30 days</li>
        <li>You can appeal this decision by contacting support</li>
      </ul>
    </div>

    <div style="text-align: center;">
      <a href="${partnerData.baseUrl?.replace(/\/$/, "")}/contact" class="cta-button">
        Contact Support
      </a>
    </div>

    <div class="footer">
      <p>If you believe this suspension was made in error, please reach out to our support team as soon as possible.</p>
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
    
    const emailHTML = generateApprovalEmailHTML(partnerData);

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
    
    const emailHTML = generateRejectionEmailHTML(partnerData);

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

    const emailHTML = generateSuspensionEmailHTML(partnerData);

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

function generateRideNotificationEmailHTML(rideData: RideNotificationData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>New Ride Assignment Available</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #e0f2fe; padding: 20px; border-radius: 5px; margin-bottom: 20px; text-align: center; border: 2px solid #0ea5e9; }
    .header h1 { margin: 0; color: #0369a1; }
    .notification-icon { font-size: 48px; margin-bottom: 10px; }
    .section { margin-bottom: 20px; }
    .ride-details { background-color: #f0f9ff; padding: 15px; border-radius: 5px; border-left: 4px solid #0ea5e9; }
    .ride-details h3 { color: #0369a1; margin-top: 0; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
    .detail-item { background-color: white; padding: 8px; border-radius: 3px; }
    .detail-label { font-weight: bold; color: #64748b; font-size: 0.9em; }
    .detail-value { color: #1e293b; margin-top: 2px; }
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

    const emailHTML = generateRideNotificationEmailHTML(rideData);

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
