# MongoDB Document Storage Implementation ✅

## Overview
Documents are now stored directly in MongoDB as base64-encoded strings with a maximum file size of 1MB.

## Implementation Details

### File Storage Method
- **Storage**: MongoDB (base64 encoded)
- **Max File Size**: 1MB (1,048,576 bytes)
- **Allowed Formats**: PDF, JPG, JPEG, PNG
- **Encoding**: Base64 with data URI prefix

### Database Schema

#### Partner Document Schema
```typescript
{
  type: "license" | "insurance" | "registration" | "id" | "other",
  fileName: string,           // Original filename
  fileData: string,           // Base64 encoded file with data URI
  mimeType: string,           // e.g., 'image/jpeg', 'application/pdf'
  fileSize: number,           // Size in bytes
  status: "pending" | "approved" | "rejected",
  uploadedAt: Date,
  reviewedAt?: Date,
  reviewedBy?: string,
  rejectionReason?: string
}
```

### Upload Process

#### 1. Client-Side (Partner Dashboard)
```typescript
// File validation
- Check file size (max 1MB)
- Check file type (PDF, JPG, PNG only)
- Convert to base64 using FileReader
- Send to API with metadata
```

#### 2. Server-Side (API)
```typescript
// Validation
- Verify file size <= 1MB
- Verify mime type is allowed
- Verify base64 format is valid
- Store in MongoDB
```

### File Size Considerations

#### Why 1MB?
1. **MongoDB Document Limit**: 16MB per document
2. **Performance**: Faster queries and transfers
3. **Reasonable Quality**: Sufficient for document verification
4. **Network Efficiency**: Quick uploads/downloads

#### Storage Capacity
- Each partner can upload multiple documents
- Typical document sizes:
  - Scanned ID: 200-500 KB
  - Photo of license: 300-800 KB
  - PDF document: 100-500 KB
- Average partner with 4 documents: ~2-3 MB total

### Features Implemented

#### Partner Dashboard
✅ File upload with drag-and-drop support
✅ Real-time file size validation
✅ File type validation
✅ Base64 conversion
✅ Upload progress indication
✅ Document list with file sizes
✅ Download functionality
✅ Status badges

#### Admin Dashboard
✅ Document viewer with preview
✅ Image preview for JPG/PNG
✅ PDF preview in iframe
✅ Download functionality
✅ File size display
✅ Document status management

### API Endpoints

#### Upload Document
```
POST /api/partners/upload-document

Body:
{
  type: string,
  fileName: string,
  fileData: string,      // Base64 with data URI
  mimeType: string,
  fileSize: number
}

Validations:
- File size <= 1MB
- Mime type in allowed list
- Valid base64 format
```

#### Get Partner Profile
```
GET /api/partners/profile

Returns:
- Partner data with all documents
- Documents include base64 data for download
```

### Security Considerations

#### Implemented
✅ File size limits (1MB)
✅ File type restrictions (PDF, JPG, PNG only)
✅ Base64 format validation
✅ Authentication required for upload
✅ Role-based access control
✅ Document status tracking

#### Additional Recommendations
- Consider adding virus scanning for production
- Implement rate limiting on uploads
- Add document expiration dates
- Log all document access for audit trail

### Performance Optimization

#### Current Implementation
- Documents stored in same collection as partner
- Base64 encoding increases size by ~33%
- Efficient for small files (<1MB)

#### If Scaling Needed
Consider these optimizations:
1. **GridFS**: For files >1MB
2. **Separate Collection**: Store documents separately
3. **Compression**: Compress before base64 encoding
4. **CDN**: Cache frequently accessed documents

### Usage Examples

#### Partner Uploads Document
```typescript
// 1. User selects file
const file = event.target.files[0];

// 2. Validate
if (file.size > 1024 * 1024) {
  throw new Error("File too large");
}

// 3. Convert to base64
const reader = new FileReader();
reader.onload = async (e) => {
  const fileData = e.target.result; // data:image/jpeg;base64,...
  
  // 4. Upload
  await fetch('/api/partners/upload-document', {
    method: 'POST',
    body: JSON.stringify({
      type: 'license',
      fileName: file.name,
      fileData,
      mimeType: file.type,
      fileSize: file.size
    })
  });
};
reader.readAsDataURL(file);
```

#### Admin Views Document
```typescript
// 1. Fetch partner with documents
const partner = await Partner.findById(id);

// 2. Display in browser
<img src={document.fileData} alt={document.fileName} />

// Or for PDF
<iframe src={document.fileData} />

// 3. Download
const link = document.createElement('a');
link.href = document.fileData;
link.download = document.fileName;
link.click();
```

### File Format Details

#### Base64 Data URI Format
```
data:[mimeType];base64,[base64EncodedData]

Examples:
data:image/jpeg;base64,/9j/4AAQSkZJRg...
data:application/pdf;base64,JVBERi0xLjQK...
data:image/png;base64,iVBORw0KGgoAAAA...
```

#### Size Calculation
```
Original File: 750 KB
Base64 Encoded: ~1000 KB (33% increase)
Total in MongoDB: ~1000 KB
```

### Monitoring & Maintenance

#### Things to Monitor
- Average document size per partner
- Total storage used
- Upload success/failure rates
- Document approval times

#### Maintenance Tasks
- Periodically review rejected documents
- Clean up old rejected applications
- Archive approved partners after X years
- Monitor MongoDB collection size

### Advantages of MongoDB Storage

✅ **Simplicity**: No external storage service needed
✅ **Consistency**: Documents stored with partner data
✅ **Backup**: Included in MongoDB backups
✅ **Transactions**: Atomic operations with partner updates
✅ **Cost**: No additional storage costs
✅ **Speed**: Fast for small files

### Limitations

⚠️ **File Size**: Limited to 1MB per file
⚠️ **Scaling**: Not ideal for thousands of large files
⚠️ **Bandwidth**: Base64 increases transfer size
⚠️ **Query Performance**: Large documents slow queries

### Migration Path (If Needed)

If you need to scale beyond 1MB or handle many documents:

1. **GridFS** (MongoDB's file storage system)
   - Handles files >16MB
   - Chunks large files automatically
   - Built into MongoDB

2. **Cloud Storage** (S3, Cloudinary, etc.)
   - Unlimited file sizes
   - CDN integration
   - Better for high traffic

3. **Hybrid Approach**
   - Small files (<1MB) in MongoDB
   - Large files in cloud storage
   - Best of both worlds

## Testing Checklist

✅ Upload 100KB image - Success
✅ Upload 900KB PDF - Success
✅ Upload 1.1MB file - Rejected with error
✅ Upload invalid file type - Rejected
✅ Download uploaded document - Works
✅ Admin view document - Preview works
✅ Multiple documents per partner - Works
✅ Document status tracking - Works

## Conclusion

The MongoDB storage implementation is:
- ✅ Production ready for documents <1MB
- ✅ Simple and maintainable
- ✅ Secure with proper validations
- ✅ Performant for typical use cases
- ✅ Easy to backup and restore
- ✅ No external dependencies

Perfect for document verification workflows where files are typically scanned documents, photos of IDs, and certificates.
