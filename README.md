# Meet Swiss-Transfers Booking System

A comprehensive, enterprise-grade transport booking management solution built with **Next.js 15**. This application streamlines the entire lifecycle of professional driver services, from client reservations to fleet dispatching and partner management.

It is designed for shuttle services, private transfer companies, and chauffeurs who need a modern, automated booking engine with robust backend management.

## 🌟 Core Modules

### 1. 🚍 Customer Booking Engine
A seamless, 3-step wizard optimized for conversion:
- **Ride Details**: Integrated with **Google Maps API** for autocomplete, distance matrix calculations, and route visualization. Supports one-way, round-trip, and hourly bookings.
- **Vehicle Selection**: Dynamic display of available fleet categories (Economy, Business, Van, etc.) with automated pricing based on distance, duration, and vehicle base rates.
- **Secure Payment**: Clients can pay online via **Stripe** (Credit Cards) or **MultiSafepay** (iDEAL, Bancontact, etc.), or choose cash on delivery.

### 2. ⚡ Admin Dashboard
A powerful command center for business owners:
- **Ride Management**: View, edit, specificy drivers, or cancel incoming bookings. Monitor ride status (Pending, Paid, Completed, Cancelled).
- **Fleet Control**: Manage vehicle inventory, set pricing rules (per km/hour), and configure luggage/passenger capacities.
- **System Configuration**: Update website settings, SMTP email servers, payment API keys, and map restrictions directly from the UI.
- **Revenue Insights**: Basic dashboard for tracking bookings and revenue flows.

### 3. 🤝 Partner & Driver Portals
Dedicated interfaces for your workforce:
- **Partner Portal**: Allows external transport companies to register, upload compliance documents (licenses, insurance), and accept "farmed-out" or affiliate rides.
- **Driver Mobile View**: Simplified dashboard for drivers to view their upcoming schedule, trip details, and navigation links.

## 🚀 Key Features

-   **Dynamic Pricing Engine**: Automatically calculates fares based on distance, time, return trips, and vehicle class multipliers.
-   **Global Payment Processing**: Native integration with **Stripe** and **MultiSafepay** webhooks for real-time payment status updates.
-   **Automated Communication**:
    -   Instant email confirmations for clients and admins using **Nodemailer**.
    -   Professional PDF Invoices generated on-the-fly with `@react-pdf/renderer`.
-   **Internationalization (i18n)**: Fully localized in 8 languages (English, German, French, Italian, Spanish, Dutch, Russian, Arabic) using `next-intl`.
-   **Role-Based Security**: Secure authentication and session management via **NextAuth.js** with distinct roles for Admin, Partner, and Driver.
-   **Smart Address Handling**: Limits location search to specific countries and manages custom service area bounds.

## 🛠️ Tech Stack

-   **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/) (Radix Primitives)
-   **Database**: [MongoDB](https://www.mongodb.com/) & [Mongoose](https://mongoosejs.com/)
-   **Auth**: [NextAuth.js](https://next-auth.js.org/)
-   **Maps & Geocoding**: Google Maps JavaScript API, Places API, Distance Matrix API
-   **Forms**: React Hook Form & Zod Validation
-   **Emails**: Nodemailer with Handlebars templates
-   **PDFs**: @react-pdf/renderer

## 🏁 Getting Started

### Prerequisites
-   Node.js 18+
-   MongoDB Instance (Local or Atlas)
-   Google Maps API Key (Places, Maps JS, Distance Matrix enabled)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/UmarSidiki/TaxiBooking-Form.git
    cd TaxiBooking-Form
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Copy the example environment file:
    ```bash
    cp .env.example .env.local
    ```
    Populate `.env.local` with your credentials:
    -   `MONGODB_URI`
    -   `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
    -   `NEXTAUTH_SECRET`

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Access the app at [http://localhost:3000](http://localhost:3000).

## 📂 Project Structure

```text
src/
├── app/                  # Next.js App Router
│   ├── [locale]/         # Localized routes (Main App)
│   ├── api/              # API Endpoints (Booking, Admin, Webhooks)
├── components/
│   ├── form/             # Multi-step Booking Wizard Components
│   ├── settings/         # Admin Dashboard Settings Panels
│   ├── payment/          # Stripe/MultiSafepay Forms
├── lib/                  # Utilities (DB, Email, Auth)
├── messages/             # i18n Translation Files (JSON)
├── models/               # Mongoose Data Models (Booking, User, Vehicle)
└── style/                # Tailwind & Global Styles
```
