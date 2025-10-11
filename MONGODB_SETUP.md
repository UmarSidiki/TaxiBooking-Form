# 🔧 MongoDB Connection Fix Guide

## Problem
You're experiencing this error:
```
Error creating payment intent: [MongooseError: Operation `settings.findOne()` buffering timed out after 10000ms]
```

This means the MongoDB connection is not established or configured properly.

---

## ✅ Solution

### Step 1: Create `.env.local` File

Create a file named `.env.local` in the root of your project (same level as `package.json`):

```bash
# MongoDB Connection (REQUIRED)
MONGODB_URI=mongodb://localhost:27017/booking-form

# Google Maps API (REQUIRED for address autocomplete)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here

# Email Configuration
OWNER_EMAIL=owner@yourcompany.com

# Stripe Keys (Optional - can configure in dashboard instead)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### Step 2: MongoDB Setup Options

#### Option A: Local MongoDB (Recommended for Development)

1. **Install MongoDB locally**:
   - Download from: https://www.mongodb.com/try/download/community
   - Install with default settings
   - MongoDB will run on `mongodb://localhost:27017`

2. **Use this connection string**:
   ```bash
   MONGODB_URI=mongodb://localhost:27017/booking-form
   ```

3. **Start MongoDB** (if not running):
   ```bash
   # Windows (run as administrator)
   net start MongoDB
   
   # Or use MongoDB Compass (GUI) to connect
   ```

#### Option B: MongoDB Atlas (Cloud - Free Tier)

1. **Create free account**: https://www.mongodb.com/cloud/atlas/register
2. **Create cluster** (free M0 tier)
3. **Get connection string**:
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your password
   - Replace `<dbname>` with `booking-form`

4. **Use this connection string**:
   ```bash
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/booking-form?retryWrites=true&w=majority
   ```

5. **Whitelist your IP**:
   - In Atlas dashboard: Network Access → Add IP Address
   - Add `0.0.0.0/0` (allow from anywhere) for development

---

## 🔄 After Configuration

1. **Restart your development server**:
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

2. **Verify connection**:
   - Server should start without MongoDB errors
   - Check console for successful connection message

---

## 🧪 Testing the Fix

1. **Go to Settings Page**: http://localhost:3000/dashboard/settings
2. **Configure Stripe** (Payment tab):
   - Add your Stripe test keys
   - Select currency
   - Enable payment methods
3. **Try to create a booking**:
   - Fill in booking form
   - Select credit card payment
   - Should now successfully create payment intent

---

## ⚠️ Common Issues

### Issue: "MONGODB_URI is not defined"
**Solution**: Make sure `.env.local` file is in the project root and restart the server.

### Issue: "Connection timed out"
**Solution**: 
- Check if MongoDB is running (local setup)
- Check IP whitelist (Atlas setup)
- Verify connection string is correct

### Issue: "Authentication failed"
**Solution**: 
- Check username/password in connection string
- Make sure user has read/write permissions

---

## 📁 File Structure

Your project should look like this:
```
booking-form/
├── .env.local          ← Create this file (not tracked by git)
├── .env.example        ← Template (already exists)
├── package.json
├── src/
│   ├── app/
│   ├── lib/
│   │   └── mongoose.ts
│   └── models/
└── ...
```

---

## 🔐 Security Note

- `.env.local` is in `.gitignore` - never commit it to git
- Use `.env.example` as a template
- Never expose MongoDB credentials in public repositories

---

## 🎯 Quick Setup Commands

```bash
# 1. Create .env.local file
# (Copy from .env.example and fill in your values)
cp .env.example .env.local

# 2. Edit .env.local with your values
# (Use notepad, VS Code, or any text editor)

# 3. Restart the development server
npm run dev
```

---

## ✅ Verification Checklist

- [ ] `.env.local` file created in project root
- [ ] `MONGODB_URI` is set correctly
- [ ] MongoDB is running (local) or accessible (Atlas)
- [ ] Development server restarted
- [ ] No MongoDB connection errors in console
- [ ] Settings page loads successfully
- [ ] Payment intent API works without timeout

---

## 💡 Alternative: Use Stripe Keys from Environment

If you prefer not to store Stripe keys in database settings, you can use environment variables:

```bash
# In .env.local
STRIPE_PUBLISHABLE_KEY=pk_test_51abcd...
STRIPE_SECRET_KEY=sk_test_51abcd...
```

The code will automatically use these as fallback if not configured in the dashboard.

---

## 📞 Need Help?

If you're still experiencing issues:
1. Check the server console for specific error messages
2. Verify MongoDB connection with a tool like MongoDB Compass
3. Test the connection string with a simple script
4. Check that all required environment variables are set

---

## 🚀 Once Fixed

After MongoDB is connected, you'll be able to:
- ✅ Store settings in the database
- ✅ Create payment intents with Stripe
- ✅ Save bookings to the database
- ✅ Use all payment methods (card, cash, bank transfer)
- ✅ Store vehicle and pricing information
