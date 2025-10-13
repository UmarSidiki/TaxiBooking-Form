import nodemailer from "nodemailer";
import Setting from "@/models/Setting";
import { connectDB } from "@/lib/mongoose";

interface BookingData {
  tripId: string;
  pickup: string;
  dropoff: string;
  tripType: string;
  date: string;
  time: string;
  passengers: number;
  selectedVehicle: string;
  vehicleDetails?: {
    name?: string;
    price?: string;
    seats?: string;
  };
  childSeats: number;
  babySeats: number;
  notes?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalAmount: number;
  refundAmount?: number;
  refundPercentage?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  canceledAt?: Date | string | null;
}

function generateEmailHTML(
  bookingData: BookingData,
  primaryColor: string,
  borderRadius: string
) {
  const getCurrencySymbol = () => "€";
  const refundAmount = bookingData.refundAmount ?? 0;
  const refundPercentage = bookingData.refundPercentage ?? null;
  const canceledAt = bookingData.canceledAt
    ? new Date(bookingData.canceledAt).toLocaleString()
    : new Date().toLocaleString();

  const icons = {
    warning: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 9v4M12 17h.01" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10.29 3.85997L1.82 18C1.6 18.382 1.485 18.815 1.487 19.256C1.489 19.697 1.607 20.129 1.833 20.508C2.059 20.887 2.383 21.2 2.77 21.411C3.156 21.622 3.591 21.724 4.03 21.706H19.97C20.409 21.724 20.844 21.622 21.23 21.411C21.617 21.2 21.941 20.887 22.167 20.508C22.393 20.129 22.511 19.697 22.513 19.256C22.515 18.815 22.4 18.382 22.18 18L13.71 3.85997C13.481 3.50008 13.17 3.2099 12.809 3.01761C12.447 2.82532 12.046 2.73796 11.64 2.76431C11.234 2.79066 10.843 2.92963 10.512 3.16771C10.18 3.40579 9.92179 3.73497 9.76997 4.11997L9.70997 4.23997L10.29 3.85997Z" fill="#dc2626"/></svg>`,
    mapPin: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#6b7280"/></svg>`,
    calendar: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="18" rx="2" stroke="#6b7280" stroke-width="2"/><path d="M3 10h18M8 2v4M16 2v4" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/></svg>`,
    clock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="#6b7280" stroke-width="2"/><path d="M12 6v6l4 2" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/></svg>`,
    car: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 13l1.5-4.5h11L19 13m-14 0v6h2v-2h10v2h2v-6M7 16h2m6 0h2" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/></svg>`,
    refund: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12a9 9 0 00-9-9 9 9 0 00-6.36 2.64" stroke="#059669" stroke-width="2" stroke-linecap="round"/><path d="M21 7v5h-5" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 12a9 9 0 009 9 9 9 0 006.36-2.64" stroke="#059669" stroke-width="2" stroke-linecap="round"/><path d="M3 17v-5h5" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Cancellation</title>
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
              <td align="center" style="background-color: #f3f4f6; padding: 30px 20px; border-bottom: 1px solid #e5e7eb;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td style="padding-bottom: 12px; text-align: center;">
                      ${icons.warning}
                    </td>
                  </tr>
                  <tr>
                    <td style="text-align: center;">
                      <h1 style="margin: 0; color: #111827; font-size: 24px; font-weight: 600;">Booking Cancelled</h1>
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
                  Your booking has been cancelled as of ${canceledAt}. Please review the details below. If you have any questions, please contact our support team.
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
                          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="vertical-align: middle; width: 20px;">${icons.mapPin}</td>
                                <td style="color: #6b7280; font-size: 14px; padding-left: 8px;">Pickup</td>
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
                                <td style="color: #6b7280; font-size: 14px; padding-left: 8px;">Dropoff</td>
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
                          <td style="padding: 8px 0;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="vertical-align: middle; width: 20px;">${icons.clock}</td>
                                <td style="color: #6b7280; font-size: 14px; padding-left: 8px;">Time</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${bookingData.time}</td>
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
                      <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 16px; font-weight: 600;">Payment & Refund</h3>
                      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="vertical-align: middle; width: 20px;">${icons.car}</td>
                                <td style="color: #6b7280; font-size: 14px; padding-left: 8px;">Vehicle</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${bookingData.vehicleDetails?.name || bookingData.selectedVehicle}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="color: #6b7280; font-size: 14px;">Total Paid</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${getCurrencySymbol()}${bookingData.totalAmount.toFixed(2)}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="vertical-align: middle; width: 20px;">${icons.refund}</td>
                                <td style="color: #059669; font-size: 14px; font-weight: 600; padding-left: 8px;">Refund Amount</td>
                                <td style="color: #059669; font-size: 14px; font-weight: 700; text-align: right;">${getCurrencySymbol()}${refundAmount.toFixed(2)}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        ${refundPercentage !== null ? `
                        <tr>
                          <td style="padding: 8px 0;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="color: #6b7280; font-size: 14px;">Refund Percentage</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${refundPercentage}%</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        ` : ""}
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding: 0 24px 24px 24px;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f0fdf4; border: 1px solid #bbf7d0;">
                  <tr>
                    <td style="padding: 16px;">
                      <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.5;">
                        The refund will be processed back to your original payment method. Depending on your bank, it may take 5-10 business days to appear on your statement.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="background-color: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Need help? Contact our support team.</p>
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  This is an automated message. &copy; ${new Date().getFullYear()} Booking Service. All rights reserved.
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

export async function sendOrderCancellationEmail(bookingData: BookingData) {
  try {
    await connectDB();
    const settings = await Setting.findOne();

    const primaryColor = settings?.primaryColor || "#1e40af";
    const borderRadiusNum = settings?.borderRadius || 0.5;
    const borderRadius = `${Math.round(borderRadiusNum * 16)}px`;

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.log("⚠️ SMTP not configured. Email sending skipped.");
      console.log("✉️ Would send cancellation email to:", bookingData.email);
      return true;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const htmlContent = generateEmailHTML(bookingData, primaryColor, borderRadius);

    const refundAmountText = (bookingData.refundAmount ?? 0).toFixed(2);
    const refundPercentText = bookingData.refundPercentage
      ? `${bookingData.refundPercentage}%`
      : "N/A";

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Booking Service" <${process.env.SMTP_USER}>`,
      to: bookingData.email,
      subject: `Booking Cancelled - Trip #${bookingData.tripId}`,
      html: htmlContent,
      text: `Your booking (Trip #${bookingData.tripId}) has been cancelled.

Cancellation Details:
- Pickup: ${bookingData.pickup}
- Dropoff: ${bookingData.dropoff}
- Date: ${bookingData.date} at ${bookingData.time}
- Refund Amount: €${refundAmountText}
- Refund Percentage: ${refundPercentText}

If you have any questions, reply to this email and our team will assist you.`,
    });

    console.log("✅ Cancellation email sent to:", bookingData.email);
    return true;
  } catch (error) {
    console.error("❌ Error sending cancellation email:", error);
    return false;
  }
}