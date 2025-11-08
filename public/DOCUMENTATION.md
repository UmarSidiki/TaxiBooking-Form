# 🚗 Complete Booking System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [For Customers - Booking Process](#for-customers)
3. [For Admins - Dashboard](#for-admins)
4. [For Partners - Partner Portal](#for-partners)
5. [For Drivers - Driver Portal](#for-drivers)
6. [Payment System](#payment-system)
7. [Email Notifications](#email-notifications)
8. [Settings & Configuration](#settings)
9. [Technical Architecture](#technical-architecture)

---

## System Overview

### What Is This System?

This is a **complete transportation booking platform** that allows:
- **Customers** to book vehicles for transfers (one-way or round-trip)
- **Admins** to manage bookings, partners, drivers, and fleet
- **Partners** to receive and manage ride assignments
- **Drivers** to view their assigned rides

### Key Features ✨

✅ **Multi-Language Support** - English, French, German, Spanish, Italian, Dutch, Russian, Arabic
✅ **Multiple Payment Methods** - Stripe, Bank Transfer, Cash, MultiSafepay
✅ **Partner System** - Register, approve, and manage transportation partners
✅ **Driver System** - Assign drivers to specific rides
✅ **Email Notifications** - Automated emails for all actions
✅ **Admin Dashboard** - Complete control panel
✅ **Responsive Design** - Works on desktop, tablet, and mobile
✅ **Embeddable Forms** - 3 different booking form variants

---

## For Customers

### How to Book a Ride

#### Step 1: Trip Details
1. **Choose Booking Type**
   - Transfer (destination-based)
   - Hourly (time-based)

2. **Select Trip Type**
   - One Way
   - Round Trip

3. **Enter Locations**
   - Pickup location (required)
   - Dropoff location (required for transfers)
   - Add multiple stops (optional)
   - Each stop can have a wait duration

4. **Select Date & Time**
   - Departure date and time
   - Return date and time (for round trips)

5. **Passenger Details**
   - Number of passengers
   - Child seats needed
   - Baby seats needed
   - Flight number (optional)
   - Special requests (optional)

#### Step 2: Vehicle Selection
- View available vehicles with:
  - Vehicle name and image
  - Maximum passengers
  - Price per trip
  - Features and amenities
- Select your preferred vehicle

#### Step 3: Payment & Details
1. **Enter Personal Information**
   - First name
   - Last name
   - Email address
   - Phone number

2. **Choose Payment Method**
   - **Card Payment** (Stripe) - Instant confirmation
   - **Bank Transfer** - Manual confirmation
   - **Cash** - Pay driver directly
   - **MultiSafepay** - Multiple payment options

3. **Complete Booking**
   - Review all details
   - Accept terms
   - Submit booking

### After Booking

**Immediate:**
- Confirmation email sent
- Booking ID generated
- Payment processed (if card payment)

**24 Hours After:**
- Thank you email sent automatically

**If Assigned:**
- Driver/Partner assignment email
- Contact details provided

---

## For Admins

### Accessing Admin Dashboard

**URL:** `/dashboard/signin`

**Default Credentials:**
- Create admin account via API or database

### Dashboard Overview

#### Home Page (`/dashboard/home`)
Shows key statistics:
- Total bookings
- Upcoming rides
- Completed rides
- Total revenue
- Recent bookings list

#### Rides Management (`/dashboard/rides`)

**Features:**
- View all bookings (Upcoming, Completed, Canceled)
- Search by trip ID, customer name, email, phone, location
- Filter by:
  - Date range
  - Payment status
  - Sort by date or price
- **Actions per booking:**
  - View full details
  - Assign driver (if driver feature enabled)
  - Assign partner (if partner feature enabled)
  - Cancel booking with refund options
  - View customer information

**Booking Details Include:**
- Trip information (pickup, dropoff, stops)
- Customer details
- Vehicle information
- Payment status
- Assigned driver/partner
- Special requests
- Flight number

#### Partners Management (`/dashboard/partners`)

**Partner Lifecycle:**
1. **Pending** - Just registered, awaiting review
2. **Approved** - Can receive ride assignments
3. **Rejected** - Application denied
4. **Suspended** - Temporarily disabled (30-day deletion)

**Actions:**
- View all partners
- Filter by status
- Review documents
- Approve partners
- Reject with reason
- Suspend with reason
- View partner statistics

#### Drivers Management (`/dashboard/drivers`)

**Features:**
- Add new drivers
- Edit driver information
- Delete drivers
- View driver list
- Assign drivers to rides

**Driver Information:**
- Name
- Email
- Phone
- License number
- Status (active/inactive)

#### Fleet Management (`/dashboard/fleet`)

**Vehicle Management:**
- Add new vehicles
- Edit vehicle details
- Delete vehicles
- Set pricing
- Upload vehicle images

**Vehicle Details:**
- Name
- Type
- Maximum passengers
- Base price
- Price per kilometer
- Price per hour
- Features
- Image

#### Settings (`/dashboard/settings`)

**6 Configuration Tabs:**

1. **Features Tab**
   - Enable/Disable Partners Module
   - Enable/Disable Drivers Module

2. **Appearance Tab**
   - Primary color
   - Secondary color
   - Border radius
   - Redirect URL after booking

3. **Payment Tab**
   - Stripe configuration
   - MultiSafepay configuration
   - Bank transfer details
   - Accepted payment methods

4. **SMTP Tab**
   - Email server configuration
   - Test email functionality
   - Sender name and address

5. **Booking Tab**
   - Booking form settings
   - Default values

6. **Map Tab**
   - Initial map position
   - Country restrictions
   - Google Maps API

---

## For Partners

### Partner Registration

**URL:** `/partners/register`

**Registration Process:**
1. Fill registration form:
   - Company/Personal name
   - Email address
   - Password
   - Phone number
   - Address, City, Country

2. Submit application

3. **Admin receives notification email**

4. Wait for approval

### Partner Login

**URL:** `/partners/login`

### Partner Dashboard

#### Dashboard Home (`/partners/dashboard`)

**For Pending Partners:**
- Upload required documents:
  - Driver's license
  - Insurance
  - Vehicle registration
  - ID document
  - Other documents
- View application status

**For Approved Partners:**
- **Statistics Cards:**
  - Total Rides
  - Upcoming Rides
  - Completed Rides
  - Total Earnings

#### Rides Page (`/partners/rides`)

**Two Views:**
1. **Upcoming Rides** - Future assigned rides
2. **History** - Past completed and canceled rides

**Ride Information:**
- Trip ID
- Customer name and contact
- Pickup and dropoff locations
- Date and time
- Passengers
- Vehicle type
- Payment amount
- Special requests
- Flight number

#### Account Page (`/partners/account`)
- View profile information
- Update details
- Change password
- View account status

### Partner Email Notifications

Partners receive emails for:
- ✅ Application approved
- ❌ Application rejected (with reason)
- ⚠️ Account suspended (with reason)
- 🚗 New ride assigned
- ❌ Ride canceled/reassigned

---

## For Drivers

### Driver Login

**URL:** `/drivers/login`

**Credentials:** Provided by admin

### Driver Dashboard

**Features:**
- View assigned rides
- See upcoming trips
- Access customer contact information
- View trip details

**Ride Information:**
- Customer name and phone
- Pickup location and time
- Dropoff location
- Stops and wait times
- Passengers
- Special requests
- Flight number

### Driver Email Notifications

Drivers receive emails for:
- 🚗 New ride assigned
- ❌ Ride canceled/reassigned

---

## Payment System

### Supported Payment Methods

#### 1. Stripe (Card Payments)
- **Instant confirmation**
- Supports: Credit cards, debit cards, Apple Pay, Google Pay
- **Refunds:** Automatic via Stripe
- **Configuration:** Settings → Payment → Stripe

#### 2. Bank Transfer
- **Manual confirmation**
- Customer receives bank details
- Admin confirms payment manually
- **Refunds:** Manual process
- **Configuration:** Settings → Payment → Bank Transfer

#### 3. Cash
- **Pay driver directly**
- No online payment
- **Refunds:** Manual process

#### 4. MultiSafepay
- **Multiple payment options**
- iDEAL, Bancontact, and more
- **Refunds:** Via MultiSafepay
- **Configuration:** Settings → Payment → MultiSafepay

### Payment Statuses

- **Pending** - Awaiting payment
- **Completed** - Payment received
- **Failed** - Payment failed
- **Refunded** - Money returned to customer

### Refund Process

**For Admins:**
1. Go to Rides page
2. Find the booking
3. Click "Cancel"
4. Set refund percentage (0-100%)
5. Confirm cancellation

**Automatic Refunds:**
- Stripe payments: Instant refund
- Bank transfers: Marked for manual refund

---

## Email Notifications

### Automated Emails

#### Customer Emails
1. **Booking Confirmation** - Immediately after booking
2. **Thank You Email** - 24 hours after trip
3. **Cancellation Email** - When booking is canceled

#### Admin Emails
1. **New Partner Registration** - When partner registers
2. **New Booking Notification** - For each new booking

#### Partner Emails
1. **Application Approved** - When admin approves
2. **Application Rejected** - When admin rejects (with reason)
3. **Account Suspended** - When admin suspends (with reason)
4. **Ride Assigned** - When assigned to a ride
5. **Ride Canceled** - When ride is canceled/reassigned

#### Driver Emails
1. **Ride Assigned** - When assigned to a ride
2. **Ride Canceled** - When ride is canceled/reassigned

### Email Configuration

**Location:** Settings → SMTP

**Required Settings:**
- SMTP Host
- SMTP Port
- SMTP Username
- SMTP Password
- Encryption (TLS/SSL/None)
- Sender Email
- Sender Name

**Test Email:**
- Send test email to verify configuration

---

## Settings & Configuration

### Features Module

**Enable/Disable Modules:**
- **Partners Module** - Show/hide partner system
- **Drivers Module** - Show/hide driver system

**Effects:**
- Hides menu items in sidebar
- Prevents access to disabled features
- Hides assignment options in rides

### Appearance Settings

**Customization:**
- **Primary Color** - Main brand color
- **Secondary Color** - Accent color
- **Border Radius** - Rounded corners (0-2rem)
- **Redirect URL** - Where to send customers after booking

### Map Settings

**Configuration:**
- **Initial Latitude** - Default map center
- **Initial Longitude** - Default map center
- **Country Restrictions** - Limit autocomplete to specific countries

---

## Technical Architecture

### Technology Stack

**Frontend:**
- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS
- Shadcn/ui components

**Backend:**
- Next.js API Routes
- MongoDB (Database)
- Mongoose (ODM)

**Authentication:**
- NextAuth.js
- JWT tokens
- Role-based access control

**Payments:**
- Stripe SDK
- MultiSafepay API

**Email:**
- Nodemailer
- SMTP

### Folder Structure

```
src/
├── models/              [Database Models]
│   ├── booking/        - Booking, PendingBooking
│   ├── partner/        - Partner
│   ├── driver/         - Driver
│   ├── user/           - User, PasswordReset
│   ├── vehicle/        - Vehicle
│   └── settings/       - Setting
│
├── controllers/
│   └── email/          [Email Controllers]
│       ├── admin/      - Admin notifications
│       ├── partners/   - Partner emails
│       ├── bookings/   - Booking emails
│       └── drivers/    - Driver emails
│
├── lib/
│   ├── database/       - MongoDB, Mongoose
│   ├── auth/           - Authentication
│   ├── email.ts        - Email sending
│   └── utils.ts        - Utilities
│
├── app/
│   ├── api/            [API Routes]
│   │   ├── bookings/   - Booking management
│   │   ├── partners/   - Partner management
│   │   ├── drivers/    - Driver management
│   │   ├── vehicles/   - Fleet management
│   │   └── settings/   - Configuration
│   │
│   └── [locale]/       [Pages]
│       ├── dashboard/  - Admin panel
│       ├── partners/   - Partner portal
│       └── drivers/    - Driver portal
│
└── components/         [UI Components]
    ├── form/           - Booking form
    ├── settings/       - Settings tabs
    └── ui/             - Reusable components
```

### Database Models

**Booking:**
- Trip details (pickup, dropoff, stops)
- Customer information
- Vehicle selection
- Payment details
- Assigned driver/partner
- Status and timestamps

**Partner:**
- Company/personal information
- Documents (base64 encoded)
- Status (pending/approved/rejected/suspended)
- Approval/rejection details

**Driver:**
- Personal information
- License details
- Status

**Vehicle:**
- Vehicle details
- Pricing
- Features
- Images

**User:**
- Admin accounts
- Authentication

**Setting:**
- System configuration
- Feature toggles
- Payment settings
- SMTP settings

### API Endpoints

**Bookings:**
- `POST /api/booking` - Create booking
- `GET /api/bookings` - List bookings
- `GET /api/bookings/[id]` - Get booking
- `PATCH /api/bookings/[id]` - Update/cancel booking

**Partners:**
- `POST /api/partners/register` - Register partner
- `GET /api/admin/partners` - List partners
- `PATCH /api/admin/partners/[id]/approve` - Approve partner
- `PATCH /api/admin/partners/[id]/reject` - Reject partner
- `PATCH /api/admin/partners/[id]/suspend` - Suspend partner

**Drivers:**
- `GET /api/drivers` - List drivers
- `POST /api/drivers` - Create driver
- `PATCH /api/drivers/[id]` - Update driver
- `DELETE /api/drivers/[id]` - Delete driver

**Vehicles:**
- `GET /api/vehicles` - List vehicles
- `POST /api/vehicles` - Create vehicle
- `PATCH /api/vehicles/[id]` - Update vehicle
- `DELETE /api/vehicles/[id]` - Delete vehicle

**Settings:**
- `GET /api/settings` - Get settings
- `POST /api/settings` - Update settings

### Security Features

✅ **Authentication** - NextAuth.js with JWT
✅ **Role-Based Access** - Admin, Partner, Driver roles
✅ **API Protection** - Session checks on all routes
✅ **Password Hashing** - bcryptjs
✅ **CSRF Protection** - Built into Next.js
✅ **Input Validation** - Server-side validation
✅ **SQL Injection Prevention** - Mongoose ODM

---

## Quick Start Guide

### For First-Time Setup

1. **Configure SMTP** (Settings → SMTP)
   - Add email server details
   - Test email functionality

2. **Configure Payments** (Settings → Payment)
   - Add Stripe keys (for card payments)
   - Add bank details (for transfers)

3. **Add Vehicles** (Dashboard → Fleet)
   - Create vehicle types
   - Set pricing
   - Upload images

4. **Enable Features** (Settings → Features)
   - Enable Partners module (if needed)
   - Enable Drivers module (if needed)

5. **Customize Appearance** (Settings → Appearance)
   - Set brand colors
   - Configure redirect URL

### For Daily Operations

**As Admin:**
1. Check new bookings daily
2. Assign drivers/partners to rides
3. Review partner applications
4. Monitor payment status
5. Handle cancellations

**As Partner:**
1. Check for new ride assignments
2. Contact customers if needed
3. Complete rides
4. View earnings

**As Driver:**
1. Check assigned rides
2. Note pickup times and locations
3. Contact customers if needed

---

## Support & Maintenance

### Regular Tasks

**Daily:**
- Monitor new bookings
- Check payment status
- Respond to customer inquiries

**Weekly:**
- Review partner applications
- Check system performance
- Verify email delivery

**Monthly:**
- Review revenue reports
- Update vehicle pricing
- Clean up old data

### Troubleshooting

**Emails Not Sending:**
1. Check SMTP settings
2. Test email functionality
3. Verify sender email is valid
4. Check spam folders

**Payments Failing:**
1. Verify Stripe/MultiSafepay keys
2. Check test mode vs live mode
3. Verify webhook configuration

**Partners Can't Login:**
1. Check if account is approved
2. Verify email address
3. Check if account is suspended

---

## Conclusion

This booking system is a complete, production-ready platform for managing transportation bookings. It includes:

✅ Customer booking flow
✅ Admin management panel
✅ Partner portal
✅ Driver portal
✅ Multiple payment methods
✅ Email notifications
✅ Multi-language support
✅ Responsive design

**Status:** Production Ready 🚀

For technical support or customization requests, refer to the codebase documentation in the project root.

---

**Last Updated:** 2025
**Version:** 1.0
**Status:** ✅ Complete & Production Ready
