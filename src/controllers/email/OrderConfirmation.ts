import nodemailer from 'nodemailer';
import Setting from '@/models/Setting';
import { connectDB } from '@/lib/mongoose';

interface BookingData {
  tripId: string;
  pickup: string;
  dropoff: string;
  tripType: string;
  date: string;
  time: string;
  passengers: number;
  selectedVehicle: string;
  vehicleDetails: {
    name: string;
    price: string;
    seats: string;
  };
  childSeats: number;
  babySeats: number;
  notes: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus?: string;
}

function generateEmailHTML(bookingData: BookingData, primaryColor: string, borderRadius: string) {
  const getCurrencySymbol = () => '€';
  
  const icons = {
    checkCircle: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="#059669" stroke-width="2"/><path d="M8 12.5L10.5 15L16 9" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    mapPin: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#6b7280"/></svg>`,
    calendar: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="18" rx="2" stroke="#6b7280" stroke-width="2"/><path d="M3 10h18M8 2v4M16 2v4" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/></svg>`,
    clock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="#6b7280" stroke-width="2"/><path d="M12 6v6l4 2" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/></svg>`,
    refresh: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 10a9 9 0 11-9-9" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/><path d="M21 4v6h-6" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    car: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 13l1.5-4.5h11L19 13m-14 0v6h2v-2h10v2h2v-6M7 16h2m6 0h2" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/></svg>`,
    users: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="9" cy="7" r="4" stroke="#6b7280" stroke-width="2"/><path d="M2 21v-2a5 5 0 015-5h4a5 5 0 015 5v2M16 11a4 4 0 100-8M22 21v-2a5 5 0 00-3-4.58" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/></svg>`,
    baby: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="3" stroke="#6b7280" stroke-width="2"/><path d="M3 21v-2a5 5 0 015-5h8a5 5 0 015 5v2" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/></svg>`,
    note: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 5h10M9 9h10M9 13h10M5 5h0M5 9h0M5 13h0" stroke="#92400e" stroke-width="2" stroke-linecap="round"/></svg>`,
    creditCard: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="5" width="20" height="14" rx="2" stroke="#6b7280" stroke-width="2"/><path d="M2 10h20" stroke="#6b7280" stroke-width="2"/></svg>`,
    phone: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="#1e40af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  };
  
  const statusColors = {
    completed: { bg: '#f0fdf4', text: '#166534' },
    pending: { bg: '#fffbeb', text: '#92400e' },
    failed: { bg: '#fef2f2', text: '#991b1b' },
  };
  
  const paymentStatus = bookingData.paymentStatus || 'pending';
  const statusStyle = statusColors[paymentStatus.toLowerCase() as keyof typeof statusColors] || statusColors.pending;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation - Trip #${bookingData.tripId}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    p { margin: 0; padding: 0; }
  </style>
</head>
<body style="margin: 0; padding: 0; min-width: 100%; background-color: #f9fafb; font-family: Arial, sans-serif;">
  <div style="font-size: 16px; line-height: 1.5; color: #374151;">
  
    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f9fafb; padding: 20px 0;">
      <tr>
        <td align="center" style="padding: 0 20px;">
          <table width="600" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: ${borderRadius};">
            
            <tr>
              <td align="center" style="background-color: #f9fafb; padding: 30px 20px; border-bottom: 1px solid #e5e7eb;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                        <td style="padding-bottom: 12px; text-align: center;">
                            ${icons.checkCircle}
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">
                            <h1 style="margin: 0; color: #111827; font-size: 24px; font-weight: 600;">Booking Confirmed</h1>
                            <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">Trip ID: <strong style="color: #374151;">#${bookingData.tripId}</strong></p>
                        </td>
                    </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding: 24px 24px 16px 24px;">
                <h2 style="margin: 0 0 12px 0; color: #111827; font-size: 18px; font-weight: 600;">Dear ${bookingData.firstName} ${bookingData.lastName},</h2>
                <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.5;">
                  Thank you for choosing our service! Your trip has been confirmed. Please review your booking details below.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding: 0 24px 16px 24px;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f9fafb; border: 1px solid #e5e7eb;">
                  <tr>
                    <td style="padding: 16px;">
                      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                            <td colspan="2" style="padding-bottom: 12px;">
                                <h3 style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">Journey Details</h3>
                            </td>
                        </tr>
                        
                        <tr>
                          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="vertical-align: middle; width: 20px;">${icons.mapPin}</td>
                                <td style="color: #6b7280; font-size: 14px; padding-left: 8px;">From</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${bookingData.pickup}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="vertical-align: middle; width: 20px;">${icons.mapPin}</td>
                                <td style="color: #6b7280; font-size: 14px; padding-left: 8px;">To</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${bookingData.dropoff}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="vertical-align: middle; width: 20px;">${icons.calendar}</td>
                                <td style="color: #6b7280; font-size: 14px; padding-left: 8px;">Date</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${bookingData.date}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="vertical-align: middle; width: 20px;">${icons.clock}</td>
                                <td style="color: #6b7280; font-size: 14px; padding-left: 8px;">Time</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${bookingData.time}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="vertical-align: middle; width: 20px;">${icons.refresh}</td>
                                <td style="color: #6b7280; font-size: 14px; padding-left: 8px;">Trip Type</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right; text-transform: capitalize;">${bookingData.tripType}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding: 0 24px 16px 24px;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f9fafb; border: 1px solid #e5e7eb;">
                  <tr>
                    <td style="padding: 16px;">
                      <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 16px; font-weight: 600;">Vehicle & Capacity</h3>
                      
                      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="color: #6b7280; font-size: 14px;">Vehicle</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${bookingData.vehicleDetails.name}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="color: #6b7280; font-size: 14px;">Max. Seats</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${bookingData.vehicleDetails.seats}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; ${bookingData.childSeats > 0 || bookingData.babySeats > 0 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="vertical-align: middle; width: 20px;">${icons.users}</td>
                                <td style="color: #6b7280; font-size: 14px; padding-left: 8px;">Adult Passengers</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${bookingData.passengers}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        ${bookingData.childSeats > 0 ? `
                        <tr>
                          <td style="padding: 8px 0; ${bookingData.babySeats > 0 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="vertical-align: middle; width: 20px;">${icons.baby}</td>
                                <td style="color: #6b7280; font-size: 14px; padding-left: 8px;">Child Seats</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${bookingData.childSeats}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        ` : ''}
                        ${bookingData.babySeats > 0 ? `
                        <tr>
                          <td style="padding: 8px 0;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="vertical-align: middle; width: 20px;">${icons.baby}</td>
                                <td style="color: #6b7280; font-size: 14px; padding-left: 8px;">Baby Seats</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${bookingData.babySeats}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        ` : ''}
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            ${bookingData.notes ? `
            <tr>
              <td style="padding: 0 24px 16px 24px;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #fffbeb; border: 1px solid #fde68a;">
                  <tr>
                    <td style="padding: 16px;">
                      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td style="vertical-align: top; width: 24px; padding-top: 2px;">${icons.note}</td>
                          <td style="padding-left: 12px;">
                            <p style="margin: 0 0 4px 0; color: #92400e; font-size: 13px; font-weight: 600; text-transform: uppercase;">Special Requests</p>
                            <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">${bookingData.notes}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ` : ''}

            <tr>
              <td style="padding: 0 24px 24px 24px;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f0fdf4; border: 1px solid #bbf7d0;">
                  <tr>
                    <td style="padding: 16px;">
                      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td style="vertical-align: middle;">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                    <td style="vertical-align: middle;">${icons.creditCard}</td>
                                    <td style="color: #111827; font-size: 18px; font-weight: 700; padding-left: 8px;">Total Amount</td>
                                </tr>
                            </table>
                          </td>
                          <td style="text-align: right; vertical-align: middle;">
                            <span style="color: #059669; font-size: 24px; font-weight: 700;">${getCurrencySymbol()}${bookingData.totalAmount.toFixed(2)}</span>
                          </td>
                        </tr>
                        
                        ${bookingData.paymentMethod ? `
                        <tr>
                          <td colspan="2" style="padding-top: 12px;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 4px; padding: 8px; border: 1px solid #e5e7eb;">
                              <tr>
                                <td style="color: #6b7280; font-size: 13px; padding: 4px 0; width: 50%;">Payment Method</td>
                                <td style="color: #111827; font-size: 13px; font-weight: 600; text-align: right; text-transform: capitalize; padding: 4px 0;">${bookingData.paymentMethod.replace('_', ' ')}</td>
                              </tr>
                              <tr>
                                <td style="color: #6b7280; font-size: 13px; padding: 4px 0;">Payment Status</td>
                                <td style="text-align: right; padding: 4px 0;">
                                  <span style="background-color: ${statusStyle.bg}; color: ${statusStyle.text}; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                                    ${bookingData.paymentStatus || 'Pending'}
                                  </span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        ` : ''}
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding: 0 24px 24px 24px;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #eff6ff; border: 1px solid #bfdbfe;">
                  <tr>
                    <td style="padding: 16px;">
                      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td style="vertical-align: top; width: 24px; padding-top: 2px;">${icons.phone}</td>
                          <td style="padding-left: 12px;">
                            <h3 style="margin: 0 0 8px 0; color: #1e40af; font-size: 16px; font-weight: 600;">Need to contact us?</h3>
                            <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
                              If you have any questions or need to make changes to your booking, please don't hesitate to contact us.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="background-color: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Thank you for choosing our service!</p>
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  This is an automated email. Please do not reply to this message.<br>
                  &copy; ${new Date().getFullYear()} Booking Service. All rights reserved.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;
}

export async function sendOrderConfirmationEmail(bookingData: BookingData) {
  try {
    await connectDB();
    const settings = await Setting.findOne();
    
    const primaryColor = settings?.primaryColor || '#1e40af';
    const borderRadiusNum = settings?.borderRadius || 0.5;
    const borderRadius = `${Math.round(borderRadiusNum * 16)}px`;
    
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.log("⚠️ SMTP not configured. Email sending skipped.");
      console.log("✉️ Would send confirmation email to:", bookingData.email);
      return true;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const htmlContent = generateEmailHTML(bookingData, primaryColor, borderRadius);

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Booking Service" <${process.env.SMTP_USER}>`,
      to: bookingData.email,
      subject: `Booking Confirmation - Trip #${bookingData.tripId}`,
      html: htmlContent,
      text: `Booking Confirmed!\n\nTrip ID: ${bookingData.tripId}\nCustomer: ${bookingData.firstName} ${bookingData.lastName}\nFrom: ${bookingData.pickup}\nTo: ${bookingData.dropoff}\nDate: ${bookingData.date} at ${bookingData.time}\nVehicle: ${bookingData.vehicleDetails.name}\nTotal Amount: €${bookingData.totalAmount}`,
    });

    console.log("✅ Confirmation email sent to:", bookingData.email);
    return true;
  } catch (error) {
    console.error("❌ Error sending confirmation email:", error);
    return false;
  }
}