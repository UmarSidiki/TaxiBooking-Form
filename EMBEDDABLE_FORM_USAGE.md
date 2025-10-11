# Embeddable Form Usage Guide

## Overview
The booking form now supports URL parameters, allowing you to pre-fill form data and navigate directly to specific steps. This is particularly useful for embedding the form on external websites or creating deep links.

## URL Parameters

### Navigation Parameters
- `step` - Jump directly to a specific step (1, 2, or 3)

### Form Data Parameters
- `pickup` - Pre-fill the pickup location
- `dropoff` - Pre-fill the dropoff location
- `date` - Pre-fill the pickup date (format: YYYY-MM-DD)
- `time` - Pre-fill the pickup time (format: HH:MM)
- `passengers` - Pre-fill number of passengers (1-8)
- `tripType` - Pre-fill trip type (`oneway` or `return`)

## Usage Examples

### Example 1: Direct to Vehicle Selection (Step 2)
```
https://your-domain.com/en/embeddable?step=2&pickup=Zurich+Airport&dropoff=Geneva+City+Center&date=2025-10-15&time=14:00&passengers=2&tripType=oneway
```

This will:
- Open the form at Step 2 (Vehicle Selection)
- Pre-fill pickup: "Zurich Airport"
- Pre-fill dropoff: "Geneva City Center"
- Set date: October 15, 2025
- Set time: 14:00
- Set passengers: 2
- Set trip type: One Way

### Example 2: Start at Step 1 with Pre-filled Data
```
https://your-domain.com/en/embeddable?pickup=Bern+Train+Station&dropoff=Basel+Airport&passengers=4
```

This will:
- Start at Step 1 (default)
- Pre-fill pickup: "Bern Train Station"
- Pre-fill dropoff: "Basel Airport"
- Set passengers: 4
- User can modify and continue

### Example 3: Direct to Step 2 (Minimal)
```
https://your-domain.com/en/embeddable?step=2
```

This will:
- Jump directly to Step 2
- User must go back to Step 1 to enter trip details

## Embedding in iFrame

### Basic iFrame
```html
<iframe 
  src="https://your-domain.com/en/embeddable?step=2&pickup=Zurich&dropoff=Geneva" 
  width="100%" 
  height="800px" 
  frameborder="0"
  style="border: none; border-radius: 12px;"
></iframe>
```

### Responsive iFrame
```html
<div style="position: relative; padding-bottom: 100%; height: 0; overflow: hidden;">
  <iframe 
    src="https://your-domain.com/en/embeddable?step=2" 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
  ></iframe>
</div>
```

## WordPress Shortcode Example

Create a custom shortcode in your theme's `functions.php`:

```php
function swissride_booking_form_shortcode($atts) {
    $atts = shortcode_atts(array(
        'step' => '1',
        'pickup' => '',
        'dropoff' => '',
        'date' => '',
        'time' => '',
        'passengers' => '1',
        'triptype' => 'oneway',
    ), $atts);
    
    $params = array();
    if ($atts['step']) $params[] = 'step=' . urlencode($atts['step']);
    if ($atts['pickup']) $params[] = 'pickup=' . urlencode($atts['pickup']);
    if ($atts['dropoff']) $params[] = 'dropoff=' . urlencode($atts['dropoff']);
    if ($atts['date']) $params[] = 'date=' . urlencode($atts['date']);
    if ($atts['time']) $params[] = 'time=' . urlencode($atts['time']);
    if ($atts['passengers']) $params[] = 'passengers=' . urlencode($atts['passengers']);
    if ($atts['triptype']) $params[] = 'tripType=' . urlencode($atts['triptype']);
    
    $query_string = !empty($params) ? '?' . implode('&', $params) : '';
    $url = 'https://your-domain.com/en/embeddable' . $query_string;
    
    return '<iframe src="' . esc_url($url) . '" width="100%" height="900px" frameborder="0" style="border: none; border-radius: 12px;"></iframe>';
}
add_shortcode('swissride_booking', 'swissride_booking_form_shortcode');
```

Usage in WordPress:
```
[swissride_booking step="2" pickup="Zurich Airport" dropoff="Geneva" passengers="2"]
```

## JavaScript Integration

### Dynamic Link Generation
```javascript
function generateBookingLink(params) {
  const baseUrl = 'https://your-domain.com/en/embeddable';
  const queryParams = new URLSearchParams();
  
  if (params.step) queryParams.append('step', params.step);
  if (params.pickup) queryParams.append('pickup', params.pickup);
  if (params.dropoff) queryParams.append('dropoff', params.dropoff);
  if (params.date) queryParams.append('date', params.date);
  if (params.time) queryParams.append('time', params.time);
  if (params.passengers) queryParams.append('passengers', params.passengers);
  if (params.tripType) queryParams.append('tripType', params.tripType);
  
  return `${baseUrl}?${queryParams.toString()}`;
}

// Example usage
const bookingUrl = generateBookingLink({
  step: 2,
  pickup: 'Zurich Airport',
  dropoff: 'Geneva City Center',
  date: '2025-10-15',
  time: '14:00',
  passengers: 2,
  tripType: 'oneway'
});

console.log(bookingUrl);
// Opens booking form in new window
window.open(bookingUrl, '_blank');
```

### Embedded Widget with Parameters
```html
<div id="booking-widget"></div>

<script>
(function() {
  const widgetContainer = document.getElementById('booking-widget');
  const iframe = document.createElement('iframe');
  
  // Configure your parameters
  const params = new URLSearchParams({
    step: '2',
    pickup: 'Zurich Airport',
    dropoff: 'Geneva City Center',
    passengers: '2'
  });
  
  iframe.src = `https://your-domain.com/en/embeddable?${params.toString()}`;
  iframe.width = '100%';
  iframe.height = '900px';
  iframe.frameBorder = '0';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '12px';
  
  widgetContainer.appendChild(iframe);
})();
</script>
```

## React Component Example

```jsx
import React from 'react';

const BookingWidget = ({ 
  step = 1, 
  pickup = '', 
  dropoff = '', 
  date = '', 
  time = '', 
  passengers = 1, 
  tripType = 'oneway' 
}) => {
  const params = new URLSearchParams();
  
  if (step) params.append('step', step.toString());
  if (pickup) params.append('pickup', pickup);
  if (dropoff) params.append('dropoff', dropoff);
  if (date) params.append('date', date);
  if (time) params.append('time', time);
  if (passengers) params.append('passengers', passengers.toString());
  if (tripType) params.append('tripType', tripType);
  
  const iframeUrl = `https://your-domain.com/en/embeddable?${params.toString()}`;
  
  return (
    <iframe
      src={iframeUrl}
      width="100%"
      height="900px"
      frameBorder="0"
      style={{ border: 'none', borderRadius: '12px' }}
      title="Swiss Ride Booking Form"
    />
  );
};

// Usage
<BookingWidget 
  step={2}
  pickup="Zurich Airport"
  dropoff="Geneva City Center"
  passengers={2}
  tripType="oneway"
/>
```

## Important Notes

1. **URL Encoding**: Always URL-encode parameter values, especially locations with spaces
2. **Step Navigation**: If jumping to Step 2 or 3, users can still navigate back to previous steps
3. **Form Persistence**: The form data is saved to localStorage, so users won't lose data on refresh
4. **Validation**: Even with pre-filled data, all validation rules still apply
5. **Distance Calculation**: When both pickup and dropoff are provided via URL, the distance is calculated automatically

## Testing URLs

### Test Direct to Step 2 (Airport Transfer)
```
http://localhost:3000/en/embeddable?step=2&pickup=Geneva+Airport&dropoff=Lausanne+City+Center&date=2025-10-20&time=10:00&passengers=3&tripType=oneway
```

### Test Step 1 Pre-filled
```
http://localhost:3000/en/embeddable?pickup=Bern&dropoff=Zurich&passengers=2
```

### Test Minimal Step 2
```
http://localhost:3000/en/embeddable?step=2
```

## Security Considerations

- All parameters are sanitized and validated before use
- XSS protection is built-in through React's escaping
- Form validation occurs regardless of pre-filled data
- Payment information is never passed via URL parameters

## Support

For questions or issues with the embeddable form, contact:
- Email: booking@swissride-sarl.ch
- Phone: +41 76 3868121
