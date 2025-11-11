import { sendEmail } from "@/lib/email";
import { connectDB } from "@/lib/database";
import { Setting } from "@/models/settings";
import { User } from "@/models/user";

interface PartnerRegistrationData {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  baseUrl?: string;
}

// Email validation utility
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateAdminNotificationHTML(partnerData: PartnerRegistrationData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>New Partner Registration</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #dbeafe; padding: 20px; border-radius: 5px; margin-bottom: 20px; text-align: center; border: 2px solid #3b82f6; }
    .header h1 { margin: 0; color: #1e40af; }
    .notification-icon { font-size: 48px; margin-bottom: 10px; }
    .section { margin-bottom: 20px; }
    .details { background-color: #f7fafc; padding: 15px; border-radius: 5px; }
    .details ul { margin: 0; padding-left: 20px; }
    .details li { margin-bottom: 8px; }
    .footer { color: #718096; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
    .cta-button { 
      display: inline-block; 
      background-color: #1e40af; 
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
      <div class="notification-icon">🔔</div>
      <h1>New Partner Registration</h1>
      <p>A new partner has registered and is awaiting approval</p>
    </div>

    <div class="section">
      <h2>Partner Details</h2>
      <div class="details">
        <ul>
          <li><span class="highlight">Name:</span> ${partnerData.name}</li>
          <li><span class="highlight">Email:</span> ${partnerData.email}</li>
          ${partnerData.phone ? `<li><span class="highlight">Phone:</span> ${partnerData.phone}</li>` : ''}
          ${partnerData.city ? `<li><span class="highlight">City:</span> ${partnerData.city}</li>` : ''}
          ${partnerData.country ? `<li><span class="highlight">Country:</span> ${partnerData.country}</li>` : ''}
        </ul>
      </div>
    </div>

    <div class="section">
      <p>Please review the partner's application and documents in the admin dashboard.</p>
    </div>

    <div style="text-align: center;">
      <a href="${partnerData.baseUrl}/dashboard/partners" class="cta-button">
        Review Partner Application
      </a>
    </div>

    <div class="footer">
      <p>This is an automated notification from your booking system.</p>
      <p>© ${new Date().getFullYear()} Booking Service. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendAdminPartnerRegistrationEmail(partnerData: PartnerRegistrationData) {
  try {
    // Get SMTP settings and admin email
    await connectDB();
    const settings = await Setting.findOne();
    
    // Get all admin users
    const adminUsers = await User.find({ role: 'admin' }).select('email');
    
    if (!adminUsers || adminUsers.length === 0) {
      console.error("No admin users found to notify");
      return false;
    }

    const fromAddress = settings?.smtpFrom || settings?.smtpUser || "noreply@booking.com";
    const fromField = settings?.smtpSenderName ? `${settings.smtpSenderName} <${fromAddress}>` : fromAddress;
    
    const emailHTML = generateAdminNotificationHTML(partnerData);

    // Send email to all admins
    let allSuccess = true;
    for (const admin of adminUsers) {
      if (!isValidEmail(admin.email)) {
        console.error("Invalid admin email address:", admin.email);
        continue;
      }

      const success = await sendEmail({
        from: fromField,
        to: admin.email,
        subject: "🔔 New Partner Registration - Action Required",
        html: emailHTML,
        text: `New Partner Registration\n\nName: ${partnerData.name}\nEmail: ${partnerData.email}\n${partnerData.phone ? `Phone: ${partnerData.phone}\n` : ''}${partnerData.city ? `City: ${partnerData.city}\n` : ''}${partnerData.country ? `Country: ${partnerData.country}\n` : ''}\n\nPlease review the partner application in the admin dashboard.`,
      });

      if (!success) {
        console.error("Failed to send notification to admin:", admin.email);
        allSuccess = false;
      }
    }

    return allSuccess;
  } catch (error) {
    console.error("Error sending admin partner registration email:", error);
    return false;
  }
}
