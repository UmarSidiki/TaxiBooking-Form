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

function generateAdminNotificationHTML(partnerData: PartnerRegistrationData, primaryColor: string = '#EAB308') {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>New Partner Registration</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background-color: #f5f5f5; padding: 15px; border-left: 4px solid ${primaryColor}; margin-bottom: 20px; }
    .header h1 { margin: 0 0 5px 0; font-size: 18px; color: ${primaryColor}; }
    .section { margin-bottom: 20px; }
    .section h2 { font-size: 15px; color: ${primaryColor}; margin: 15px 0 8px 0; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; }
    tr { border-bottom: 1px solid #f0f0f0; }
    td { padding: 6px 0; font-size: 13px; }
    td:first-child { width: 40%; color: #666; }
    .details { background-color: #f9f9f9; padding: 10px; border-radius: 3px; }
    .footer { font-size: 12px; color: #999; margin-top: 25px; border-top: 1px solid #ddd; padding-top: 15px; }
    a { color: ${primaryColor}; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Partner Registration</h1>
      <p>A new partner awaits approval</p>
    </div>

    <div class="section">
      <h2>Partner Details</h2>
      <div class="details">
        <table>
          <tr><td><strong>Name:</strong></td><td>${partnerData.name}</td></tr>
          <tr><td><strong>Email:</strong></td><td><a href="mailto:${partnerData.email}">${partnerData.email}</a></td></tr>
          ${partnerData.phone ? `<tr><td><strong>Phone:</strong></td><td>${partnerData.phone}</td></tr>` : ''}
          ${partnerData.city ? `<tr><td><strong>City:</strong></td><td>${partnerData.city}</td></tr>` : ''}
          ${partnerData.country ? `<tr><td><strong>Country:</strong></td><td>${partnerData.country}</td></tr>` : ''}
        </table>
      </div>
    </div>

    <div class="section">
      <p>Review the partner application in the admin dashboard.</p>
    </div>

    <div class="section">
      <p>Review application: <a href="${partnerData.baseUrl?.replace(/\/$/, "")}/dashboard/partners">Go to Partners</a></p>
    </div>

    <div class="footer">
      <p>This is an automated notification.</p>
      <p>&copy; ${new Date().getFullYear()} Booking Service. All rights reserved.</p>
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
    const primaryColor = settings?.primaryColor || '#EAB308';
    
    const emailHTML = generateAdminNotificationHTML(partnerData, primaryColor);

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
