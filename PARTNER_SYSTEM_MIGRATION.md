# Partner System Migration Guide

## Overview
This guide explains the transformation from the Driver system to the Partner system with self-registration and document verification.

## What Changed

### 1. New Partner Model
- **Location**: `src/models/Partner.ts`
- **Features**:
  - Self-registration capability
  - Document upload and verification
  - Status management (pending, approved, rejected, suspended)
  - Contact information (phone, address, city, country)
  - Admin approval workflow

### 2. Partner Registration
- **Public Registration Page**: `/partners/register`
- **File**: `src/app/[locale]/(pages)/partners/register/page.tsx`
- Partners can self-register without admin intervention
- After registration, partners must upload documents for verification

### 3. Document Verification System
Partners can upload multiple document types:
- Driver's License
- Insurance
- Vehicle Registration
- ID Card
- Other documents

Each document has its own status: pending, approved, or rejected

### 4. Admin Approval Workflow
Admins can:
- View all partners and filter by status
- Review uploaded documents
- Approve or reject partner applications
- Add notes and rejection reasons

## API Endpoints

### Partner Registration
```
POST /api/partners/register
Body: {
  name, email, password, phone, address, city, country
}
```

### Document Upload (Partner)
```
POST /api/partners/upload-document
Body: {
  type: "license" | "insurance" | "registration" | "id" | "other",
  fileName: string,
  fileUrl: string
}
```

### Admin - Get All Partners
```
GET /api/admin/partners?status=pending
```

### Admin - Approve Partner
```
PATCH /api/admin/partners/[id]/approve
```

### Admin - Reject Partner
```
PATCH /api/admin/partners/[id]/reject
Body: { reason: string }
```

## Migration Steps

### Step 1: Update Authentication
✅ Updated `src/lib/auth/options.ts` to support partner authentication
- Partners authenticate with "partner" role
- Status checks prevent rejected/suspended partners from logging in
- Legacy driver support maintained for backward compatibility

### Step 2: Update Routes
You need to rename/update these routes:

#### From Driver to Partner:
- `/drivers` → `/partners`
- `/drivers/login` → `/partners/login`
- `/drivers/dashboard` → `/partners/dashboard`

#### Files to Update:
1. **Partner Login Page**
   - Copy: `src/app/[locale]/(pages)/drivers/login/page.tsx`
   - To: `src/app/[locale]/(pages)/partners/login/page.tsx`
   - Update references from "driver" to "partner"

2. **Partner Dashboard**
   - Copy: `src/app/[locale]/(pages)/drivers/(protected)/dashboard/page.tsx`
   - To: `src/app/[locale]/(pages)/partners/(protected)/dashboard/page.tsx`
   - Add document upload functionality

3. **Partner Layout**
   - Copy: `src/app/[locale]/(pages)/drivers/(protected)/layout.tsx`
   - To: `src/app/[locale]/(pages)/partners/(protected)/layout.tsx`
   - Update role check from "driver" to "partner"

### Step 3: Update Admin Dashboard
Add a new "Partners" section in the admin dashboard:

1. **Partners List Page**
   - Location: `src/app/[locale]/(pages)/dashboard/(protected)/partners/page.tsx`
   - Features:
     - List all partners
     - Filter by status (pending, approved, rejected, suspended)
     - View partner details and documents
     - Approve/reject actions

2. **Update Sidebar**
   - Add "Partners" menu item
   - Replace or keep "Drivers" for legacy support

### Step 4: Update Booking System
Update booking assignments to use partners instead of drivers:

1. **Booking Model** (`src/models/Booking.ts`)
   - Rename `assignedDriver` to `assignedPartner` (or keep both for compatibility)
   
2. **API Routes**
   - Update `/api/dashboard/bookings/[id]/assign` to assign partners
   - Update `/api/partners/rides` (formerly `/api/drivers/rides`)

### Step 5: File Upload Configuration
You'll need to set up file storage for document uploads:

**Options:**
1. **AWS S3** - Recommended for production
2. **Cloudinary** - Easy to set up
3. **Local Storage** - Development only

**Example with Cloudinary:**
```typescript
// Install: npm install cloudinary
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
```

## Database Migration

### Option 1: Fresh Start
If you don't have existing drivers, no migration needed. Just use the new Partner model.

### Option 2: Migrate Existing Drivers
If you have existing drivers in the database, run this migration script:

```javascript
// scripts/migrate-drivers-to-partners.js
const mongoose = require('mongoose');
const Driver = require('../src/models/Driver').default;
const Partner = require('../src/models/Partner').default;

async function migrateDriversToPartners() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const drivers = await Driver.find({});
  
  for (const driver of drivers) {
    await Partner.create({
      name: driver.name,
      email: driver.email,
      password: driver.password,
      status: 'approved', // Auto-approve existing drivers
      isActive: driver.isActive,
      registeredAt: driver.createdAt,
      approvedAt: new Date(),
      documents: [],
    });
  }
  
  console.log(`Migrated ${drivers.length} drivers to partners`);
  await mongoose.disconnect();
}

migrateDriversToPartners();
```

## UI Components Needed

### 1. Partner Dashboard Components
- Document upload form
- Document list with status badges
- Profile information display
- Verification status banner

### 2. Admin Components
- Partner list table with filters
- Partner detail modal
- Document viewer
- Approve/reject dialog with reason input

## Security Considerations

1. **Document Storage**
   - Store documents in secure cloud storage
   - Generate signed URLs for temporary access
   - Never expose direct file URLs

2. **Access Control**
   - Only partners can upload their own documents
   - Only admins can approve/reject
   - Implement rate limiting on uploads

3. **File Validation**
   - Validate file types (PDF, JPG, PNG only)
   - Limit file sizes (e.g., 5MB max)
   - Scan for malware if possible

## Testing Checklist

- [ ] Partner can register successfully
- [ ] Partner receives confirmation email
- [ ] Partner can log in after registration
- [ ] Partner can upload documents
- [ ] Admin can view pending partners
- [ ] Admin can approve partners
- [ ] Admin can reject partners with reason
- [ ] Approved partners can access dashboard
- [ ] Rejected partners cannot log in
- [ ] Documents are stored securely
- [ ] File upload validation works

## Next Steps

1. **Create Partner Login Page** - Copy and modify driver login
2. **Create Partner Dashboard** - Add document upload UI
3. **Create Admin Partners Page** - List and manage partners
4. **Set Up File Storage** - Configure S3/Cloudinary
5. **Add Email Notifications** - Notify partners of approval/rejection
6. **Update Navigation** - Add partner links to menus
7. **Test End-to-End** - Complete registration to approval flow

## Support

For questions or issues during migration, refer to:
- Partner Model: `src/models/Partner.ts`
- Registration API: `src/app/api/partners/register/route.ts`
- Admin APIs: `src/app/api/admin/partners/`
