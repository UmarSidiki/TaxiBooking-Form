# Embeddable Form - iFrame Integration Guide

## Overview
The embeddable booking form at `/[locale]/embeddable/v1` is designed to work seamlessly in iframes across all platforms, including iOS Safari.

## How It Works

### Desktop & Same-Origin iFrames
When the form is embedded in an iframe on the same domain or on desktop browsers, it will automatically redirect the parent window to the booking page.

### iOS Safari & Cross-Origin iFrames
iOS Safari blocks cross-origin iframe navigation for security. In this case, the form will:
1. Send a `postMessage` to the parent window
2. Open the booking page in a new tab as a fallback

## Parent Page Integration

If you're embedding this form in an iframe on a different domain, add this JavaScript to your parent page to handle the redirect message:

```html
<script>
  // Listen for booking redirect messages from the embedded form
  window.addEventListener('message', function(event) {
    // For production, replace '*' with your booking form domain
    // if (event.origin !== 'https://your-booking-domain.com') return;
    
    if (event.data && event.data.type === 'BOOKING_REDIRECT') {
      // Redirect the parent page to the booking form
      window.location.href = event.data.url;
    }
  });
</script>
```

## Embedding the Form

### Basic Embed Code

```html
<iframe 
  src="https://your-domain.com/en/embeddable/v1"
  width="320"
  height="600"
  frameborder="0"
  scrolling="no"
  style="border: none; max-width: 100%;"
  title="Booking Form"
></iframe>
```

### Responsive Embed

```html
<div style="max-width: 320px; margin: 0 auto;">
  <iframe 
    src="https://your-domain.com/en/embeddable/v1"
    width="100%"
    height="600"
    frameborder="0"
    scrolling="no"
    style="border: none;"
    title="Booking Form"
  ></iframe>
</div>
```

## Supported Locales

Replace `en` in the URL with any supported locale:
- `/en/embeddable/v1` (English)
- `/fr/embeddable/v1` (French)
- `/de/embeddable/v1` (German)
- `/es/embeddable/v1` (Spanish)

## Features

✅ Google Maps autocomplete for addresses
✅ Destination-based or hourly bookings
✅ One-way and round-trip options
✅ Cross-platform compatibility (iOS, Android, Desktop)
✅ Transparent background (only form has white background)
✅ Automatic parent window redirection
✅ Fallback to new tab on iOS Safari

## Security Note

For production, update the `postMessage` listener to check the `event.origin` to ensure messages are only accepted from your trusted booking form domain:

```javascript
if (event.origin !== 'https://your-booking-domain.com') return;
```

## Testing

1. **Same-origin**: Navigate directly to `/en/embeddable/v1` - should redirect normally
2. **Cross-origin desktop**: Embed in iframe from different domain - should redirect parent
3. **iOS Safari**: Embed in iframe - should either redirect or open new tab
4. **With postMessage**: Add listener to parent page - should redirect parent page on iOS
