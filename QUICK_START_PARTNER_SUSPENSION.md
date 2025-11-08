# Quick Start: Partner Suspension & Email Notifications

## ⚡ Quick Setup (5 minutes)

### 1. Configure SMTP (Required for emails)
```
Admin Panel → Settings → Email
- Add SMTP Host, Port, Username, Password
- Add From Email Address
- Test SMTP connection
```

### 2. Environment Variables
```bash
# Add to .env.local
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # or your domain
```

### 3. Deploy
```bash
npm run build
# Deploy to your hosting (Vercel, etc.)
```

## 🎯 How to Use

### Approve a Partner
1. Go to **Admin → Partners**
2. Click on a pending partner
3. Click **"Approve Partner"**
4. ✅ Partner receives approval email automatically

### Reject a Partner
1. Go to **Admin → Partners**
2. Click on a pending partner
3. Click **"Reject"**
4. Enter rejection reason
5. Click **"Confirm Rejection"**
6. ✅ Partner receives rejection email with reason

### Suspend a Partner
1. Go to **Admin → Partners**
2. Click on an **approved** partner
3. Click **"Suspend Partner"**
4. Enter suspension reason
5. Read the 30-day warning
6. Click **"Confirm Suspension"**
7. ✅ Partner receives suspension email with warning
8. ✅ Partner data will be deleted in 30 days

## 🔄 Automatic Deletion

The cron job runs daily at midnight and automatically deletes suspended partners after 30 days.

**Cron Endpoint**: `GET /api/cron`

**Already configured** - No additional setup needed if you're using Vercel or have existing cron setup.

## 📧 Email Templates

### What Partners Receive

**Approval Email**:
- ✅ Congratulations message
- Link to dashboard
- Next steps

**Rejection Email**:
- Reason for rejection
- Contact support link
- Professional tone

**Suspension Email**:
- ⚠️ **30-day deletion warning**
- Suspension reason
- Appeal instructions
- Contact support link

## 🧪 Quick Test

### Test the Full Flow
```bash
# 1. Create a test partner (use /partners/register)
# 2. Approve them (check email)
# 3. Suspend them (check email)
# 4. Run cron manually:
curl http://localhost:3000/api/cron

# 5. Check MongoDB - partner should still exist (30 days not passed)
# 6. Manually set scheduledDeletionAt to yesterday in MongoDB
# 7. Run cron again
curl http://localhost:3000/api/cron

# 8. Check MongoDB - partner should be deleted
```

## 📊 Monitor Deletions

Check cron job logs:
```json
{
  "success": true,
  "partnerDeletion": {
    "success": true,
    "deleted": 2,
    "deletedNames": ["Partner 1", "Partner 2"],
    "deletedIds": ["id1", "id2"]
  }
}
```

## 🔍 Troubleshooting

### Emails Not Sending
- ✅ Check SMTP settings in Admin → Settings → Email
- ✅ Test SMTP connection
- ✅ Check spam folder
- ✅ Verify `NEXT_PUBLIC_BASE_URL` is set

### Cron Not Running
- ✅ Check Vercel cron configuration
- ✅ Manually trigger: `curl https://yourdomain.com/api/cron`
- ✅ Check logs in Vercel dashboard

### Partner Not Deleted After 30 Days
- ✅ Check `scheduledDeletionAt` field in MongoDB
- ✅ Verify cron job is running daily
- ✅ Check cron job logs for errors

## 📝 API Endpoints

```typescript
// Approve partner
PATCH /api/admin/partners/[id]/approve

// Reject partner
PATCH /api/admin/partners/[id]/reject
Body: { reason: string }

// Suspend partner
PATCH /api/admin/partners/[id]/suspend
Body: { reason: string }

// Cron job (includes partner deletion)
GET /api/cron
```

## ✅ Checklist

- [ ] SMTP configured
- [ ] Environment variables set
- [ ] Tested approval email
- [ ] Tested rejection email
- [ ] Tested suspension email
- [ ] Verified cron job runs
- [ ] Tested 30-day deletion
- [ ] Deployed to production

## 🎉 You're Done!

The system is now fully operational:
- Partners receive emails on status changes
- Suspended partners are automatically deleted after 30 days
- All workflows are automated
- No manual intervention needed

For detailed documentation, see:
- `PARTNER_EMAIL_NOTIFICATIONS.md` - Complete feature guide
- `PARTNER_SUSPENSION_SUMMARY.md` - Implementation summary
