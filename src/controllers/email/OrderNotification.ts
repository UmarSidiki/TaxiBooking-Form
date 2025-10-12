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

function generateOwnerEmailHTML(bookingData: BookingData, primaryColor: string, borderRadius: string) {
  const getCurrencySymbol = () => '€';
  
  // SVG Icons as inline data - kept concise and inline for reliability
  const icons = {
    bell: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    user: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="5" stroke="#111827" stroke-width="2"/><path d="M3 21v-2a5 5 0 015-5h8a5 5 0 015 5v2" stroke="#111827" stroke-width="2" stroke-linecap="round"/></svg>`,
    mail: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="4" width="20" height="16" rx="2" stroke="#374151" stroke-width="2"/><path d="M2 7l10 7 10-7" stroke="#374151" stroke-width="2" stroke-linecap="round"/></svg>`,
    phone: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    mapPin: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#374151"/></svg>`,
    calendar: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="18" rx="2" stroke="#374151" stroke-width="2"/><path d="M3 10h18M8 2v4M16 2v4" stroke="#374151" stroke-width="2" stroke-linecap="round"/></svg>`,
    clock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="#374151" stroke-width="2"/><path d="M12 6v6l4 2" stroke="#374151" stroke-width="2" stroke-linecap="round"/></svg>`,
    refresh: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 10a9 9 0 11-9-9" stroke="#374151" stroke-width="2" stroke-linecap="round"/><path d="M21 4v6h-6" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    car: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 13l1.5-4.5h11L19 13m-14 0v6h2v-2h10v2h2v-6M7 16h2m6 0h2" stroke="#374151" stroke-width="2" stroke-linecap="round"/></svg>`,
    users: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="9" cy="7" r="4" stroke="#374151" stroke-width="2"/><path d="M2 21v-2a5 5 0 015-5h4a5 5 0 015 5v2M16 11a4 4 0 100-8M22 21v-2a5 5 0 00-3-4.58" stroke="#374151" stroke-width="2" stroke-linecap="round"/></svg>`,
    baby: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="3" stroke="#374151" stroke-width="2"/><path d="M3 21v-2a5 5 0 015-5h8a5 5 0 015 5v2" stroke="#374151" stroke-width="2" stroke-linecap="round"/></svg>`,
    note: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 5h10M9 9h10M9 13h10M5 5h0M5 9h0M5 13h0" stroke="#92400e" stroke-width="2" stroke-linecap="round"/></svg>`,
    creditCard: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="5" width="20" height="14" rx="2" stroke="#111827" stroke-width="2"/><path d="M2 10h20" stroke="#111827" stroke-width="2"/></svg>`,
    alert: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 9v4M12 17h.01" stroke="#0891b2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="10" stroke="#0891b2" stroke-width="2"/></svg>`,
  };
  
  // Dynamic payment status colors
  const statusColors = {
    completed: { bg: '#d1fae5', text: '#065f46' },
    pending: { bg: '#fef3c7', text: '#92400e' },
    failed: { bg: '#fee2e2', text: '#991b1b' },
  };
  
  const paymentStatus = bookingData.paymentStatus || 'pending';
  const statusStyle = statusColors[paymentStatus.toLowerCase() as keyof typeof statusColors] || statusColors.pending;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>New Booking Notification - Trip #${bookingData.tripId}</title>
  <style type="text/css">
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    /* Inter font import (with system fallbacks) */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    p { margin: 0; padding: 0; }
  </style>
</head>
<body style="margin: 0; padding: 0; min-width: 100%; background-color: #f3f4f6;">
  <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #4b5563;">
  
    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f3f4f6; padding: 40px 0;">
      <tr>
        <td align="center" style="padding: 0 20px;">
          <table width="600" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: ${borderRadius}; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); overflow: hidden;">
            
            <tr>
              <td align="center" style="background: linear-gradient(145deg, #1e40af 0%, #1e3a8a 100%); padding: 40px 30px; border-radius: ${borderRadius} ${borderRadius} 0 0;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                        <td style="padding-bottom: 12px; text-align: center;">
                            ${icons.bell}
                        </td>
                    </tr>
                    <tr>
                        <td style="text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">New Booking Alert!</h1>
                            <p style="margin: 8px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9; font-weight: 500;">Trip ID: <strong style="color: #ffffff;">#${bookingData.tripId}</strong></p>
                        </td>
                    </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding: 32px 32px 24px 32px;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #dbeafe; border-radius: ${borderRadius}; border: 1px solid #93c5fd; border-left: 4px solid #3b82f6;">
                  <tr>
                    <td style="padding: 16px 20px;">
                      <p style="margin: 0; color: #1e40af; font-size: 15px; font-weight: 600; letter-spacing: -0.1px;">
                        📋 You have received a new booking request!
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding: 0 32px 24px 32px;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f9fafb; border-radius: ${borderRadius}; border: 1px solid #e5e7eb; border-left: 4px solid ${primaryColor};">
                  <tr>
                    <td style="padding: 20px 24px;">
                      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                            <td colspan="2" style="padding-bottom: 16px;">
                                <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                                    <tr>
                                        <td style="vertical-align: middle;">${icons.user}</td>
                                        <td style="color: #111827; font-size: 17px; font-weight: 600; padding-left: 8px;">Customer Contact</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <tr>
                          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="color: #6b7280; font-size: 14px; font-weight: 500; vertical-align: middle;">Full Name</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right; vertical-align: middle;">${bookingData.firstName} ${bookingData.lastName}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="vertical-align: middle; width: 20px;">${icons.mail}</td>
                                <td style="color: #6b7280; font-size: 14px; font-weight: 500; padding-left: 8px; vertical-align: middle;">Email</td>
                                <td style="text-align: right; vertical-align: middle;"><a href="mailto:${bookingData.email}" style="color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 600;">${bookingData.email}</a></td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="vertical-align: middle; width: 20px;">${icons.phone}</td>
                                <td style="color: #6b7280; font-size: 14px; font-weight: 500; padding-left: 8px; vertical-align: middle;">Phone</td>
                                <td style="text-align: right; vertical-align: middle;"><a href="tel:${bookingData.phone}" style="color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 600;">${bookingData.phone}</a></td>
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
              <td style="padding: 0 32px 24px 32px;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f9fafb; border-radius: ${borderRadius}; border: 1px solid #e5e7eb;">
                  <tr>
                    <td style="padding: 20px 24px;">
                      <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 17px; font-weight: 600;">Journey Details</h3>
                      
                      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="vertical-align: middle; width: 20px;">${icons.mapPin}</td>
                                <td style="color: #6b7280; font-size: 14px; font-weight: 500; padding-left: 8px;">Pickup</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${bookingData.pickup}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="vertical-align: middle; width: 20px;">${icons.mapPin}</td>
                                <td style="color: #6b7280; font-size: 14px; font-weight: 500; padding-left: 8px;">Dropoff</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${bookingData.dropoff}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="vertical-align: middle; width: 20px;">${icons.calendar}</td>
                                <td style="color: #6b7280; font-size: 14px; font-weight: 500; padding-left: 8px;">Date</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${bookingData.date}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="vertical-align: middle; width: 20px;">${icons.clock}</td>
                                <td style="color: #6b7280; font-size: 14px; font-weight: 500; padding-left: 8px;">Time</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${bookingData.time}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="vertical-align: middle; width: 20px;">${icons.refresh}</td>
                                <td style="color: #6b7280; font-size: 14px; font-weight: 500; padding-left: 8px;">Trip Type</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right; text-transform: capitalize;">${bookingData.tripType}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="vertical-align: middle; width: 20px;">${icons.car}</td>
                                <td style="color: #6b7280; font-size: 14px; font-weight: 500; padding-left: 8px;">Vehicle</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${bookingData.vehicleDetails.name}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; ${bookingData.childSeats > 0 || bookingData.babySeats > 0 ? 'border-bottom: 1px solid #f3f4f6;' : ''}">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="vertical-align: middle; width: 20px;">${icons.users}</td>
                                <td style="color: #6b7280; font-size: 14px; font-weight: 500; padding-left: 8px;">Passengers</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${bookingData.passengers}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        ${bookingData.childSeats > 0 ? `
                        <tr>
                          <td style="padding: 10px 0; ${bookingData.babySeats > 0 ? 'border-bottom: 1px solid #f3f4f6;' : ''}">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="vertical-align: middle; width: 20px;">${icons.baby}</td>
                                <td style="color: #6b7280; font-size: 14px; font-weight: 500; padding-left: 8px;">Child Seats</td>
                                <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${bookingData.childSeats}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        ` : ''}
                        ${bookingData.babySeats > 0 ? `
                        <tr>
                          <td style="padding: 10px 0;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td style="vertical-align: middle; width: 20px;">${icons.baby}</td>
                                <td style="color: #6b7280; font-size: 14px; font-weight: 500; padding-left: 8px;">Baby Seats</td>
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
              <td style="padding: 0 32px 24px 32px;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #fffbeb; border-radius: ${borderRadius}; border: 1px solid #fde68a; border-left: 4px solid #f59e0b;">
                  <tr>
                    <td style="padding: 16px 20px;">
                      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td style="vertical-align: top; width: 24px; padding-top: 2px;">${icons.note}</td>
                          <td style="padding-left: 12px;">
                            <p style="margin: 0 0 4px 0; color: #92400e; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Special Requests</p>
                            <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">${bookingData.notes}</p>
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
              <td style="padding: 0 32px 32px 32px;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #05966915; border-radius: ${borderRadius}; border: 1px solid #05966950;">
                  <tr>
                    <td style="padding: 24px;">
                      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td style="vertical-align: middle;">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                    <td style="vertical-align: middle;">${icons.creditCard}</td>
                                    <td style="color: #111827; font-size: 20px; font-weight: 700; padding-left: 10px; line-height: 1;">Payment Summary</td>
                                </tr>
                            </table>
                          </td>
                          <td style="text-align: right; vertical-align: middle;">
                            <span style="color: #059669; font-size: 34px; font-weight: 700; letter-spacing: -0.5px; line-height: 1;">${getCurrencySymbol()}${bookingData.totalAmount.toFixed(2)}</span>
                          </td>
                        </tr>
                        
                        ${bookingData.paymentMethod ? `
                        <tr>
                          <td colspan="2" style="padding-top: 18px;">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #ffffff; border-radius: 8px; padding: 12px; border: 1px solid #e5e7eb;">
                              <tr>
                                <td style="color: #6b7280; font-size: 13px; font-weight: 500; padding: 4px 0; width: 50%;">Payment Method</td>
                                <td style="color: #111827; font-size: 13px; font-weight: 600; text-align: right; text-transform: capitalize; padding: 4px 0;">${bookingData.paymentMethod.replace('_', ' ')}</td>
                              </tr>
                              <tr>
                                <td style="color: #6b7280; font-size: 13px; font-weight: 500; padding: 4px 0;">Payment Status</td>
                                <td style="text-align: right; padding: 4px 0;">
                                  <span style="background-color: ${statusStyle.bg}; color: ${statusStyle.text}; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">
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
              <td style="padding: 0 32px 32px 32px;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f0f9ff; border-radius: ${borderRadius}; border: 1px solid #bfdbfe;">
                  <tr>
                    <td style="padding: 24px;">
                      <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td style="vertical-align: top; width: 24px; padding-top: 2px;">${icons.alert}</td>
                          <td style="padding-left: 12px;">
                            <h3 style="margin: 0 0 8px 0; color: #1e40af; font-size: 17px; font-weight: 600;">⚡ Action Required</h3>
                            <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">
                              Please review this booking and confirm the trip details with the customer. 
                              ${bookingData.paymentStatus === 'pending' ? '<strong>Payment confirmation is pending.</strong>' : ''}
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
              <td align="center" style="background-color: #f9fafb; padding: 32px; border-top: 2px solid #e5e7eb; border-radius: 0 0 ${borderRadius} ${borderRadius};">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; font-weight: 500; letter-spacing: 0.2px;">
                  Booking Management System
                </p>
                <div style="padding-top: 10px; border-top: 1px solid #e5e7eb; margin-top: 10px;">
                  <p style="margin: 0; color: #9ca3af; font-size: 11px; line-height: 1.5;">
                    This is an automated notification. Check your dashboard for details.<br>
                    &copy; ${new Date().getFullYear()} Booking Service. All rights reserved.
                  </p>
                </div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
      <tr>
          <td height="40" style="font-size: 1px; line-height: 1px;">&nbsp;</td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;
}

export async function sendOrderNotificationEmail(bookingData: BookingData) {
  try {
    // Get owner email from environment
    const ownerEmail = process.env.OWNER_EMAIL;
    
    if (!ownerEmail) {
      console.log("⚠️ OWNER_EMAIL not configured. Owner notification skipped.");
      return true;
    }

    // Connect to database and get theme settings
    await connectDB();
    const settings = await Setting.findOne();
    
    const primaryColor = settings?.primaryColor || '#EAB308';
    const borderRadiusNum = settings?.borderRadius || 0.5;
    const borderRadius = `${borderRadiusNum * 16}px`;
    
    // Check if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.log("⚠️ SMTP not configured. Email sending skipped.");
      console.log("✉️ Would send notification email to:", ownerEmail);
      return true;
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Generate HTML email
    const htmlContent = generateOwnerEmailHTML(bookingData, primaryColor, borderRadius);

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Booking System" <${process.env.SMTP_USER}>`,
      to: ownerEmail,
      subject: `New Booking Alert - Trip #${bookingData.tripId}`,
      html: htmlContent,
      text: `New Booking Received!\n\nTrip ID: ${bookingData.tripId}\nCustomer: ${bookingData.firstName} ${bookingData.lastName}\nEmail: ${bookingData.email}\nPhone: ${bookingData.phone}\nFrom: ${bookingData.pickup}\nTo: ${bookingData.dropoff}\nDate: ${bookingData.date} at ${bookingData.time}\nVehicle: ${bookingData.vehicleDetails.name}\nTotal Amount: €${bookingData.totalAmount}\n\nPlease review and confirm this booking.`,
    });

    console.log("✅ Notification email sent to owner:", ownerEmail);
    return true;
  } catch (error) {
    console.error("❌ Error sending notification email:", error);
    // Don't throw error - booking should succeed even if email fails
    return false;
  }
}